import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, AlertTriangle } from "lucide-react";

const DemoSection = () => {
  return (
    <section id="demo" className="py-24 bg-card/30">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <motion.h2
            className="mb-3 font-display text-3xl font-bold text-foreground"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            See It in Action
          </motion.h2>
          <motion.p
            className="text-muted-foreground"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            An example of how ImageTruth AI analyzes an uploaded image.
          </motion.p>
        </div>

        <div className="mx-auto flex max-w-4xl flex-col items-center gap-8 md:flex-row">
          {/* Example uploaded image */}
          <motion.div
            className="flex-1 rounded-xl border border-border bg-card p-4 shadow-card"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Uploaded Image
            </div>
            <div className="aspect-[4/3] rounded-lg bg-muted/50 flex items-center justify-center overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80"
                alt="Example uploaded image"
                className="h-full w-full object-cover rounded-lg"
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">portrait_sample.jpg — 1.2 MB</p>
            <p className="text-[10px] text-muted-foreground/60 text-center mt-1 italic">
              Example only: this demo uses a sample AI-generated portrait for illustration purposes.
            </p>
          </motion.div>

          {/* Arrow */}
          <motion.div
            className="flex-shrink-0"
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <ArrowRight className="h-5 w-5 text-primary" />
            </div>
          </motion.div>

          {/* Example report preview */}
          <motion.div
            className="flex-1 rounded-xl border border-border bg-card p-6 shadow-card"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              AI-Generated Report
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="text-sm font-medium text-foreground">
                  Verdict: Likely AI-Generated
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted">
                <div className="h-2 rounded-full bg-destructive" style={{ width: "94%" }} />
              </div>
              <p className="text-xs text-muted-foreground">Confidence: 94%</p>
              <div className="space-y-2 border-t border-border pt-3">
                <p className="text-xs font-medium text-foreground">Key findings:</p>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                  <p className="text-xs text-muted-foreground">
                    Uniform noise pattern consistent with diffusion-based generation
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                  <p className="text-xs text-muted-foreground">
                    No camera EXIF metadata detected
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                  <p className="text-xs text-muted-foreground">
                    Synthetic uniformity in lighting reflections
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default DemoSection;
