import { Cpu, Layers, History, FileDown, FileText } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: Cpu,
    title: "AI-Powered Image Analysis",
    description: "Multi-model analysis using leading AI detection engines.",
  },
  {
    icon: Layers,
    title: "Batch Image Uploads",
    description: "Upload and analyze multiple images at once.",
  },
  {
    icon: History,
    title: "Scan History",
    description: "Review past scans with thumbnails and detailed reports.",
  },
  {
    icon: FileDown,
    title: "Exportable PDF Reports",
    description: "Download forensic reports as professional PDF documents.",
  },
  {
    icon: Code,
    title: "API Access",
    description: "Integrate image analysis into your own applications.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-16">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <motion.h2
            className="mb-3 font-display text-3xl font-bold text-foreground"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Features
          </motion.h2>
          <motion.p
            className="text-muted-foreground"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            Powerful tools for image verification.
          </motion.p>
        </div>

        <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              className="rounded-xl border border-border bg-card p-6 shadow-card transition-all hover:border-primary/30 hover:shadow-glow"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mb-1 font-display text-base font-semibold text-foreground">
                {f.title}
              </h3>
              <p className="text-sm text-muted-foreground">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
