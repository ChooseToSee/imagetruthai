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
            Every AI model has blind spots. Five independent models cover each other's gaps — so signals one misses, another catches.
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
                "5 independent AI models scan every image",
                "More models checking = more signals detected",
                "Blind spots in one model covered by others",
                "Catches what any single model would miss",
                "You see exactly what each model found",
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

        {/* Signal Detection Matrix */}
        <motion.div
          className="mx-auto mt-12 max-w-3xl rounded-xl border border-border bg-card p-8 shadow-card overflow-x-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <h4 className="mb-8 text-center font-display text-lg font-semibold text-foreground">
            Example: What Each Model Found
          </h4>
          <table className="w-full text-sm border-separate border-spacing-0">
            <thead>
              {/* Row 1: Group headers */}
              <tr>
                <th className="w-44 pb-1" />
                <th
                  colSpan={3}
                  className="pb-1 text-center text-xs font-bold uppercase tracking-widest text-primary border-b-2 border-primary px-2"
                >
                  AI Analysis
                </th>
                <th className="w-3" />
                <th
                  colSpan={2}
                  className="pb-1 text-center text-xs font-bold uppercase tracking-widest text-amber-400 border-b-2 border-amber-400 px-2"
                >
                  Edit Analysis
                </th>
              </tr>
              {/* Row 2: Model names */}
              <tr>
                <th className="w-44 pb-4" />
                {[
                  { name: "Winston", color: "text-primary" },
                  { name: "SightEngine", color: "text-primary" },
                  { name: "AI or Not", color: "text-primary" },
                ].map((m) => (
                  <th
                    key={m.name}
                    className={`pb-4 text-center text-xs font-semibold ${m.color} px-2`}
                  >
                    {m.name}
                  </th>
                ))}
                <th className="w-3" />
                {[
                  { name: "Gemini", color: "text-amber-400" },
                  { name: "Hive", color: "text-amber-400" },
                ].map((m) => (
                  <th
                    key={m.name}
                    className={`pb-4 text-center text-xs font-semibold ${m.color} px-2`}
                  >
                    {m.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                {
                  signal: "Generative Fingerprint",
                  cells: [true, true, false, false, true],
                },
                {
                  signal: "Synthetic Texture",
                  cells: [true, true, true, false, true],
                },
                {
                  signal: "Structural Anomalies",
                  cells: [true, false, true, true, false],
                },
                {
                  signal: "Metadata Anomalies",
                  cells: [false, true, false, true, true],
                },
                {
                  signal: "Manipulation Artifacts",
                  cells: [false, false, false, true, true],
                },
              ].map((row, rowIndex) => (
                <motion.tr
                  key={row.signal}
                  className="group"
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + rowIndex * 0.1 }}
                >
                  <td className="py-3 pr-4 text-xs font-medium text-muted-foreground text-right">
                    {row.signal}
                  </td>
                  {row.cells.slice(0, 3).map((detected, i) => (
                    <td key={i} className="py-3 px-2 text-center">
                      {detected ? (
                        <motion.div
                          className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 border border-primary/40"
                          initial={{ scale: 0 }}
                          whileInView={{ scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.4 + rowIndex * 0.1 + i * 0.05, type: "spring" }}
                        >
                          <div className="h-3 w-3 rounded-full bg-primary" />
                        </motion.div>
                      ) : (
                        <div className="mx-auto flex h-7 w-7 items-center justify-center">
                          <div className="h-0.5 w-4 rounded-full bg-muted-foreground/20" />
                        </div>
                      )}
                    </td>
                  ))}
                  {/* Divider column */}
                  <td className="w-3 border-l border-dashed border-border/50" />
                  {row.cells.slice(3).map((detected, i) => (
                    <td key={i} className="py-3 px-2 text-center">
                      {detected ? (
                        <motion.div
                          className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-amber-400/15 border border-amber-400/40"
                          initial={{ scale: 0 }}
                          whileInView={{ scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.4 + rowIndex * 0.1 + i * 0.05, type: "spring" }}
                        >
                          <div className="h-3 w-3 rounded-full bg-amber-400" />
                        </motion.div>
                      ) : (
                        <div className="mx-auto flex h-7 w-7 items-center justify-center">
                          <div className="h-0.5 w-4 rounded-full bg-muted-foreground/20" />
                        </div>
                      )}
                    </td>
                  ))}
                </motion.tr>
              ))}
            </tbody>
          </table>
          {/* Legend */}
          <div className="mt-6 flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-primary" />
              <span>Signal detected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-0.5 w-4 rounded-full bg-muted-foreground/30" />
              <span>Not detected</span>
            </div>
          </div>
          {/* Summary */}
          <div className="mt-6 rounded-lg bg-primary/5 p-4 text-center">
            <p className="text-sm font-semibold text-foreground">
              13 of 25 possible signals detected across 5 models
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              4 signals were caught by models that others missed — coverage no single model could provide alone
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default WhyFiveModels;