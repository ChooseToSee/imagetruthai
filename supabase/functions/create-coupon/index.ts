import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Admin emails authorized to create coupons
const ADMIN_EMAILS = ["admin@imagetruthai.com"];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error("Authentication failed");
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");

    // Admin authorization check
    if (!ADMIN_EMAILS.includes(user.email)) {
      return new Response(JSON.stringify({ error: "Unauthorized: Admin access required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const { code, maxRedemptions } = await req.json();
    if (!code || typeof code !== "string" || code.length < 3 || code.length > 50) {
      throw new Error("code is required and must be 3-50 characters");
    }

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
    const message = error instanceof Error ? error.message : "Failed to create coupon";
    const safeMessage = message.includes("Authentication") || message.includes("authorization") || message.includes("authenticated") || message.includes("code is required")
      ? message
      : "Failed to create coupon";
    return new Response(JSON.stringify({ error: safeMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
