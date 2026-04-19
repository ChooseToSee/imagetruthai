import { motion } from "framer-motion";
import { X, Check, Shield, Brain } from "lucide-react";

const WhyFiveModels = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
            <Brain className="h-4 w-4" />
            Our Approach
          </div>

          <h2 className="mb-3 font-display text-3xl font-bold text-foreground sm:text-4xl">
            Why 5 AI Models?
          </h2>

          <p className="mx-auto max-w-xl text-lg text-muted-foreground">
            One model can be fooled. Five working together are much harder to trick.
          </p>
        </motion.div>

        {/* Three cards */}
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          {/* Card 1 - Single model */}
          <motion.div
            className="rounded-xl border border-destructive/20 bg-card p-8 shadow-card"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
          >
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <X className="h-5 w-5 text-destructive" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground">
                Single Model Detection
              </h3>
            </div>

            <ul className="space-y-3 text-sm text-muted-foreground">
              {[
                "One perspective on every image",
                "Higher false positive rate",
                "Easily fooled by new AI generators",
                "No way to cross-check results",
                "You just have to trust it",
              ].map((point, i) => (
                <li key={i} className="flex items-start gap-2">
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-destructive/70" />
                  {point}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Card 2 - Our approach */}
          <motion.div
            className="rounded-xl border border-primary/30 bg-card p-8 shadow-glow"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
          >
            <div className="mb-2 text-center text-xs font-semibold uppercase tracking-wider text-primary">
              How We Do It
            </div>

            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
                <Check className="h-5 w-5 text-green-500" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground">
                5-Model Consensus
              </h3>
            </div>

            <ul className="space-y-3 text-sm text-muted-foreground">
              {[
                "5 independent AI systems analyze every image",
                "Models must agree for high confidence",
                "Disagreement shown transparently",
                "Catches what single models miss",
                "You see exactly how each model voted",
              ].map((point, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                  {point}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Card 3 - The jury principle */}
          <motion.div
            className="rounded-xl border border-border bg-card p-8 shadow-card transition-all hover:border-primary/30 hover:shadow-glow"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
          >
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground">
                The Jury Principle
              </h3>
            </div>

            <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
              Like expert witnesses, our 5 AI models each report their independent findings.
              Winston AI, SightEngine, and AI or Not look for AI generation indicators.
              Gemini and Hive look for manipulation indicators.
            </p>

            <p className="text-sm leading-relaxed text-muted-foreground">
              The consensus reflects what the majority found — and you see every individual report.
            </p>
          </motion.div>
        </div>

        {/* The voting visualization */}
        <motion.div
          className="mx-auto mt-12 max-w-2xl rounded-xl border border-border bg-card p-8 shadow-card"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <h4 className="mb-6 text-center font-display text-lg font-semibold text-foreground">
            Example: How 5 Models Vote
          </h4>

          <div className="space-y-3">
            {[
              { model: "Winston AI", verdict: "AI", confidence: 94, ai: true },
              { model: "SightEngine", verdict: "AI", confidence: 97, ai: true },
              { model: "AI or Not", verdict: "Human", confidence: 61, ai: false },
              { model: "Gemini", verdict: "AI", confidence: 89, ai: true },
              { model: "Hive", verdict: "AI", confidence: 92, ai: true },
            ].map((item, i) => (
              <motion.div
                key={i}
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + i * 0.1 }}
              >
                <span className="w-24 shrink-0 text-right text-sm font-medium text-muted-foreground">
                  {item.model}
                </span>
                <div className="flex-1">
                  <div className="h-3 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      className={`h-full rounded-full ${item.ai ? "bg-primary" : "bg-green-500"}`}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${item.confidence}%` }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.5 + i * 0.1, duration: 0.6 }}
                      style={{ float: item.ai ? "right" : "left" }}
                    />
                  </div>
                  <div className="flex justify-between mt-0.5">
                    <span className="text-[10px] text-muted-foreground">{item.ai ? "100%" : "1%"}</span>
                    <span className="text-[10px] text-muted-foreground">{item.ai ? "1%" : "100%"}</span>
                  </div>
                </div>
                <span className={`w-28 text-sm font-medium ${item.ai ? "text-primary" : "text-green-500"}`}>
                  {item.confidence}% {item.verdict}
                </span>
              </motion.div>
            ))}
          </div>

          <div className="mt-6 rounded-lg bg-primary/5 p-4 text-center">
            <p className="text-sm font-semibold text-foreground">
              4/5 models agree: AI-Generated
            </p>
            <p className="text-xs text-muted-foreground">
              91% Likely AI-Generated
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default WhyFiveModels;