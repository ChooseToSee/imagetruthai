import { useState, useCallback, useRef, useEffect, forwardRef } from "react";
import { Upload, Image as ImageIcon, X, Loader2, Plus, Link as LinkIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { usePlan } from "@/contexts/PlanContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  getSessionConsent,
  setSessionConsent,
  checkExistingConsent,
  logConsent,
  CURRENT_TERMS_VERSION,
} from "@/lib/consent";

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
    const [consentGiven, setConsentGiven] = useState(() => getSessionConsent());
    const [consentLoading, setConsentLoading] = useState(false);
    const [consent1, setConsent1] = useState(false);
    const [consent2, setConsent2] = useState(false);
    const [consent3, setConsent3] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const { plan, limits } = usePlan();
    const { user } = useAuth();

    const maxSlots = limits.batchLimit;
    const allConsentsChecked = consent1 && consent2 && consent3;

    // On mount or user change, check if consent already recorded for current terms version
    useEffect(() => {
      if (consentGiven) return;
      if (!user) return;
      let cancelled = false;
      checkExistingConsent(user.id).then((alreadyConsented) => {
        if (cancelled) return;
        if (alreadyConsented) {
          setConsentGiven(true);
          setSessionConsent();
        }
      });
      return () => { cancelled = true; };
    }, [user, consentGiven]);

    const handleConsentConfirm = useCallback(async () => {
      setConsentLoading(true);
      try {
        if (user) {
          await logConsent();
        }
        setConsentGiven(true);
        setSessionConsent();
      } catch (err) {
        console.error("Failed to log consent:", err);
        // Still allow usage even if logging fails
        setConsentGiven(true);
        setSessionConsent();
      } finally {
        setConsentLoading(false);
      }
    }, [user]);

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
        if (combined.length > maxSlots) {
          alert(`Maximum ${maxSlots} image${maxSlots > 1 ? "s" : ""} on your plan`);
          return combined.slice(0, maxSlots);
        }
        return combined;
      });
    }, [maxSlots]);

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

    // Determine grid columns based on slot count
    const gridCols =
      maxSlots === 1
        ? "grid-cols-1 max-w-[240px] mx-auto"
        : maxSlots <= 5
        ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-5"
        : "grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-5";

    // For pro tier, only show up to 10 visual slots at a time (filled + some empty)
    const visibleSlotCount = maxSlots <= 10 ? maxSlots : Math.max(selectedFiles.length + 2, 10);
    const emptySlots = Math.max(0, Math.min(maxSlots, visibleSlotCount) - selectedFiles.length);

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
                <>Drop up to <span className="text-primary font-semibold">{limits.batchLimit} images</span> — {limits.scansPerDay} scans/day on the Plus plan.</>
              ) : (
                <>Drop up to <span className="text-primary font-semibold">{limits.batchLimit} images</span> — unlimited scans with full analysis suite.</>
              )}
            </motion.p>

            {/* Upgrade prompt */}
            {plan === "free" && (
              <motion.p
                className="mb-2 text-xs text-muted-foreground"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.15 }}
              >
                Need batch uploads & more scans?{" "}
                <a href="#pricing" className="font-semibold text-primary hover:underline">Upgrade to Plus</a>
              </motion.p>
            )}
            {plan === "plus" && (
              <motion.p
                className="mb-2 text-xs text-muted-foreground"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.15 }}
              >
                Want unlimited scans, PDF reports & API access?{" "}
                <a href="#pricing" className="font-semibold text-primary hover:underline">Go Pro</a>
              </motion.p>
            )}

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

            {/* Upload hint */}
            {/* Consent checkboxes — required before first upload */}
            {!consentGiven && (
              <motion.div
                className="mb-6 space-y-3 rounded-xl border border-border bg-card p-5 text-left shadow-card"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.18 }}
              >
                <p className="mb-3 text-sm font-medium text-foreground">Before uploading, please confirm:</p>
                <div className="flex items-start gap-3">
                  <Checkbox id="consent-1" checked={consent1} onCheckedChange={(v) => setConsent1(v === true)} />
                  <Label htmlFor="consent-1" className="text-sm leading-relaxed text-muted-foreground cursor-pointer">
                    I confirm that I have the legal right to upload this image and grant ImageTruth AI permission to analyze it.
                  </Label>
                </div>
                <div className="flex items-start gap-3">
                  <Checkbox id="consent-2" checked={consent2} onCheckedChange={(v) => setConsent2(v === true)} />
                  <Label htmlFor="consent-2" className="text-sm leading-relaxed text-muted-foreground cursor-pointer">
                    I understand that ImageTruth AI provides AI-generated analysis that may be inaccurate or incomplete and should not be treated as definitive proof.
                  </Label>
                </div>
                <div className="flex items-start gap-3">
                  <Checkbox id="consent-3" checked={consent3} onCheckedChange={(v) => setConsent3(v === true)} />
                  <Label htmlFor="consent-3" className="text-sm leading-relaxed text-muted-foreground cursor-pointer">
                    I agree to the{" "}
                    <a href="/terms" className="text-primary hover:underline">Terms of Service</a> and{" "}
                    <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>.
                  </Label>
                </div>
                <Button
                  size="sm"
                  className="mt-2"
                  disabled={!allConsentsChecked || consentLoading}
                  onClick={handleConsentConfirm}
                >
                  {consentLoading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
                  Continue to Upload
                </Button>
              </motion.div>
            )}

            {consentGiven && (
              <>
            <motion.p
              className="mb-3 text-sm text-muted-foreground"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.18 }}
            >
              Drag & drop an image below, click to browse files, or paste from clipboard (<kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-xs font-mono">⌘V</kbd>)
            </motion.p>

            {/* Upload slots grid */}
            <motion.div
              className="rounded-xl border border-border bg-card p-6 shadow-card"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
            >
              <div className={`grid gap-3 ${gridCols}`}>
                <AnimatePresence>
                  {/* Filled slots */}
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

                {/* Empty slots */}
                {!isAnalyzing &&
                  Array.from({ length: emptySlots }).map((_, i) => (
                    <motion.button
                      key={`empty-${i}`}
                      onClick={() => inputRef.current?.click()}
                      className={`flex aspect-square items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
                        dragActive
                          ? "border-primary bg-primary/5"
                          : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary"
                      }`}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.15, delay: i * 0.03 }}
                    >
                      <Plus className="h-6 w-6" />
                    </motion.button>
                  ))}
              </div>

              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple={maxSlots > 1}
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.length) addFiles(e.target.files);
                  e.target.value = "";
                }}
              />

              {/* Footer actions */}
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  <ImageIcon className="mr-1.5 inline h-4 w-4" />
                  {selectedFiles.length}/{maxSlots} slot{maxSlots !== 1 ? "s" : ""} used
                </p>
                <div className="flex gap-2">
                  {selectedFiles.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAll}
                      disabled={isAnalyzing}
                    >
                      <X className="mr-1 h-4 w-4" />
                      Clear
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={() => onAnalyze(selectedFiles.map((f) => f.file))}
                    disabled={isAnalyzing || selectedFiles.length === 0}
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

            <p className="mt-3 text-xs text-muted-foreground">
              JPG, PNG, or WEBP — max 10 MB per image
              {plan !== "pro" && (
                <> · <a href="#pricing" className="text-primary hover:underline">Upgrade for more slots</a></>
              )}
            </p>
            <p className="mt-1.5 text-[11px] text-muted-foreground/70">
              AI-generated analysis may be inaccurate. Results are informational only.{" "}
              <a href="/ai-disclaimer" className="text-primary hover:underline">Learn more</a>
            </p>
            <p className="mt-2 text-[11px] font-medium text-destructive/80">
              ⚠ Do not upload illegal, abusive, or sensitive images. Uploading such content may result in account suspension.
            </p>
              </>
            )}
          </div>
        </div>
      </section>
    );
  }
);

UploadSection.displayName = "UploadSection";

export default UploadSection;
