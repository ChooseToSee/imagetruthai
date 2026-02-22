import { Check } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    features: [
      "3 scans per day",
      "Single image upload",
      "AI vs human detection",
      "Edit detection analysis",
      "Community support",
    ],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Plus",
    price: "$7",
    period: "/month",
    yearly: "$59/year",
    features: [
      "50 scans per day",
      "Batch upload up to 5 images",
      "30-day scan history with thumbnails",
      "Full detailed forensic reports",
      "Multi-model consensus analysis",
      "Email support",
    ],
    cta: "Start Plus",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/month",
    yearly: "$159/year",
    features: [
      "Unlimited scans",
      "Batch upload up to 20 images",
      "Exportable PDF reports",
      "API access (1,000 calls/mo)",
      "Unlimited scan history",
      "Multi-model consensus analysis",
      "Priority support",
    ],
    cta: "Start Pro Trial",
    highlighted: true,
  },
];

const PricingSection = () => {
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
            Simple Pricing
          </motion.h2>
          <motion.p
            className="text-muted-foreground"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            Start free — upgrade when you need more power.
          </motion.p>
        </div>

        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              className={`relative rounded-xl border p-8 transition-all ${
                plan.highlighted
                  ? "border-primary/40 bg-card shadow-glow"
                  : "border-border bg-card shadow-card"
              }`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                  Most Popular
                </div>
              )}
              <h3 className="font-display text-xl font-bold text-foreground">
                {plan.name}
              </h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-display text-4xl font-bold text-foreground">
                  {plan.price}
                </span>
                <span className="text-sm text-muted-foreground">{plan.period}</span>
              </div>
              {plan.yearly && (
                <p className="mt-1 text-xs text-muted-foreground">
                  or {plan.yearly} (save 27%)
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

              <Button
                className={`mt-8 w-full ${plan.highlighted ? "shadow-glow" : ""}`}
                variant={plan.highlighted ? "default" : "outline"}
              >
                {plan.cta}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
