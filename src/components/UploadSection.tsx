import { useState, useCallback, useRef, useEffect, forwardRef } from "react";
import { Upload, Image as ImageIcon, X, Loader2, Plus, Link as LinkIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { usePlan } from "@/contexts/PlanContext";

interface UploadSectionProps {
  onAnalyze: (files: File[]) => void;
  isAnalyzing: boolean;
}

interface FilePreview {
  file: File;
  preview: string;
}

const UploadSection = forwardRef<HTMLDivElement, UploadSectionProps>(
  ({ onAnalyze, isAnalyzing }, ref) => {
    const [dragActive, setDragActive] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<FilePreview[]>([]);
    const [urlInput, setUrlInput] = useState("");
    const [urlLoading, setUrlLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const { plan, limits } = usePlan();

    const addFiles = useCallback((newFiles: FileList | File[]) => {
      const filesToAdd = Array.from(newFiles);
      const validFiles: FilePreview[] = [];

      for (const file of filesToAdd) {
        if (file.size > 10 * 1024 * 1024) {
          alert(`${file.name} exceeds 10 MB limit`);
          continue;
        }
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
          alert(`${file.name} is not a supported format (JPG, PNG, WEBP)`);
          continue;
        }
        validFiles.push({ file, preview: URL.createObjectURL(file) });
      }

      setSelectedFiles((prev) => {
        const combined = [...prev, ...validFiles];
        if (combined.length > 10) {
          alert("Maximum 10 images per batch");
          return combined.slice(0, 10);
        }
        return combined;
      });
    }, []);

    // Handle paste events globally
    useEffect(() => {
      const handlePaste = (e: ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (!items) return;
        const files: File[] = [];
        for (const item of Array.from(items)) {
          if (item.type.startsWith("image/")) {
            const file = item.getAsFile();
            if (file) files.push(file);
          }
        }
        if (files.length > 0) {
          e.preventDefault();
          addFiles(files);
        }
      };
      document.addEventListener("paste", handlePaste);
      return () => document.removeEventListener("paste", handlePaste);
    }, [addFiles]);

    const fetchImageFromUrl = useCallback(async (url: string): Promise<File | null> => {
      try {
        const res = await fetch(url);
        if (!res.ok) return null;
        const blob = await res.blob();
        if (!["image/jpeg", "image/png", "image/webp"].includes(blob.type)) return null;
        const name = url.split("/").pop()?.split("?")[0] || "dropped-image";
        return new File([blob], name, { type: blob.type });
      } catch {
        return null;
      }
    }, []);

    const handleUrlSubmit = useCallback(async () => {
      if (!urlInput.trim()) return;
      setUrlLoading(true);
      const file = await fetchImageFromUrl(urlInput.trim());
      if (file) {
        addFiles([file]);
        setUrlInput("");
      } else {
        alert("Could not load that image. Check the URL or try saving it locally.");
      }
      setUrlLoading(false);
    }, [urlInput, fetchImageFromUrl, addFiles]);

    const handleDrop = useCallback(
      async (e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(false);

        if (e.dataTransfer.files?.length) {
          addFiles(e.dataTransfer.files);
          return;
        }

        const url =
          e.dataTransfer.getData("text/uri-list") ||
          e.dataTransfer.getData("text/plain") ||
          "";

        const html = e.dataTransfer.getData("text/html");
        const srcMatch = html?.match(/<img[^>]+src="([^"]+)"/i);
        const imageUrl = srcMatch?.[1] || url;

        if (imageUrl && /^https?:\/\/.+/i.test(imageUrl)) {
          const file = await fetchImageFromUrl(imageUrl);
          if (file) {
            addFiles([file]);
          } else {
            alert("Could not load that image. Try saving it locally first.");
          }
        }
      },
      [addFiles, fetchImageFromUrl]
    );

    const removeFile = (index: number) => {
      setSelectedFiles((prev) => {
        URL.revokeObjectURL(prev[index].preview);
        return prev.filter((_, i) => i !== index);
      });
    };

    const clearAll = () => {
      selectedFiles.forEach((f) => URL.revokeObjectURL(f.preview));
      setSelectedFiles([]);
    };

    return (
      <section ref={ref} id="upload" className="py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <motion.h2
              className="mb-3 font-display text-3xl font-bold text-foreground"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              Upload & Analyze
            </motion.h2>
            <motion.p
              className="mb-6 text-muted-foreground"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              {plan === "free" ? (
                <>Analyze <span className="text-primary font-semibold">1 image at a time</span> — {limits.scansPerDay} scans per day on the Free plan.</>
              ) : plan === "plus" ? (
                <>Drop up to <span className="text-primary font-semibold">{limits.batchLimit} images</span> — {limits.scansPerDay} scans/day with multi-model consensus.</>
              ) : (
                <>Drop up to <span className="text-primary font-semibold">{limits.batchLimit} images</span> — unlimited scans with full analysis suite.</>
              )}
            </motion.p>

            {/* URL paste input */}
            <motion.div
              className="mb-6 flex items-center gap-2 rounded-lg border border-border bg-card p-2"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
            >
              <LinkIcon className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                type="url"
                placeholder="Paste an image URL to analyze..."
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleUrlSubmit()}
              />
              <Button
                size="sm"
                variant="secondary"
                onClick={handleUrlSubmit}
                disabled={urlLoading || !urlInput.trim()}
              >
                {urlLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Fetch"}
              </Button>
            </motion.div>

            {selectedFiles.length === 0 ? (
              <motion.div
                className={`relative cursor-pointer rounded-xl border-2 border-dashed p-16 transition-all ${
                  dragActive
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40 hover:bg-muted/30"
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                whileHover={{ scale: 1.01 }}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.length) addFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
                <div className="flex flex-col items-center gap-4">
                  <motion.div
                    className="rounded-full bg-primary/10 p-4"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Upload className="h-8 w-8 text-primary" />
                  </motion.div>
                  <div>
                    <p className="text-lg font-medium text-foreground">
                      Drop or click to upload
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      JPG, PNG, or WEBP — max 10 MB{plan === "free" ? " · 1 image" : ` · up to ${limits.batchLimit} images`}
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                className="rounded-xl border border-border bg-card p-6 shadow-card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {/* Image grid */}
                <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  <AnimatePresence>
                    {selectedFiles.map((fp, i) => (
                      <motion.div
                        key={fp.preview}
                        className="group relative overflow-hidden rounded-lg border border-border bg-muted aspect-square"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.2 }}
                      >
                        <img
                          src={fp.preview}
                          alt={fp.file.name}
                          className="h-full w-full object-cover"
                        />
                        {!isAnalyzing && (
                          <button
                            onClick={() => removeFile(i)}
                            className="absolute top-1 right-1 rounded-full bg-background/80 p-1 opacity-0 transition-opacity group-hover:opacity-100"
                          >
                            <X className="h-3.5 w-3.5 text-foreground" />
                          </button>
                        )}
                        {isAnalyzing && (
                          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {selectedFiles.length < 10 && !isAnalyzing && (
                    <button
                      onClick={() => inputRef.current?.click()}
                      className="flex aspect-square items-center justify-center rounded-lg border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                    >
                      <Plus className="h-6 w-6" />
                    </button>
                  )}
                </div>

                <input
                  ref={inputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.length) addFiles(e.target.files);
                    e.target.value = "";
                  }}
                />

                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    <ImageIcon className="mr-1.5 inline h-4 w-4" />
                    {selectedFiles.length} image{selectedFiles.length !== 1 ? "s" : ""} selected
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAll}
                      disabled={isAnalyzing}
                    >
                      <X className="mr-1 h-4 w-4" />
                      Clear All
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => onAnalyze(selectedFiles.map((f) => f.file))}
                      disabled={isAnalyzing}
                      className="shadow-glow"
                    >
                      {isAnalyzing ? (
                        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="mr-1 h-4 w-4" />
                      )}
                      Analyze {selectedFiles.length > 1 ? `All ${selectedFiles.length}` : ""}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>
    );
  }
);

UploadSection.displayName = "UploadSection";

export default UploadSection;
