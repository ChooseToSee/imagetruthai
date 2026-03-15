import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      return new Response(JSON.stringify({ error: "STRIPE_SECRET_KEY not set" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // Log key prefix for debugging (safe - only first 8 chars)
    const keyPrefix = stripeKey.substring(0, 12);
    console.log(`[CHECK-STRIPE] Key prefix: ${keyPrefix}...`);

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Retrieve account info
    const account = await stripe.accounts.retrieve();

    // Check key type
    const isLiveKey = stripeKey.startsWith("sk_live_");
    const isTestKey = stripeKey.startsWith("sk_test_");
    const isRestrictedKey = stripeKey.startsWith("rk_live_") || stripeKey.startsWith("rk_test_");

    const result = {
      key_type: isLiveKey ? "live_secret" : isTestKey ? "test_secret" : isRestrictedKey ? "restricted" : "unknown",
      key_prefix: keyPrefix,
      account_id: account.id,
      business_type: account.business_type,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted,
      country: account.country,
      default_currency: account.default_currency,
      capabilities: account.capabilities,
      requirements: {
        currently_due: account.requirements?.currently_due,
        eventually_due: account.requirements?.eventually_due,
        past_due: account.requirements?.past_due,
        disabled_reason: account.requirements?.disabled_reason,
      },
    };

    console.log(`[CHECK-STRIPE] Account status:`, JSON.stringify(result, null, 2));

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[CHECK-STRIPE] Error:`, message);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
