import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

  try {
    switch (event.type) {
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const status = subscription.status;
        logStep("Subscription event", { customerId, status, subscriptionId: subscription.id });

        // Look up user by Stripe customer email
        const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
        if (!customer.email) {
          logStep("WARN", { message: "Customer has no email", customerId });
          break;
        }

        // Find the user in auth by email
        const { data: usersData } = await supabaseClient.auth.admin.listUsers();
        const matchedUser = usersData?.users?.find((u) => u.email === customer.email);
        if (!matchedUser) {
          logStep("WARN", { message: "No user found for email", email: customer.email });
          break;
        }

        // Update profile is_pro based on subscription status
        const isActive = status === "active" || status === "past_due";
        const { error: updateErr } = await supabaseClient
          .from("profiles")
          .update({ is_pro: isActive })
          .eq("user_id", matchedUser.id);

        if (updateErr) {
          logStep("ERROR", { message: "Profile update failed", error: updateErr.message });
        } else {
          logStep("Profile updated", { userId: matchedUser.id, is_pro: isActive, status });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        logStep("Payment failed", { customerId, invoiceId: invoice.id });
        // The subscription.updated event will fire with past_due status,
        // which grants a grace period. No additional action needed here.
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        logStep("Charge refunded", { chargeId: charge.id, amount: charge.amount_refunded });
        // Refunds don't automatically cancel subscriptions in Stripe.
        // The merchant handles cancellation separately if needed.
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logStep("ERROR processing event", { message: msg });
    // Return 200 so Stripe doesn't retry indefinitely
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
});
