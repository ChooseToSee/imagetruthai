import { Upload, Zap, Shield, Eye, Camera, TrendingUp, Pencil } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import AnimatedCounter from "@/components/AnimatedCounter";
import montage1 from "@/assets/montage-1.jpg";
import montage2 from "@/assets/montage-2.jpg";
import montage3 from "@/assets/montage-3.jpg";
import montage4 from "@/assets/montage-4.jpg";
import montage5 from "@/assets/montage-5.jpg";
import montage6 from "@/assets/montage-6.jpg";

const montageImages = [
  { src: montage1, label: "Real", isAI: false },
  { src: montage2, label: "AI", isAI: true },
  { src: montage3, label: "Real", isAI: false },
  { src: montage5, label: "Real", isAI: false },
  { src: montage4, label: "AI", isAI: true },
  { src: montage6, label: "AI", isAI: true },
];

interface HeroSectionProps {
  onScrollToUpload: () => void;
  onDemo: () => void;
}

const HeroSection = ({ onScrollToUpload, onDemo }: HeroSectionProps) => {
  return (
    <section className="relative flex min-h-[100vh] items-center overflow-hidden pt-16">
      {/* Image montage background */}
      <div className="absolute inset-0 grid h-full w-full grid-cols-3 grid-rows-2 gap-1">
        {montageImages.map((img, i) => (
          <motion.div
            key={i}
            className="relative overflow-hidden"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 0.55, scale: 1 }}
            transition={{ duration: 1.2, delay: i * 0.15, ease: "easeOut" }}
          >
            <motion.img
              src={img.src}
              alt=""
              className="h-full w-full object-cover"
              animate={{
                scale: [1, 1.08, 1],
                x: [0, i % 2 === 0 ? 8 : -8, 0],
                y: [0, i % 3 === 0 ? 6 : -6, 0],
              }}
              transition={{
                duration: 12 + i * 2,
                repeat: Infinity,
                repeatType: "mirror",
                ease: "easeInOut",
              }}
            />
            {/* AI/Real label overlay */}
            <div className={`absolute top-2 right-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${
              img.isAI
                ? "bg-destructive/80 text-destructive-foreground"
                : "bg-success/80 text-success-foreground"
            }`}>
              {img.label}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/70 to-background" />

      <div className="container relative z-10 mx-auto px-4 py-20">
        <div className="mx-auto max-w-3xl text-center">
          {/* Accuracy badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary"
          >
            <Shield className="h-3.5 w-3.5" />
            96.2% Detection Accuracy Across Major AI Models
          </motion.div>

          <motion.h1
            className="mb-4 font-display text-5xl font-bold leading-tight tracking-tight text-foreground sm:text-6xl lg:text-7xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <span className="text-gradient-brand">AI</span> or{" "}
            <span className="text-gradient-brand">Real</span>
            <span className="text-primary">?</span>
          </motion.h1>

          <motion.h2
            className="mb-6 font-display text-xl font-medium leading-snug sm:text-2xl lg:text-3xl"
            style={{ color: "hsl(190 72% 42%)" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Detect AI-Generated <span className="text-primary">&</span> Edited Images Instantly
          </motion.h2>

          <motion.p
            className="mx-auto mb-10 max-w-xl text-lg leading-relaxed text-muted-foreground"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Protect your art, verify news sources, spot manipulated photos — fast & accurate.
            Upload any image and get a dual-layer forensic verdict in seconds.
          </motion.p>

          <motion.div
            className="flex flex-col items-center justify-center gap-4 sm:flex-row"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Button
              size="lg"
              className="gap-2 px-8 text-base shadow-glow"
              onClick={onScrollToUpload}
            >
              <Upload className="h-4 w-4" />
              Analyze an Image
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="gap-2 px-8 text-base"
              onClick={onDemo}
            >
              <Zap className="h-4 w-4" />
              See Demo
            </Button>
          </motion.div>

          {/* Social proof counters */}
          <motion.div
            className="mt-16 grid grid-cols-2 gap-6 sm:grid-cols-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <div className="text-center">
              <div className="font-display text-2xl font-bold text-foreground sm:text-3xl">
                <AnimatedCounter target={2500000} suffix="+" />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Images Analyzed</p>
            </div>
            <div className="text-center">
              <div className="font-display text-2xl font-bold text-primary sm:text-3xl">
                <AnimatedCounter target={96} suffix="%" />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Accuracy Rate</p>
            </div>
            <div className="text-center">
              <div className="font-display text-2xl font-bold text-foreground sm:text-3xl">
                <AnimatedCounter target={150000} suffix="+" />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Users Worldwide</p>
            </div>
            <div className="text-center">
              <div className="font-display text-2xl font-bold text-success sm:text-3xl">
                &lt;3s
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Avg Analysis Time</p>
            </div>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            className="mt-10 flex flex-wrap items-center justify-center gap-8 text-xs text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <div className="flex items-center gap-2">
              <Eye className="h-3.5 w-3.5 text-primary" />
              Works with DALL·E, Midjourney, Flux, SD
            </div>
            <div className="flex items-center gap-2">
              <Pencil className="h-3.5 w-3.5 text-warning" />
              Detects Photoshop & Editing
            </div>
            <div className="flex items-center gap-2">
              <Camera className="h-3.5 w-3.5 text-success" />
              5 Free Scans Daily
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              No Account Required
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
