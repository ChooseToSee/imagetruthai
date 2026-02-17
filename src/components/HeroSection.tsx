import { Upload, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroBg from "@/assets/hero-bg.jpg";

interface HeroSectionProps {
  onScrollToUpload: () => void;
}

const HeroSection = ({ onScrollToUpload }: HeroSectionProps) => {
  return (
    <section className="relative flex min-h-[90vh] items-center overflow-hidden pt-16">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src={heroBg}
          alt=""
          className="h-full w-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute inset-0 bg-background/60" />
      </div>

      <div className="container relative z-10 mx-auto px-4 py-20">
        <div className="mx-auto max-w-3xl text-center">
          {/* Trust badge temporarily hidden */}

          <h1
            className="mb-4 font-display text-5xl font-bold leading-tight tracking-tight text-foreground opacity-0 animate-fade-up sm:text-6xl lg:text-7xl"
          >
            <span className="text-gradient-brand">AI</span> or{" "}
            <span className="text-gradient-brand">Real</span>
          </h1>

          <h2
            className="mb-6 font-display text-xl font-medium leading-snug text-muted-foreground opacity-0 animate-fade-up sm:text-2xl lg:text-3xl"
            style={{ animationDelay: "0.1s" }}
          >
            Instantly Check If an Image Is AI-Generated or Human-Made
          </h2>

          <p
            className="mx-auto mb-10 max-w-xl text-lg leading-relaxed text-muted-foreground opacity-0 animate-fade-up"
            style={{ animationDelay: "0.15s" }}
          >
            Protect your art, verify news sources — fast & accurate.
            Upload any image and get a clear verdict in seconds.
          </p>

          <div
            className="flex flex-col items-center justify-center gap-4 opacity-0 animate-fade-up sm:flex-row"
            style={{ animationDelay: "0.3s" }}
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
            >
              <Zap className="h-4 w-4" />
              See Demo
            </Button>
          </div>

          {/* Trust badges */}
          <div
            className="mt-16 flex flex-wrap items-center justify-center gap-8 text-xs text-muted-foreground opacity-0 animate-fade-up"
            style={{ animationDelay: "0.45s" }}
          >
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-success" />
              5 Free Scans Daily
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary" />
              Works with DALL·E, Midjourney, Flux, SD
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary" />
              No Account Required
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
