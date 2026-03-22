import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Eye, Layers, SplitSquareHorizontal, MapPin, ZoomIn, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
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

const SIGNAL_MAP: { keywords: string[]; label: string; color: string; placement: string }[] = [
  { keywords: ["lighting", "shadow", "illumination", "light"], label: "Lighting inconsistency detected", color: "rgba(255, 50, 50, 0.75)", placement: "top" },
  { keywords: ["compression", "jpeg", "artifact", "quality"], label: "Possible compression artifact detected", color: "rgba(255, 140, 0, 0.75)", placement: "scatter" },
  { keywords: ["edge", "boundary", "outline", "halo", "border"], label: "Edge irregularity suggesting possible editing boundary", color: "rgba(220, 0, 255, 0.75)", placement: "edges" },
  { keywords: ["clone", "repeating", "pattern", "duplicate", "copy"], label: "Possible clone pattern detected", color: "rgba(0, 210, 255, 0.75)", placement: "clone" },
  { keywords: ["texture", "noise", "grain", "smoothing", "skin", "blur"], label: "Texture anomaly detected", color: "rgba(150, 80, 255, 0.75)", placement: "center" },
  { keywords: ["metadata", "exif", "camera"], label: "Metadata anomaly detected", color: "rgba(255, 220, 0, 0.75)", placement: "bottom" },
  { keywords: ["perspective", "distort", "warp", "stretch"], label: "Perspective inconsistency detected", color: "rgba(0, 255, 100, 0.75)", placement: "scatter" },
  { keywords: ["reflection", "mirror"], label: "Inconsistent reflection detected", color: "rgba(255, 80, 80, 0.75)", placement: "center" },
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
    const count = signal.placement === "clone" ? 2 : Math.max(1, Math.floor(rand() * 3));

    for (let i = 0; i < count; i++) {
      let x: number, y: number;

      switch (signal.placement) {
        case "top":
          // Lighting/shadow → top third
          x = 0.1 + rand() * 0.6;
          y = 0.05 + rand() * 0.3;
          break;
        case "edges":
          // Edge signals → near left or right edges
          x = rand() > 0.5 ? 0.75 + rand() * 0.2 : 0.05 + rand() * 0.15;
          y = 0.1 + rand() * 0.7;
          break;
        case "center":
          // Texture/skin → center area
          x = 0.25 + rand() * 0.5;
          y = 0.2 + rand() * 0.5;
          break;
        case "bottom":
          // Metadata → bottom third
          x = 0.1 + rand() * 0.6;
          y = 0.65 + rand() * 0.25;
          break;
        case "clone":
          // Clone/pattern → pairs with similar positions
          if (i === 0) {
            x = 0.15 + rand() * 0.3;
            y = 0.2 + rand() * 0.4;
          } else {
            // Mirror-ish position of previous region
            const prev = regions[regions.length - 1];
            x = prev ? 1 - prev.x - 0.15 + rand() * 0.1 : 0.5 + rand() * 0.3;
            y = prev ? prev.y + (rand() * 0.1 - 0.05) : 0.2 + rand() * 0.4;
          }
          break;
        default:
          // Scatter across image
          x = 0.1 + rand() * 0.7;
          y = 0.1 + rand() * 0.7;
          break;
      }

      // Clamp values
      x = Math.max(0.05, Math.min(0.85, x));
      y = Math.max(0.05, Math.min(0.85, y));

      regions.push({
        x,
        y,
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
  const [activeMarker, setActiveMarker] = useState<number | null>(null);
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

  // Draw signal map on canvas
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

    // Draw signal regions with radial gradients
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
      const color = matchedSignal?.color || "rgba(255, 50, 50, 0.75)";
      const isActive = activeMarker === idx;
      const alpha = isActive ? 0.9 : region.intensity * 0.85;

      gradient.addColorStop(0, color.replace(/[\d.]+\)$/, `${alpha})`));
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [imgSize, regions, activeMarker, viewMode]);

  // Capture canvas with markers drawn directly onto it for lightbox
  const captureCanvasWithMarkers = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return imageUrl;
    const ctx = canvas.getContext("2d");
    if (!ctx) return canvas.toDataURL("image/png");

    // Save current canvas state
    const savedImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Draw markers onto canvas
    regions.forEach((region) => {
      const cx = (region.x + region.w / 2) * canvas.width;
      const cy = (region.y + region.h / 2) * canvas.height;

      // Circle marker
      ctx.beginPath();
      ctx.arc(cx, cy, 10, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(220, 38, 38, 0.85)";
      ctx.fill();
      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Pin dot
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fillStyle = "white";
      ctx.fill();
    });

    const dataUrl = canvas.toDataURL("image/png");

    // Restore canvas without markers
    ctx.putImageData(savedImageData, 0, 0);

    return dataUrl;
  }, [regions, imageUrl]);

  const modeButtons: { mode: ViewMode; icon: React.ReactNode; label: string }[] = [
    { mode: "original", icon: <Eye className="h-3.5 w-3.5" />, label: "Original" },
    { mode: "heatmap", icon: <Layers className="h-3.5 w-3.5" />, label: "Signal Map" },
    { mode: "split", icon: <SplitSquareHorizontal className="h-3.5 w-3.5" />, label: "Split" },
  ];

  if (regions.length === 0) {
    return (
      <div className="relative mb-4 overflow-hidden rounded-lg bg-muted">
        <img src={imageUrl} alt="Analyzed" className="mx-auto max-h-64 rounded-lg object-contain w-full" />
      </div>
    );
  }

  const MarkerOverlay = ({ region, idx, small = false }: { region: HeatmapRegion; idx: number; small?: boolean }) => (
    <div key={idx} className="absolute" style={{
      left: `${(region.x + region.w / 2) * 100}%`,
      top: `${(region.y + region.h / 2) * 100}%`,
      transform: "translate(-50%, -50%)",
      zIndex: activeMarker === idx ? 20 : 10,
    }}>
      <button
        className={`flex items-center justify-center rounded-full border-2 transition-all cursor-pointer ${
          small ? "w-4 h-4" : "w-5 h-5"
        } ${
          activeMarker === idx
            ? "bg-destructive border-destructive-foreground scale-125 z-10"
            : "bg-destructive/70 border-destructive-foreground/50 hover:scale-110"
        }`}
        onClick={(e) => {
          e.stopPropagation();
          setActiveMarker(activeMarker === idx ? null : idx);
        }}
      >
        <MapPin className={`${small ? "h-2.5 w-2.5" : "h-3 w-3"} text-destructive-foreground`} />
      </button>
      {activeMarker === idx && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded bg-popover border border-border shadow-lg text-xs text-popover-foreground max-w-[200px] whitespace-normal z-30">
          {region.label}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-popover border-r border-b border-border rotate-45 -mt-1" />
        </div>
      )}
    </div>
  );

  return (
    <div className="mb-4">
      {/* View mode toggle */}
      <div className="flex gap-1 mb-2 p-1 rounded-lg bg-muted/80 border border-border w-fit">
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

      {/* Disclaimer */}
      <div className="flex items-start gap-2 mb-3 px-3 py-2 rounded-md bg-muted/50 border border-border">
        <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          <span className="font-medium text-foreground">Signal Map</span> shows illustrative indicators based on detected signal types. Regions are not pixel-precise — for forensic-level analysis see the Details tab.
        </p>
      </div>

      {/* Sample indicator count */}
      {viewMode !== "original" && (
        <div className="mb-2">
          <p className="text-[11px] text-muted-foreground">
            Showing {regions.length} sample indicator{regions.length !== 1 ? "s" : ""} — tap markers for details
          </p>
        </div>
      )}

      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-lg bg-muted"
        onClick={() => setActiveMarker(null)}
      >
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
              onClick={(e) => { e.stopPropagation(); const c = canvasRef.current; setLightboxUrl(c ? c.toDataURL("image/png") : imageUrl); }}
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
              className="mx-auto max-h-64 rounded-lg object-contain w-full cursor-zoom-in"
              onClick={(e) => { e.stopPropagation(); const c = canvasRef.current; setLightboxUrl(c ? c.toDataURL("image/png") : imageUrl); }}
            />
            {/* Marker overlays */}
            {regions.map((region, idx) => (
              <MarkerOverlay key={idx} region={region} idx={idx} />
            ))}
          </div>
        )}

        {viewMode === "split" && (
          <div className="flex">
            <div className="w-1/2 overflow-hidden border-r border-border relative">
              <img
                src={imageUrl}
                alt="Original"
                className="max-h-64 object-contain w-full cursor-zoom-in"
                onClick={(e) => { e.stopPropagation(); setLightboxUrl(imageUrl); }}
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
                className="max-h-64 object-contain w-full cursor-zoom-in"
                onClick={(e) => { e.stopPropagation(); const c = canvasRef.current; setLightboxUrl(c ? c.toDataURL("image/png") : imageUrl); }}
              />
              {regions.map((region, idx) => (
                <MarkerOverlay key={idx} region={region} idx={idx} small />
              ))}
              <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-background/80 text-[10px] font-medium text-foreground">
                Signal Map
              </div>
            </div>
          </div>
        )}
      </div>
      <ImageLightbox imageUrl={lightboxUrl} onClose={() => setLightboxUrl(null)} />
    </div>
  );
};

export default ImageHeatmap;
