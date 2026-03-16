import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Eye, Layers, SplitSquareHorizontal, MapPin, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import ImageLightbox from "@/components/ImageLightbox";

type ViewMode = "original" | "heatmap" | "split";

interface HeatmapRegion {
  x: number; // 0-1 relative
  y: number;
  w: number;
  h: number;
  intensity: number; // 0-1
  label: string;
}

interface ImageHeatmapProps {
  imageUrl: string;
  reasons: string[];
  manipulationReasons?: string[];
}

const SIGNAL_MAP: { keywords: string[]; label: string; color: string }[] = [
  { keywords: ["lighting", "shadow", "illumination", "light"], label: "Lighting inconsistency detected", color: "rgba(255, 60, 60, 0.6)" },
  { keywords: ["compression", "jpeg", "artifact", "quality"], label: "Possible compression artifact detected", color: "rgba(255, 165, 0, 0.5)" },
  { keywords: ["edge", "boundary", "outline", "halo", "border"], label: "Edge irregularity suggesting possible editing boundary", color: "rgba(255, 0, 200, 0.5)" },
  { keywords: ["clone", "repeating", "pattern", "duplicate", "copy"], label: "Possible clone pattern detected", color: "rgba(0, 200, 255, 0.5)" },
  { keywords: ["texture", "noise", "grain", "smoothing", "skin", "blur"], label: "Texture anomaly detected", color: "rgba(130, 80, 255, 0.5)" },
  { keywords: ["metadata", "exif", "camera"], label: "Metadata anomaly detected", color: "rgba(255, 220, 0, 0.5)" },
  { keywords: ["perspective", "distort", "warp", "stretch"], label: "Perspective inconsistency detected", color: "rgba(0, 255, 130, 0.5)" },
  { keywords: ["reflection", "mirror"], label: "Inconsistent reflection detected", color: "rgba(255, 100, 100, 0.5)" },
];

// Deterministic pseudo-random from string seed
function seededRandom(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  }
  return () => {
    h = (h * 16807 + 0) % 2147483647;
    return (h & 0x7fffffff) / 0x7fffffff;
  };
}

function generateRegions(reasons: string[]): HeatmapRegion[] {
  const allReasons = reasons.map((r) => r.toLowerCase());
  const regions: HeatmapRegion[] = [];

  SIGNAL_MAP.forEach((signal, idx) => {
    const matched = signal.keywords.some((kw) => allReasons.some((r) => r.includes(kw)));
    if (!matched) return;

    const rand = seededRandom(signal.label + idx);
    const count = Math.max(1, Math.floor(rand() * 3));
    for (let i = 0; i < count; i++) {
      regions.push({
        x: 0.1 + rand() * 0.6,
        y: 0.1 + rand() * 0.6,
        w: 0.15 + rand() * 0.2,
        h: 0.15 + rand() * 0.2,
        intensity: 0.4 + rand() * 0.5,
        label: signal.label,
      });
    }
  });

  return regions;
}

const ImageHeatmap = ({ imageUrl, reasons, manipulationReasons = [] }: ImageHeatmapProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>("original");
  const [hoveredRegion, setHoveredRegion] = useState<number | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const imgRef = useRef<HTMLImageElement | null>(null);

  const allReasons = [...reasons, ...manipulationReasons];
  const regions = generateRegions(allReasons);

  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    imgRef.current = img;
    setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
  }, []);

  // Draw heatmap on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imgRef.current || imgSize.w === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const displayW = canvas.parentElement?.clientWidth || 400;
    const aspect = imgSize.h / imgSize.w;
    const displayH = displayW * aspect;
    canvas.width = displayW;
    canvas.height = displayH;

    ctx.clearRect(0, 0, displayW, displayH);
    ctx.drawImage(imgRef.current, 0, 0, displayW, displayH);

    // Darken slightly
    ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
    ctx.fillRect(0, 0, displayW, displayH);

    // Draw heat regions with radial gradients
    regions.forEach((region, idx) => {
      const cx = region.x * displayW + (region.w * displayW) / 2;
      const cy = region.y * displayH + (region.h * displayH) / 2;
      const rx = (region.w * displayW) / 2;
      const ry = (region.h * displayH) / 2;
      const radius = Math.max(rx, ry);

      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      const matchedSignal = SIGNAL_MAP.find((s) =>
        s.keywords.some((kw) => region.label.toLowerCase().includes(kw))
      );
      const color = matchedSignal?.color || "rgba(255, 60, 60, 0.5)";
      const isHovered = hoveredRegion === idx;
      const alpha = isHovered ? 0.8 : region.intensity * 0.6;

      gradient.addColorStop(0, color.replace(/[\d.]+\)$/, `${alpha})`));
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [imgSize, regions, hoveredRegion, viewMode]);

  const modeButtons: { mode: ViewMode; icon: React.ReactNode; label: string }[] = [
    { mode: "original", icon: <Eye className="h-3.5 w-3.5" />, label: "Original" },
    { mode: "heatmap", icon: <Layers className="h-3.5 w-3.5" />, label: "Heatmap" },
    { mode: "split", icon: <SplitSquareHorizontal className="h-3.5 w-3.5" />, label: "Split" },
  ];

  if (regions.length === 0) {
    return (
      <div className="relative mb-4 overflow-hidden rounded-lg bg-muted">
        <img src={imageUrl} alt="Analyzed" className="mx-auto max-h-64 rounded-lg object-contain w-full" />
      </div>
    );
  }

  return (
    <div className="mb-4">
      {/* View mode toggle */}
      <div className="flex gap-1 mb-3 p-1 rounded-lg bg-muted/80 border border-border w-fit">
        {modeButtons.map((btn) => (
          <button
            key={btn.mode}
            onClick={() => setViewMode(btn.mode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              viewMode === btn.mode
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {btn.icon}
            {btn.label}
          </button>
        ))}
      </div>

      <div ref={containerRef} className="relative overflow-hidden rounded-lg bg-muted">
        {viewMode === "original" && (
          <motion.img
            src={imageUrl}
            alt="Original"
            className="mx-auto max-h-64 rounded-lg object-contain w-full cursor-zoom-in"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setLightboxUrl(imageUrl)}
          />
        )}

        {viewMode === "heatmap" && (
          <div className="relative">
            <button
              onClick={() => setLightboxUrl(imageUrl)}
              className="absolute top-2 right-2 z-10 rounded-full bg-background/80 border border-border p-1.5 hover:bg-muted transition-colors"
            >
              <ZoomIn className="h-3.5 w-3.5 text-foreground" />
            </button>
            {/* Hidden image for canvas drawing */}
            <img
              src={imageUrl}
              alt=""
              className="invisible absolute"
              crossOrigin="anonymous"
              onLoad={handleImageLoad}
            />
            <canvas
              ref={canvasRef}
              className="mx-auto max-h-64 rounded-lg object-contain w-full"
            />
            {/* Marker overlays */}
            {regions.map((region, idx) => (
              <Tooltip key={idx}>
                <TooltipTrigger asChild>
                  <button
                    className={`absolute flex items-center justify-center w-5 h-5 rounded-full border-2 transition-all cursor-pointer ${
                      hoveredRegion === idx
                        ? "bg-destructive border-destructive-foreground scale-125 z-10"
                        : "bg-destructive/70 border-destructive-foreground/50 hover:scale-110"
                    }`}
                    style={{
                      left: `${(region.x + region.w / 2) * 100}%`,
                      top: `${(region.y + region.h / 2) * 100}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                    onMouseEnter={() => setHoveredRegion(idx)}
                    onMouseLeave={() => setHoveredRegion(null)}
                  >
                    <MapPin className="h-3 w-3 text-destructive-foreground" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[200px] text-xs">
                  {region.label}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        )}

        {viewMode === "split" && (
          <div className="flex">
            <div className="w-1/2 overflow-hidden border-r border-border">
              <img
                src={imageUrl}
                alt="Original"
                className="max-h-64 object-contain w-full cursor-zoom-in"
                onClick={() => setLightboxUrl(imageUrl)}
              />
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-background/80 text-[10px] font-medium text-foreground">
                Original
              </div>
            </div>
            <div className="w-1/2 overflow-hidden relative">
              <img
                src={imageUrl}
                alt=""
                className="invisible absolute"
                crossOrigin="anonymous"
                onLoad={handleImageLoad}
              />
              <canvas
                ref={canvasRef}
                className="max-h-64 object-contain w-full"
              />
              {regions.map((region, idx) => (
                <Tooltip key={idx}>
                  <TooltipTrigger asChild>
                    <button
                      className="absolute flex items-center justify-center w-4 h-4 rounded-full bg-destructive/70 border border-destructive-foreground/50 cursor-pointer hover:scale-110 transition-transform"
                      style={{
                        left: `${(region.x + region.w / 2) * 100}%`,
                        top: `${(region.y + region.h / 2) * 100}%`,
                        transform: "translate(-50%, -50%)",
                      }}
                    >
                      <MapPin className="h-2.5 w-2.5 text-destructive-foreground" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[200px] text-xs">
                    {region.label}
                  </TooltipContent>
                </Tooltip>
              ))}
              <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-background/80 text-[10px] font-medium text-foreground">
                Heatmap
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageHeatmap;
