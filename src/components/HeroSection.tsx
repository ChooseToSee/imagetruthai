import { useState, useEffect } from "react";
import { Upload, Zap, Shield, Search, Fingerprint, FileWarning, ScanEye, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
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

const editingSignals = [
  { icon: FileWarning, title: "Editing Artifacts", description: "Detect traces left by image editing tools including cloning, splicing, and retouching." },
  { icon: ScanEye, title: "Compression Inconsistencies", description: "Identify mismatched compression levels that may indicate regions were altered after initial save." },
  { icon: Fingerprint, title: "Photoshop Manipulation", description: "Flag signatures commonly associated with Adobe Photoshop and similar editing software." },
  { icon: Search, title: "Unusual Metadata Patterns", description: "Analyze EXIF and metadata for anomalies such as missing fields, conflicting timestamps, or stripped data." },
];

interface HeroSectionProps {
  onScrollToUpload: () => void;
  onStartFree: () => void;
}

const cycleWords = ["Real", "Fake", "AI-Generated", "Photoshopped", "Edited"];

const HeroSection = ({ onScrollToUpload, onStartFree }: HeroSectionProps) => {
  const [wordIndex, setWordIndex] = useState(0);
  const [showModels, setShowModels] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % cycleWords.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);
  return (
    <section className="relative flex flex-col items-center overflow-hidden pt-16">
      {/* Image montage background */}
      <div className="absolute inset-0 grid h-full w-full grid-cols-3 grid-rows-2 gap-1">
        {montageImages.map((img, i) => (
          <motion.div
            key={i}
            className="relative overflow-hidden"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 0.45, scale: 1 }}
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
            <div
              className={`absolute top-2 right-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                img.isAI
                  ? "bg-destructive/80 text-destructive-foreground"
                  : "bg-success/80 text-success-foreground"
              }`}
            >
              {img.label}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/70 to-background" />

      {/* Hero content */}
      <div className="container relative z-10 mx-auto px-4 py-20">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <motion.div
            className="flex flex-wrap items-center justify-center gap-2 mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <button
              onClick={() => setShowModels(!showModels)}
              className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 hover:bg-primary/20 transition-colors cursor-pointer"
            >
              <div className="flex -space-x-1">
                <div className="h-5 w-5 rounded-full bg-blue-500 border-2 border-background flex items-center justify-center">
                  <span className="text-[8px] font-bold text-white">W</span>
                </div>
                <div className="h-5 w-5 rounded-full bg-orange-500 border-2 border-background flex items-center justify-center">
                  <span className="text-[8px] font-bold text-white">S</span>
                </div>
                <div className="h-5 w-5 rounded-full bg-purple-500 border-2 border-background flex items-center justify-center">
                  <span className="text-[8px] font-bold text-white">A</span>
                </div>
                <div className="h-5 w-5 rounded-full bg-green-500 border-2 border-background flex items-center justify-center">
                  <span className="text-[8px] font-bold text-white">G</span>
                </div>
                <div className="h-5 w-5 rounded-full bg-red-500 border-2 border-background flex items-center justify-center">
                  <span className="text-[8px] font-bold text-white">H</span>
                </div>
              </div>
              <span className="text-xs font-semibold text-primary">
                5 AI Models · Consensus Detection
              </span>
              <ChevronDown className={`h-3 w-3 text-primary transition-transform ${showModels ? "rotate-180" : ""}`} />
            </button>
            <div className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5">
              <Shield className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary">
                AI Detection + Edit Analysis
              </span>
            </div>
            {showModels && (
              <motion.p
                className="text-xs text-muted-foreground mt-2 text-center w-full"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                Winston AI | SightEngine | AI or Not | Gemini | Hive
              </motion.p>
            )}
          </motion.div>

          <motion.h1
            className="mb-4 font-display text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Is This Image{" "}
            <span className="relative inline-flex items-baseline">
              <AnimatePresence mode="wait">
                <motion.span
                  key={cycleWords[wordIndex]}
                  className="text-gradient-brand inline-block"
                  initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -20, filter: "blur(4px)" }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                >
                  {cycleWords[wordIndex]}
                </motion.span>
              </AnimatePresence>
              <span className="text-foreground">?</span>
            </span>{" "}
            <br className="hidden sm:block" />
            <span className="text-gradient-brand">Analyze It With AI.</span>
          </motion.h1>

          <motion.p
            className="mx-auto mb-6 max-w-xl text-lg leading-relaxed text-muted-foreground"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Upload a photo and receive AI-generated insights that may help reveal signs of AI creation, manipulation, editing, or 'Photoshopped' images.
          </motion.p>

          <motion.p
            className="mx-auto mb-10 max-w-lg text-sm text-muted-foreground/80"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
          >
            Our system analyzes visual patterns, metadata signals, and image characteristics using 5 AI models to help you evaluate digital images.
          </motion.p>

          <motion.div
            className="flex flex-col items-center justify-center gap-4 sm:flex-row"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Button
              variant="outline"
              size="lg"
              className="gap-2 px-8 text-base border-[1.5px] border-primary text-foreground bg-transparent hover:bg-primary/10"
              onClick={onScrollToUpload}
            >
              <Upload className="h-4 w-4 text-primary" />
              Upload Image
            </Button>
            <Button
              size="lg"
              className="gap-2 px-8 text-base shadow-glow"
              onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}
            >
              <Zap className="h-4 w-4" />
              Get More Power
            </Button>
          </motion.div>

          {/* Disclaimer */}
          <motion.p
            className="mt-4 text-xs text-muted-foreground/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            AI-generated analysis may be inaccurate. Results are informational only and should be independently verified.
          </motion.p>
        </div>
      </div>

      {/* Detect Signs of Image Editing section */}
      <div className="container relative z-10 mx-auto px-4 pb-20">
        <motion.div
          className="mx-auto max-w-4xl"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="mb-2 text-center font-display text-2xl font-bold text-foreground sm:text-3xl">
            Detect Signs of Image Editing
          </h2>
          <p className="mx-auto mb-10 max-w-lg text-center text-sm text-muted-foreground">
            Our AI models look for common signals that an image may have been altered, generated, or manipulated.
          </p>

          <div className="grid gap-5 sm:grid-cols-2">
            {editingSignals.map((signal, i) => (
              <motion.div
                key={signal.title}
                className="flex gap-4 rounded-xl border border-border bg-card p-5 shadow-card transition-all hover:border-primary/30 hover:shadow-glow"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -2, transition: { duration: 0.2 } }}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <signal.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="mb-1 font-display text-sm font-semibold text-foreground">{signal.title}</h3>
                  <p className="text-xs leading-relaxed text-muted-foreground">{signal.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
