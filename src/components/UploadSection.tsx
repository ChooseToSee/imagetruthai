import { useState, useCallback, useRef, forwardRef } from "react";
import { Upload, Image as ImageIcon, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UploadSectionProps {
  onAnalyze: (file: File) => void;
  isAnalyzing: boolean;
}

const UploadSection = forwardRef<HTMLDivElement, UploadSectionProps>(
  ({ onAnalyze, isAnalyzing }, ref) => {
    const [dragActive, setDragActive] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFile = useCallback((file: File) => {
      if (file.size > 10 * 1024 * 1024) {
        alert("File must be under 10 MB");
        return;
      }
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        alert("Please upload a JPG, PNG, or WEBP image");
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }, []);

    const handleDrop = useCallback(
      (e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(false);
        if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
      },
      [handleFile]
    );

    const clearFile = () => {
      setSelectedFile(null);
      setPreview(null);
    };

    return (
      <section ref={ref} id="upload" className="py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-3 font-display text-3xl font-bold text-foreground">
              Upload & Analyze
            </h2>
            <p className="mb-10 text-muted-foreground">
              Drop an image below — we'll tell you if it's AI-generated in seconds.
            </p>

            {!selectedFile ? (
              <div
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
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleFile(e.target.files[0]);
                  }}
                />
                <div className="flex flex-col items-center gap-4">
                  <div className="rounded-full bg-primary/10 p-4">
                    <Upload className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-foreground">
                      Drop or click to upload
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      JPG, PNG, or WEBP — max 10 MB
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-card p-6 shadow-card">
                <div className="relative mb-6 overflow-hidden rounded-lg">
                  <img
                    src={preview!}
                    alt="Preview"
                    className="mx-auto max-h-80 rounded-lg object-contain"
                  />
                  {isAnalyzing && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm font-medium text-foreground">
                          Analyzing image…
                        </p>
                      </div>
                      {/* Scan line effect */}
                      <div className="absolute inset-x-0 h-0.5 bg-primary/60 animate-scan-line" />
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <ImageIcon className="h-4 w-4" />
                    <span className="truncate max-w-[200px]">{selectedFile.name}</span>
                    <span>({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFile}
                      disabled={isAnalyzing}
                    >
                      <X className="mr-1 h-4 w-4" />
                      Clear
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => onAnalyze(selectedFile)}
                      disabled={isAnalyzing}
                      className="shadow-glow"
                    >
                      {isAnalyzing ? (
                        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="mr-1 h-4 w-4" />
                      )}
                      Analyze
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }
);

UploadSection.displayName = "UploadSection";

export default UploadSection;
