import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Whitelist of valid price IDs
const VALID_PRICE_IDS: Record<string, string> = {
  "price_1T8V0AANKKxH2qnACu534N2d": "plus",
  "price_1TB4NgANKKxH2qnAVJZo3Wti": "plus",
  "price_1T8V0AANKKxH2qnAA1EizK0M": "pro",
  "price_1TB4TJANKKxH2qnAo1Ciwlem": "pro",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      console.error("[CREATE-CHECKOUT] STRIPE_SECRET_KEY not set");
      return new Response(JSON.stringify({ error: "Payment system is temporarily unavailable. Please try again later." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 503,
      });
    }

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    const { priceId } = await req.json();
    if (!priceId || typeof priceId !== "string" || !VALID_PRICE_IDS[priceId]) {
      return new Response(JSON.stringify({ error: "Invalid price ID" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-08-27.basil",
    });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      allow_promotion_codes: true,
      subscription_data: {
        trial_period_days: 7,
      },
      success_url: `${req.headers.get("origin")}/?checkout=success`,
      cancel_url: `${req.headers.get("origin")}/?checkout=canceled`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[CREATE-CHECKOUT] Error:", error);
    const rawMessage = error instanceof Error ? error.message : "Checkout failed";
    // Detect expired/invalid Stripe key and return user-friendly message
    const isKeyError = rawMessage.includes("Invalid API Key") || rawMessage.includes("api_key_expired");
    const message = isKeyError
      ? "Payment system is temporarily unavailable. Please try again later or contact support."
      : rawMessage;
    return new Response(
      JSON.stringify({ error: message, _stripe_key_error: isKeyError }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: isKeyError ? 503 : 500,
      }
    );
  }
});
