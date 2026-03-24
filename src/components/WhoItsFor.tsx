import { Newspaper, Search, ShieldCheck, Lightbulb } from "lucide-react";
import { motion } from "framer-motion";

const useCases = [
  {
    icon: Newspaper,
    title: "Journalists",
    description: "Evaluate digital images before publishing.",
  },
  {
    icon: Search,
    title: "Researchers",
    description: "Analyze visual content more efficiently.",
  },
  {
    icon: ShieldCheck,
    title: "Investigators",
    description: "Review images with automated assistance.",
  },
  {
    icon: Lightbulb,
    title: "Curious Individuals",
    description: "Explore AI-powered insights about images.",
  },
];

const WhoItsFor = () => {
  return (
    <section id="who-its-for" className="py-16 bg-card/30">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <motion.h2
            className="mb-3 font-display text-3xl font-bold text-foreground"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Who It's For
          </motion.h2>
          <motion.p
            className="text-muted-foreground"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            Built for anyone who needs to understand images better.
          </motion.p>
        </div>

        <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {useCases.map((uc, i) => (
            <motion.div
              key={uc.title}
              className="rounded-xl border border-border bg-card p-6 text-center shadow-card transition-all hover:border-primary/30 hover:shadow-glow"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <uc.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mb-2 font-display text-base font-semibold text-foreground">
                {uc.title}
              </h3>
              <p className="text-sm text-muted-foreground">{uc.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhoItsFor;
