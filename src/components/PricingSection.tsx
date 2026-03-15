import { Check } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { STRIPE_TIERS } from "@/lib/stripe-config";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

type BillingInterval = "monthly" | "annual";

const MONTHLY_PRICES = { free: 0, plus: 7, pro: 19 };
const ANNUAL_PRICES = { free: 0, plus: 70, pro: 190 };

const plans = [
  {
    name: "Free",
    tier: "free" as const,
    features: [
      "3 scans per day",
      "Single image upload",
      "Basic results only",
      "No scan history",
    ],
    highlighted: false,
  },
  {
    name: "Plus",
    tier: "plus" as const,
    features: [
      "50 scans per day",
      "Batch upload up to 5 images",
      "30-day scan history with full analysis results",
      "Full detailed forensic reports",
      "Email support",
    ],
    highlighted: false,
  },
  {
    name: "Pro",
    tier: "pro" as const,
    features: [
      "Unlimited scans",
      "Batch upload up to 20 images",
      "Unlimited scan history with full analysis results",
      "Exportable PDF reports",
      "API access",
      "Priority support",
    ],
    highlighted: true,
  },
];

const PricingSection = () => {
  const { user, subscription } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [billing, setBilling] = useState<BillingInterval>("monthly");

  const getPrice = (tier: "free" | "plus" | "pro") => {
    if (tier === "free") return "$0";
    if (billing === "annual") {
      const monthly = (ANNUAL_PRICES[tier] / 12).toFixed(2);
      return `$${monthly}`;
    }
    return `$${MONTHLY_PRICES[tier]}`;
  };

  const handleCheckout = async (tier: "plus" | "pro") => {
    if (!user) {
      navigate(`/auth?plan=${tier}&billing=${billing}`);
      return;
    }
    setLoadingTier(tier);
    try {
      const newTab = window.open("about:blank", "_blank");
      const priceId = billing === "annual"
        ? STRIPE_TIERS[tier].annual_price_id
        : STRIPE_TIERS[tier].monthly_price_id;
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId },
      });
      if (error) throw error;
      if (data?.url && newTab) {
        newTab.location.href = data.url;
      } else if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      toast({ title: "Checkout failed", description: err.message, variant: "destructive" });
    } finally {
      setLoadingTier(null);
    }
  };

  const handleManage = async () => {
    setLoadingTier("manage");
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) {
      toast({ title: "Portal failed", description: err.message, variant: "destructive" });
    } finally {
      setLoadingTier(null);
    }
  };

  const currentTier = subscription.tier;

  return (
    <section id="pricing" className="py-24">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <motion.h2
            className="mb-3 font-display text-3xl font-bold text-foreground"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Pricing
          </motion.h2>
          <motion.p
            className="mb-8 text-muted-foreground"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            Start free — upgrade when you need more.
          </motion.p>

          {/* Billing toggle */}
          <motion.div
            className="inline-flex items-center gap-3"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <span className={`text-sm font-medium ${billing === "monthly" ? "text-foreground" : "text-muted-foreground"}`}>
              Monthly
            </span>
            <Switch
              checked={billing === "annual"}
              onCheckedChange={(checked) => setBilling(checked ? "annual" : "monthly")}
            />
            <span className={`text-sm font-medium ${billing === "annual" ? "text-foreground" : "text-muted-foreground"}`}>
              Annual
            </span>
            {billing === "annual" && (
              <Badge className="bg-green-600 text-white hover:bg-green-700 text-xs">
                2 months free
              </Badge>
            )}
          </motion.div>
        </div>

        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
          {plans.map((plan, i) => {
            const isCurrentPlan = currentTier === plan.tier;
            const isPaid = plan.tier !== "free";
            return (
              <motion.div
                key={plan.name}
                className={`relative rounded-xl border p-8 transition-all ${
                  isCurrentPlan
                    ? "border-primary bg-card shadow-glow ring-2 ring-primary/20"
                    : plan.highlighted
                    ? "border-primary/40 bg-card shadow-glow"
                    : "border-border bg-card shadow-card"
                }`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
              >
                {isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                    Your Plan
                  </div>
                )}
                {!isCurrentPlan && plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                    Best Value
                  </div>
                )}
                <h3 className="font-display text-xl font-bold text-foreground">{plan.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-bold text-foreground">{getPrice(plan.tier)}</span>
                  <span className="text-sm text-muted-foreground">/mo</span>
                </div>
                {billing === "annual" && isPaid && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    ${ANNUAL_PRICES[plan.tier]} billed annually
                  </p>
                )}

                <ul className="mt-8 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-secondary-foreground">
                      <Check className="h-4 w-4 shrink-0 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>

                {isCurrentPlan && subscription.subscribed ? (
                  <Button
                    className="mt-8 w-full"
                    variant="outline"
                    onClick={handleManage}
                    disabled={loadingTier === "manage"}
                  >
                    {loadingTier === "manage" ? "Loading…" : "Manage Subscription"}
                  </Button>
                ) : plan.tier === "free" ? (
                  <Button
                    className="mt-8 w-full"
                    variant="outline"
                    onClick={() => !user && navigate(`/auth?plan=free&billing=${billing}`)}
                    disabled={!!user}
                  >
                    {user ? "Current Plan" : "Start Free"}
                  </Button>
                ) : (
                  <div className="mt-8">
                  <Button
                    className={`w-full ${plan.highlighted ? "shadow-glow" : ""}`}
                    variant={plan.highlighted ? "default" : "outline"}
                    onClick={() => handleCheckout(plan.tier)}
                    disabled={loadingTier === plan.tier}
                  >
                    {loadingTier === plan.tier ? "Loading…" : "Start 7-day free trial"}
                  </Button>
                    <p className="mt-2 text-center text-xs text-muted-foreground">
                      No credit card required for trial
                    </p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
