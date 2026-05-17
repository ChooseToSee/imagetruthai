import { motion } from "framer-motion";

const useCases = [
  { title: "Journalists", description: "Verify images before staking your byline" },
  { title: "Investigators", description: "Build evidence records for case files" },
  { title: "Legal Professionals", description: "Evaluate image authenticity for proceedings" },
  { title: "HR Departments", description: "Verify submitted materials and profiles" },
  { title: "Insurance Companies", description: "Spot manipulated photos in claims" },
  { title: "Researchers", description: "Analyze AI-generated media at scale" },
];

const WhoItsFor = () => {
  return (
    <section id="who-its-for" className="py-16 bg-card/30">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <motion.h2
            className="mb-3 font-display text-3xl font-bold text-foreground"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Built for Professionals Who Need to Know
          </motion.h2>
        </div>

        <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {useCases.map((uc, i) => (
            <motion.div
              key={uc.title}
              className="rounded-xl border border-border bg-card p-6 shadow-card transition-all hover:border-primary/30 hover:shadow-glow"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <div className="mb-4 h-1 w-10 rounded-full bg-primary" />
              <h3 className="mb-2 font-display text-lg font-semibold text-foreground">
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
