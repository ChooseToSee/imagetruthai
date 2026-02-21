import { Upload, Cpu, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

const steps = [
  {
    icon: Upload,
    title: "Upload Image",
    description: "Drag & drop, paste a URL, or select any JPG, PNG, or WEBP image up to 10 MB.",
  },
  {
    icon: Cpu,
    title: "AI Analysis",
    description: "Our multi-model detection engine scans for artifacts, noise patterns, and metadata anomalies.",
  },
  {
    icon: ShieldCheck,
    title: "Get Verdict",
    description: "Receive a clear confidence score with detailed reasoning and shareable results in seconds.",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <motion.h2
            className="mb-3 font-display text-3xl font-bold text-foreground"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            How It Works
          </motion.h2>
          <motion.p
            className="text-muted-foreground"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            Three simple steps to verify any image.
          </motion.p>
        </div>

        <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-3">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              className="group relative rounded-xl border border-border bg-card p-8 text-center shadow-card transition-all hover:border-primary/30 hover:shadow-glow"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <div className="mb-1 font-display text-5xl font-bold text-muted/80">
                {String(i + 1).padStart(2, "0")}
              </div>
              <motion.div
                className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10"
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                <step.icon className="h-5 w-5 text-primary" />
              </motion.div>
              <h3 className="mb-2 font-display text-lg font-semibold text-foreground">
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
