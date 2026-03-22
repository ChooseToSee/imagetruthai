import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PRODUCT_TIER_MAP: Record<string, string> = {
  "prod_U46ynL0lG0C32s": "plus",
  "prod_U6iRCnETvveMML": "plus",
  "prod_U46zg6w4ycRsro": "pro",
  "prod_U6iRJ1APr8GFb2": "pro",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!stripeKey || !webhookSecret) {
    logStep("ERROR", { message: "Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET" });
    return new Response("Server misconfigured", { status: 500 });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    logStep("ERROR", { message: "No stripe-signature header" });
    return new Response("Missing signature", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    logStep("ERROR", { message: `Signature verification failed: ${err}` });
    return new Response("Invalid signature", { status: 400 });
  }

  logStep("Event received", { type: event.type, id: event.id });

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  // Helper to find user by Stripe customer email
  async function findUserByCustomerId(customerId: string) {
    const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
    if (!customer.email) {
      logStep("WARN", { message: "Customer has no email", customerId });
      return null;
    }
    const { data: usersData } = await supabaseClient.auth.admin.listUsers();
    const matchedUser = usersData?.users?.find((u) => u.email === customer.email);
    if (!matchedUser) {
      logStep("WARN", { message: "No user found for email", email: customer.email });
      return null;
    }
    return matchedUser;
  }

  async function updateProfile(userId: string, is_pro: boolean, subscription_tier: string) {
    const { error: updateErr } = await supabaseClient
      .from("profiles")
      .update({ is_pro, subscription_tier })
      .eq("user_id", userId);
    if (updateErr) {
      logStep("ERROR", { message: "Profile update failed", error: updateErr.message });
    } else {
      logStep("Profile updated", { userId, is_pro, subscription_tier });
    }
  }

  try {
    switch (event.type) {
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const status = subscription.status;
        logStep("Subscription event", { customerId, status, subscriptionId: subscription.id });

        const matchedUser = await findUserByCustomerId(customerId);
        if (!matchedUser) break;

        const isActive = status === "active" || status === "past_due" || status === "trialing";
        let tier = "free";
        if (isActive) {
          const productId = subscription.items.data[0]?.price?.product as string;
          tier = PRODUCT_TIER_MAP[productId] || "free";
        }

        await updateProfile(matchedUser.id, isActive && tier !== "free", tier);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Payment failed", { customerId: invoice.customer, invoiceId: invoice.id });
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const customerId = charge.customer as string;
        logStep("Charge refunded", { chargeId: charge.id, customerId, amount: charge.amount_refunded });

        if (!customerId) {
          logStep("WARN", { message: "Refunded charge has no customer" });
          break;
        }

        const matchedUser = await findUserByCustomerId(customerId);
        if (!matchedUser) break;

        // Revoke access
        await updateProfile(matchedUser.id, false, "free");

        // Cancel active subscriptions
        try {
          const subs = await stripe.subscriptions.list({ customer: customerId, status: "active", limit: 10 });
          for (const sub of subs.data) {
            await stripe.subscriptions.cancel(sub.id);
            logStep("Subscription cancelled after refund", { subscriptionId: sub.id });
          }
          const trialSubs = await stripe.subscriptions.list({ customer: customerId, status: "trialing", limit: 10 });
          for (const sub of trialSubs.data) {
            await stripe.subscriptions.cancel(sub.id);
            logStep("Trial subscription cancelled after refund", { subscriptionId: sub.id });
          }
        } catch (cancelErr) {
          logStep("ERROR cancelling subscriptions after refund", { error: String(cancelErr) });
        }
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logStep("ERROR processing event", { message: msg });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
});
