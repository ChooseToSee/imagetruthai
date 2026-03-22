import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PRODUCT_TIER_MAP: Record<string, string> = {
  "prod_U46ynL0lG0C32s": "plus",
  "prod_U6iRCnETvveMML": "plus",
  "prod_U46zg6w4ycRsro": "pro",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      logStep("No Stripe customer found");
      // Sync to DB
      await supabaseClient.from("profiles").update({ is_pro: false, subscription_tier: "free" }).eq("user_id", user.id);
      return new Response(JSON.stringify({ subscribed: false, product_id: null, subscription_end: null, subscription_tier: "free" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found customer", { customerId });

    // Check for active, past_due, or trialing subscriptions
    const [activeRes, pastDueRes, trialingRes] = await Promise.all([
      stripe.subscriptions.list({ customer: customerId, status: "active", limit: 1 }),
      stripe.subscriptions.list({ customer: customerId, status: "past_due", limit: 1 }),
      stripe.subscriptions.list({ customer: customerId, status: "trialing", limit: 1 }),
    ]);

    const allSubs = [...activeRes.data, ...pastDueRes.data, ...trialingRes.data];
    const hasValidSub = allSubs.length > 0;
    let productId = null;
    let subscriptionEnd = null;
    let status = null;
    let subscriptionTier = "free";

    if (hasValidSub) {
      // Prefer active > trialing > past_due
      const subscription = activeRes.data[0] || trialingRes.data[0] || pastDueRes.data[0];
      const periodEnd = subscription.current_period_end;
      try {
        if (typeof periodEnd === "number") {
          subscriptionEnd = new Date(periodEnd * 1000).toISOString();
        } else if (periodEnd) {
          subscriptionEnd = String(periodEnd);
        }
      } catch (e) {
        logStep("WARN: Could not parse current_period_end", { periodEnd, error: String(e) });
      }
      productId = subscription.items.data[0].price.product;
      status = subscription.status;
      subscriptionTier = PRODUCT_TIER_MAP[productId as string] || "free";
      logStep("Valid subscription", { productId, subscriptionEnd, status, subscriptionTier });
    }

    // Sync tier to database
    const isPro = hasValidSub && subscriptionTier !== "free";
    await supabaseClient.from("profiles").update({
      is_pro: isPro,
      subscription_tier: subscriptionTier,
    }).eq("user_id", user.id);

    return new Response(JSON.stringify({
      subscribed: hasValidSub,
      product_id: productId,
      subscription_end: subscriptionEnd,
      status,
      subscription_tier: subscriptionTier,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    const isKeyError = errorMessage.includes("Invalid API Key") || errorMessage.includes("api_key_expired");
    if (isKeyError) {
      // Return graceful fallback — treat as free tier rather than hard error
      logStep("WARN: Stripe key invalid/expired, returning free tier fallback");
      return new Response(JSON.stringify({
        subscribed: false, product_id: null, subscription_end: null,
        subscription_tier: "free", _stripe_key_error: true,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    const safeMessage = errorMessage.includes("Authentication") || errorMessage.includes("No authorization")
      ? errorMessage
      : "Failed to check subscription status";
    return new Response(JSON.stringify({ error: safeMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
