import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const { code, maxRedemptions } = await req.json();
    if (!code) throw new Error("code is required");

    // Create a 100% off forever coupon
    const coupon = await stripe.coupons.create({
      percent_off: 100,
      duration: "forever",
      name: `Beta Tester - ${code}`,
    });

    // Create a promotion code with the user-specified code
    const promoCode = await stripe.promotionCodes.create({
      coupon: coupon.id,
      code: code,
      max_redemptions: maxRedemptions || undefined,
    });

    return new Response(JSON.stringify({
      coupon_id: coupon.id,
      promo_code: promoCode.code,
      promo_code_id: promoCode.id,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
