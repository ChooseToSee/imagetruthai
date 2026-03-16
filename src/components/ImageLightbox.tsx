import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface ImageLightboxProps {
  imageUrl: string | null;
  onClose: () => void;
}

const ImageLightbox = ({ imageUrl, onClose }: ImageLightboxProps) => {
  useEffect(() => {
    if (!imageUrl) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose, imageUrl]);

  return (
    <AnimatePresence>
      {imageUrl && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.img
            src={imageUrl}
            alt="Enlarged view"
            className="max-h-[90vh] max-w-[90vw] rounded-xl shadow-2xl object-contain"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 rounded-full bg-card border border-border p-2 text-foreground hover:bg-muted transition-colors shadow-lg"
          >
            <X className="h-5 w-5" />
          </button>
          <p className="absolute bottom-4 text-xs text-muted-foreground">
            Press ESC or click outside to close
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ImageLightbox;
