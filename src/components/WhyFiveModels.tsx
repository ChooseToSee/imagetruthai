import { X, Check, Shield } from "lucide-react";
import { motion } from "framer-motion";

const WhyFiveModels = () => {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <motion.h2
            className="mb-3 font-display text-3xl font-bold text-foreground"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Why 5 AI Models?
          </motion.h2>
          <motion.p
            className="mx-auto max-w-xl text-muted-foreground"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            One model can be fooled. Five working together are much harder to trick.
          </motion.p>
        </div>

        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          {/* Card 1 — Single Model */}
          <motion.div
            className="rounded-xl border border-border bg-card p-8 shadow-card transition-all hover:border-destructive/30"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
          >
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <X className="h-5 w-5 text-destructive" />
            </div>
            <h3 className="mb-4 text-center font-display text-lg font-semibold text-foreground">
              Single Model Detection
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive/70" />
                One perspective on every image
              </li>
              <li className="flex items-start gap-2">
                <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive/70" />
                Higher false positive rate
              </li>
              <li className="flex items-start gap-2">
                <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive/70" />
                Easily fooled by new AI generators
              </li>
              <li className="flex items-start gap-2">
                <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive/70" />
                No way to cross-check results
              </li>
            </ul>
          </motion.div>

          {/* Card 2 — 5-Model Consensus */}
          <motion.div
            className="rounded-xl border border-primary/30 bg-card p-8 shadow-glow transition-all"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
          >
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
              <Check className="h-5 w-5 text-green-500" />
            </div>
            <h3 className="mb-4 text-center font-display text-lg font-semibold text-foreground">
              Our 5-Model Consensus
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" />
                Five independent AI systems analyze every image
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" />
                Models must agree for high confidence verdict
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" />
                Disagreement shown transparently to users
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" />
                Catches what single models miss
              </li>
            </ul>
          </motion.div>

          {/* Card 3 — The Jury Principle */}
          <motion.div
            className="rounded-xl border border-border bg-card p-8 shadow-card transition-all hover:border-primary/30 hover:shadow-glow"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
          >
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <h3 className="mb-4 text-center font-display text-lg font-semibold text-foreground">
              The Jury Principle
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Like a jury of peers, our 5 AI models each deliver an independent verdict.
              The consensus result is far more reliable than any single opinion — and we
              show you exactly how each model voted.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default WhyFiveModels;
