import { useState } from "react";
import { motion } from "framer-motion";
import { ZoomIn } from "lucide-react";
import ImageLightbox from "@/components/ImageLightbox";

interface ImageHeatmapProps {
  imageUrl: string;
  reasons: string[];
  manipulationReasons?: string[];
}

const ImageHeatmap = ({ imageUrl }: ImageHeatmapProps) => {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  return (
    <div className="mb-4">
      <div
        className="relative overflow-hidden rounded-lg bg-muted cursor-zoom-in group"
        onClick={() => setLightboxUrl(imageUrl)}
      >
        <motion.img
          src={imageUrl}
          alt="Analyzed"
          className="mx-auto max-h-64 rounded-lg object-contain w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />
        <div className="absolute inset-0 flex items-center justify-center bg-background/30 opacity-0 group-hover:opacity-100 transition-opacity">
          <ZoomIn className="h-8 w-8 text-foreground" />
        </div>
        <p className="absolute bottom-2 left-0 right-0 text-center text-[10px] text-white/70">
          Click to enlarge
        </p>
      </div>
      <ImageLightbox
        imageUrl={lightboxUrl}
        onClose={() => setLightboxUrl(null)}
      />
    </div>
  );
};

export default ImageHeatmap;
