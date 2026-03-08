import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";

interface FinalCTAProps {
  onStartFree: () => void;
}

const FinalCTA = ({ onStartFree }: FinalCTAProps) => {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4 text-center">
        <motion.h2
          className="mb-6 font-display text-3xl font-bold text-foreground sm:text-4xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Start Analyzing Images Today
        </motion.h2>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          <Button
            size="lg"
            className="gap-2 px-8 text-base shadow-glow"
            onClick={onStartFree}
          >
            <UserPlus className="h-4 w-4" />
            Start Free Plan
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default FinalCTA;
