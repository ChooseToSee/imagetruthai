import { useState, useCallback, useEffect, useRef } from "react";
import { AlertTriangle, CheckCircle, Info, RotateCcw, ChevronDown, ChevronUp, Brain, Share2, Check, Pencil, ShieldCheck, Shield, Download, FileText, Eye, Link as LinkIcon, Lock, Globe, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { shareContent } from "@/lib/share";
import { exportReportPdf } from "@/lib/pdf-export";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePlan } from "@/contexts/PlanContext";
import ImageHeatmap from "@/components/ImageHeatmap";

export interface ModelBreakdown {
  model: string;
  verdict: "ai" | "human";
  confidence: number;
  reasons: string[];
  manipulation?: {
    edited: boolean;
    confidence: number;
    reasons: string[];
  };
}

export interface ManipulationResult {
  edited: boolean;
  confidence: number;
  reasons: string[];
  tips: string[];
}

export interface AnalysisResult {
  verdict: "ai" | "human";
  confidence: number;
  reasons: string[];
  tips: string[];
  modelBreakdown?: ModelBreakdown[];
  manipulation?: ManipulationResult;
}

interface ResultsDisplayProps {
  result: AnalysisResult;
  imagePreview: string;
  onReset: () => void;
  streamProgress?: { completed: number; total: number };
  partialReady?: boolean;
  onKeepWaiting?: () => void;
}

const ModelCard = ({ m }: { m: ModelBreakdown }) => {
  const isAI = m.verdict === "ai";
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-foreground">{m.model}</span>
        <span className={`text-xs font-bold ${isAI ? "text-destructive" : "text-success"}`}>
          {m.confidence}% {isAI ? "AI" : "Human"}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted mb-2">
        <div
          className={`h-full rounded-full ${isAI ? "bg-destructive" : "bg-success"}`}
          style={{ width: `${m.confidence}%`, float: isAI ? "right" : "left" }}
        />
      </div>
      <ul className="space-y-1">
        {m.reasons.slice(0, 3).map((r, i) => (
          <li key={i} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
            <div className={`mt-1 h-1 w-1 shrink-0 rounded-full ${isAI ? "bg-destructive" : "bg-success"}`} />
            {r}
          </li>
        ))}
      </ul>
    </div>
  );
};

const ResultsDisplay = ({ result, imagePreview, onReset, streamProgress, partialReady, onKeepWaiting }: ResultsDisplayProps) => {
  const isAI = result.verdict === "ai";
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showEditBreakdown, setShowEditBreakdown] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [shareReportId, setShareReportId] = useState<string | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { plan } = usePlan();
  const isStreaming = !!streamProgress && !partialReady;
  const imageBlobRef = useRef<Blob | null>(null);

  useEffect(() => {
    if (!imagePreview) return;
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(imagePreview);
        if (!response.ok) {
          console.log("[Share] Pre-fetch response not ok:", response.status);
          return;
        }
        const blob = await response.blob();
        if (!cancelled) {
          imageBlobRef.current = blob;
          console.log("[Share] Image pre-fetched and stored, size:", blob.size, "type:", blob.type);
        }
      } catch (err) {
        console.log("[Share] Pre-fetch failed:", err);
      }
    })();
    return () => { cancelled = true; };
  }, [imagePreview]);

  const manipulation = result.manipulation;
  const isEdited = manipulation?.edited ?? false;

  const modelsAgreed = result.modelBreakdown
    ? result.modelBreakdown.filter((m) => m.verdict === result.verdict).length
    : 0;
  const totalModels = result.modelBreakdown?.length ?? 0;

  const confidenceLabel = result.confidence >= 85 ? "High" : result.confidence >= 60 ? "Moderate" : "Low";
  const confidenceLabelDescription =
    confidenceLabel === "High"
      ? "High confidence in model findings"
      : confidenceLabel === "Moderate"
      ? "Moderate confidence — independent verification suggested"
      : "Low confidence — results inconclusive, verify independently";

  // Build detected signals from reasons
  const signalKeywords = [
    { label: "Lighting Inconsistencies", keywords: ["lighting", "shadow", "illumination"] },
    { label: "Compression Artifacts", keywords: ["compression", "jpeg", "artifact", "quality"] },
    { label: "Edge Irregularities", keywords: ["edge", "boundary", "outline", "halo"] },
    { label: "Metadata Anomalies", keywords: ["metadata", "exif", "camera", "gps"] },
    { label: "Texture Inconsistencies", keywords: ["texture", "noise", "grain", "smoothing", "skin"] },
    { label: "Pattern Anomalies", keywords: ["pattern", "repeating", "clone", "uniform"] },
  ];

  const allReasons = [
    ...result.reasons,
    ...(manipulation?.reasons ?? []),
  ].map((r) => r.toLowerCase());

  const detectedSignals = signalKeywords.map((s) => ({
    label: s.label,
    detected: s.keywords.some((kw) => allReasons.some((r) => r.includes(kw))),
  }));

  const handleDownloadPdf = useCallback(async () => {
    setIsExportingPdf(true);
    try {
      await exportReportPdf(result, imagePreview);
      toast({ title: "PDF downloaded", description: "Your analysis report has been saved as PDF." });
    } catch (err) {
      console.error("PDF export error:", err);
      toast({ title: "Export failed", description: "Could not generate PDF.", variant: "destructive" });
    } finally {
      setIsExportingPdf(false);
    }
  }, [result, imagePreview, toast]);

  const handleGenerateShareLink = useCallback(async () => {
    if (!user) {
      toast({ title: "Sign in required", description: "You need to be signed in to share reports.", variant: "destructive" });
      return;
    }
    setIsSharing(true);
    try {
      // Ensure session token is fresh before authenticated insert
      const { data: { session: freshSession } } = await supabase.auth.getSession();
      if (!freshSession) {
        toast({ title: "Session expired", description: "Please sign in again to share reports.", variant: "destructive" });
        setIsSharing(false);
        return;
      }

      // Upload blob image to storage so shared reports have a public URL
      let publicImageUrl: string | null = null;
      if (imagePreview.startsWith("blob:")) {
        try {
          const response = await fetch(imagePreview);
          if (!response.ok) throw new Error("Failed to fetch blob");
          const blob = await response.blob();
          const ext = blob.type.includes("png") ? "png" : blob.type.includes("webp") ? "webp" : "jpg";
          // Path must start with user_id to satisfy RLS upload policy
          const filePath = `${user.id}/${crypto.randomUUID()}.${ext}`;

          console.log("[Share] Uploading image:", filePath, "size:", blob.size, "type:", blob.type);

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from("scan-images")
            .upload(filePath, blob, { contentType: blob.type, upsert: false });

          if (uploadError) {
            console.error("[Share] Upload failed:", uploadError);
          } else {
            console.log("[Share] Upload success:", uploadData);
            const { data: urlData } = supabase.storage
              .from("scan-images")
              .getPublicUrl(filePath);
            publicImageUrl = urlData.publicUrl;
            console.log("[Share] Public URL:", publicImageUrl);
          }
        } catch (uploadErr) {
          console.error("[Share] Upload exception:", uploadErr);
        }
      } else {
        publicImageUrl = imagePreview;
      }
      console.log("[Share] Final image URL:", publicImageUrl);

      const { data, error } = await supabase.from("shared_reports").insert({
        user_id: user.id,
        is_public: true,
        image_url: publicImageUrl,
        verdict: result.verdict,
        confidence: result.confidence,
        reasons: result.reasons,
        tips: result.tips,
        model_breakdown: result.modelBreakdown ? JSON.parse(JSON.stringify(result.modelBreakdown)) : null,
        manipulation: result.manipulation ? JSON.parse(JSON.stringify(result.manipulation)) : null,
      }).select("share_token, id").single();
      if (error) throw error;
      const link = `${window.location.origin}/report/${data.share_token}`;
      setShareLink(link);
      setShareReportId(data.id);
      setIsPublic(true);
      toast({ title: "Share link ready!", description: "Copy the link below to share your report." });
    } catch (err: any) {
      console.error("Full share error:", err);
      toast({ title: "Failed to generate link", description: err?.message || JSON.stringify(err) || "Unknown error", variant: "destructive" });
    } finally {
      setIsSharing(false);
    }
  }, [user, result, imagePreview, toast]);

  const handleTogglePrivacy = useCallback(async () => {
    if (!shareReportId) return;
    const newPublic = !isPublic;
    const { error } = await supabase.from("shared_reports").update({ is_public: newPublic }).eq("id", shareReportId);
    if (error) {
      toast({ title: "Update failed", variant: "destructive" });
      return;
    }
    setIsPublic(newPublic);
    toast({ title: newPublic ? "Report is now public" : "Report is now private" });
  }, [shareReportId, isPublic, toast]);

  const handleShare = async () => {
    const editInfo = manipulation
      ? `\nEdit detection: ${manipulation.confidence}% — manipulation indicators ${isEdited ? "detected" : "not detected"}.`
      : "";
    const modelCount = result.modelBreakdown?.length ?? 1;

    const summary = `🔍 ImageTruth AI Analysis\n${result.confidence}% — ${isAI ? "AI generation indicators detected 🤖" : "No AI generation indicators detected ✅"}\n${result.reasons[0] || ""}${editInfo}\nAnalyzed by ${modelCount} independent AI model${modelCount !== 1 ? "s" : ""} for consensus accuracy.\nNote: Results show what models found — not a definitive determination.`;

    const appUrl = "https://imagetruthai.com";
    const reportUrl = shareLink || appUrl;

    const fullText = shareLink
      ? `${summary}\n\nView full report: ${shareLink}\n\nTry it free at ${appUrl}`
      : `${summary}\n\nTry it free at ${appUrl}`;

    console.log(
      "[Share] imagePreview type:",
      imagePreview?.startsWith("blob:")
        ? "blob"
        : imagePreview?.startsWith("https:")
        ? "https"
        : "other",
      "length:", imagePreview?.length
    );

    // Try to share with the actual analyzed image attached
    if (navigator.share) {
      try {
        let imageFile: File | null = null;

        // Prefer pre-fetched blob (avoids expired blob: URLs)
        if (imageBlobRef.current) {
          console.log("[Share] Using pre-fetched blob, size:", imageBlobRef.current.size);
          const t = imageBlobRef.current.type;
          const ext = t.includes("png") ? "png" : t.includes("webp") ? "webp" : "jpg";
          imageFile = new File(
            [imageBlobRef.current],
            `imagetruth-analysis.${ext}`,
            { type: t || "image/jpeg" }
          );
        } else if (imagePreview?.startsWith("blob:")) {
          console.log("[Share] Attempting fresh blob fetch...");
          try {
            const response = await fetch(imagePreview);
            const blob = await response.blob();
            console.log("[Share] Blob fetched, size:", blob.size, "type:", blob.type);
            const ext = blob.type.includes("png") ? "png" : blob.type.includes("webp") ? "webp" : "jpg";
            imageFile = new File(
              [blob],
              `imagetruth-analysis.${ext}`,
              { type: blob.type || "image/jpeg" }
            );
          } catch (e) {
            console.log("[Share] Fresh blob fetch failed:", e);
          }
        } else if (imagePreview?.startsWith("https:")) {
          console.log("[Share] Attempting HTTPS fetch...");
          try {
            const response = await fetch(imagePreview);
            const blob = await response.blob();
            console.log("[Share] HTTPS blob fetched, size:", blob.size, "type:", blob.type);
            imageFile = new File(
              [blob],
              "imagetruth-analysis.jpg",
              { type: blob.type || "image/jpeg" }
            );
          } catch (e) {
            console.log("[Share] HTTPS fetch failed:", e);
          }
        }

        if (imageFile) {
          const canShareFile = navigator.canShare?.({ files: [imageFile] }) ?? false;
          console.log("[Share] canShare with file:", canShareFile);
          if (canShareFile) {
            console.log("[Share] Sharing with image file attached");
            await navigator.share({
              title: "ImageTruth AI Analysis",
              text: fullText,
              url: reportUrl,
              files: [imageFile],
            });
            setCopied(true);
            toast({
              title: "Shared successfully!",
              description: "Your analysis has been shared.",
            });
            setTimeout(() => setCopied(false), 2000);
            return;
          } else {
            console.log("[Share] canShare returned false, falling through to URL share");
          }
        } else {
          console.log("[Share] No image file available, sharing URL only");
        }

        // URL-only fallback
        await navigator.share({
          title: "ImageTruth AI Analysis",
          text: fullText,
          url: reportUrl,
        });
        setCopied(true);
        toast({ title: "Shared successfully!" });
        setTimeout(() => setCopied(false), 2000);
        return;
      } catch (e) {
        if ((e as Error).name === "AbortError") {
          return;
        }
        console.log("[Share] navigator.share threw, falling back to clipboard:", e);
        // Fall through to clipboard
      }
    }

    // Desktop fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      toast({
        title: "Copied to clipboard!",
        description: "Paste anywhere to share your results.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = fullText;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      toast({ title: "Copied to clipboard!" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl">
          <motion.div
            className="rounded-xl border border-border bg-card shadow-card overflow-hidden"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {/* Image preview with heatmap */}
            <div className="p-6 pb-0">
              <div className="flex justify-center mb-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onReset}
                  className="gap-2 text-xs"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Upload Another Image
                </Button>
              </div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <ImageHeatmap
                  imageUrl={imagePreview}
                  reasons={result.reasons}
                  manipulationReasons={manipulation?.reasons}
                />
                <p className="text-[10px] text-muted-foreground/60 text-center mt-1 mb-2">
                  Click image to enlarge
                </p>
              </motion.div>

              {/* Streaming progress */}
              {isStreaming && (
                <div className="mb-4 flex items-center gap-3 rounded-lg bg-primary/5 border border-primary/10 px-4 py-3">
                  <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      Analyzing… {streamProgress.completed}/{streamProgress.total} models complete
                    </p>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <motion.div
                        className="h-full rounded-full bg-primary"
                        animate={{ width: `${(streamProgress.completed / streamProgress.total) * 100}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Partial results banner */}
              {partialReady && streamProgress && streamProgress.completed < streamProgress.total && (
                <div className="mb-4 flex items-center justify-between gap-3 rounded-lg bg-accent/50 border border-border px-4 py-3">
                  <p className="text-sm text-foreground">
                    Results based on <span className="font-semibold">{streamProgress.completed}/{streamProgress.total}</span> models
                  </p>
                  <Button size="sm" variant="outline" onClick={onKeepWaiting} className="shrink-0 text-xs">
                    Wait for all models
                  </Button>
                </div>
              )}
            </div>
            {/* Tabbed results */}
            <Tabs defaultValue="ai-detection" className="px-6 pb-4">
              <TabsList className="grid w-full grid-cols-3 mb-4 h-11 bg-muted/80 border border-border">
                <TabsTrigger value="ai-detection" className="gap-2 text-xs sm:text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=inactive]:bg-card data-[state=inactive]:text-foreground data-[state=inactive]:border data-[state=inactive]:border-border data-[state=inactive]:hover:bg-accent">
                  <Brain className="h-4 w-4" />
                  <span className="hidden sm:inline">AI Detection</span>
                  <span className="sm:hidden">AI</span>
                </TabsTrigger>
                <TabsTrigger value="edit-detection" className="gap-2 text-xs sm:text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=inactive]:bg-card data-[state=inactive]:text-foreground data-[state=inactive]:border data-[state=inactive]:border-border data-[state=inactive]:hover:bg-accent">
                  <Pencil className="h-4 w-4" />
                  <span className="hidden sm:inline">Edit Detection</span>
                  <span className="sm:hidden">Edits</span>
                </TabsTrigger>
                <TabsTrigger value="details" className="gap-2 text-xs sm:text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=inactive]:bg-card data-[state=inactive]:text-foreground data-[state=inactive]:border data-[state=inactive]:border-border data-[state=inactive]:hover:bg-accent">
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Details</span>
                  <span className="sm:hidden">Info</span>
                </TabsTrigger>
              </TabsList>

              {/* AI Detection Tab */}
              <TabsContent value="ai-detection">
                <motion.div
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 mb-4 ${
                    isAI
                      ? "bg-destructive/10 border border-destructive/20"
                      : "bg-success/10 border border-success/20"
                  }`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                >
                  {isAI ? (
                    <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-success shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="font-display text-lg font-bold text-foreground">
                      {isAI
                        ? `${result.confidence}% Likely AI-Generated`
                        : `${result.confidence}% Likely Human-Created`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {totalModels > 0
                        ? `${modelsAgreed} of ${totalModels} models found ${isAI ? "indicators of AI generation" : "no indicators of AI generation"}`
                        : isAI
                        ? "Indicators of AI generation were detected."
                        : "No indicators of AI generation were detected."}
                    </p>
                    {(() => {
                      const activeModels = result.modelBreakdown?.filter(
                        (m) => m.confidence > 0 && m.reasons.length > 0
                      ).length ?? 0;
                      if (activeModels > 0 && activeModels < 5) {
                        return (
                          <p className="text-xs text-muted-foreground/70 mt-1.5 flex items-center gap-1.5">
                            <Info className="h-3 w-3 shrink-0 text-warning" />
                            <span>
                              Analysis used{" "}
                              <span className="font-medium">{activeModels} of 5 models</span>
                              {" "}— one or more models were temporarily unavailable
                            </span>
                          </p>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </motion.div>

                {/* Confidence bar */}
                <div className="mb-4">
                  <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                    <span>Human</span>
                    <span>AI-Generated</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <motion.div
                      className={`h-full rounded-full ${isAI ? "bg-destructive" : "bg-success"}`}
                      initial={{ width: 0 }}
                      animate={{
                        width: `${isAI ? result.confidence : 100 - result.confidence}%`,
                      }}
                      transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                      style={{
                        marginLeft: isAI ? "auto" : "0",
                        float: isAI ? "right" : "left",
                      }}
                    />
                  </div>
                </div>

                {/* Reasons */}
                <div className="mb-4">
                  <h3 className="mb-3 font-display text-sm font-semibold text-foreground">Analysis Details</h3>
                  <ul className="space-y-2">
                    {result.reasons.map((reason, i) => (
                      <motion.li
                        key={i}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + i * 0.1 }}
                      >
                        <div className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${isAI ? "bg-destructive" : "bg-success"}`} />
                        {reason}
                      </motion.li>
                    ))}
                  </ul>
                </div>

                {/* Model Breakdown */}
                {result.modelBreakdown && result.modelBreakdown.length > 0 && (
                  <div className="mb-4">
                    <button
                      onClick={() => setShowBreakdown(!showBreakdown)}
                      className="flex w-full items-center gap-2 rounded-lg bg-muted/50 px-4 py-3 text-left transition-colors hover:bg-muted/80"
                    >
                      <Brain className="h-4 w-4 text-primary" />
                      <span className="flex-1 text-xs font-semibold text-foreground">Per-Model Breakdown</span>
                      {showBreakdown ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                    {showBreakdown && (
                      <motion.div
                        className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                      >
                        {result.modelBreakdown.filter(m => m.confidence > 0 || m.reasons.length > 0).map((m, i) => (
                          <ModelCard key={i} m={m} />
                        ))}
                      </motion.div>
                    )}
                  </div>
                )}

                {/* Tips */}
                <div className="rounded-lg bg-muted/50 p-4">
                  <div className="mb-2 flex items-center gap-2 text-xs font-medium text-foreground">
                    <Info className="h-3.5 w-3.5 text-primary" />
                    Additional Tips
                  </div>
                  <ul className="space-y-1">
                    {result.tips.map((tip, i) => (
                      <li key={i} className="text-xs text-muted-foreground">• {tip}</li>
                    ))}
                  </ul>
                </div>
              </TabsContent>

              {/* Edit Detection Tab */}
              <TabsContent value="edit-detection">
                <div className="flex items-start gap-1.5 mb-4">
                  <Info className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Edit detection models analyze this image for specific manipulation indicators such as compositing, cloning, splicing, and object insertion. They report what they find — not what type of image this is. Absence of findings does not guarantee the image is unmodified.
                  </p>
                </div>
                {manipulation ? (
                  <>
                    <motion.div
                      className={`flex items-center gap-3 rounded-lg px-4 py-3 mb-4 ${
                        isEdited
                          ? "bg-warning/10 border border-warning/20"
                          : "bg-success/10 border border-success/20"
                      }`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3, duration: 0.4 }}
                    >
                      {isEdited ? (
                        <Pencil className="h-5 w-5 text-warning shrink-0" />
                      ) : (
                        <ShieldCheck className="h-5 w-5 text-success shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="font-display text-lg font-bold text-foreground">
                          {isEdited
                            ? `${manipulation.confidence}% Likely Edited`
                            : `${manipulation.confidence}% Likely Unmodified`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {isEdited
                            ? "Signs of image editing or manipulation detected."
                            : "No significant signs of editing or manipulation found."}
                        </p>
                      </div>
                    </motion.div>

                    {/* Manipulation confidence bar */}
                    <div className="mb-4">
                      <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                        <span>Original</span>
                        <span>Edited</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <motion.div
                          className={`h-full rounded-full ${isEdited ? "bg-warning" : "bg-success"}`}
                          initial={{ width: 0 }}
                          animate={{
                            width: `${isEdited ? manipulation.confidence : 100 - manipulation.confidence}%`,
                          }}
                          transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                          style={{
                            marginLeft: isEdited ? "auto" : "0",
                            float: isEdited ? "right" : "left",
                          }}
                        />
                      </div>
                    </div>

                    {/* Manipulation reasons */}
                    <div className="mb-4">
                      <h3 className="mb-3 font-display text-sm font-semibold text-foreground">Edit Analysis Details</h3>
                      <ul className="space-y-2">
                        {manipulation.reasons.map((reason, i) => (
                          <motion.li
                            key={i}
                            className="flex items-start gap-2 text-sm text-muted-foreground"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 + i * 0.1 }}
                          >
                            <div className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${isEdited ? "bg-warning" : "bg-success"}`} />
                            {reason}
                          </motion.li>
                        ))}
                      </ul>
                    </div>

                    {/* Per-Model Edit Breakdown */}
                    {result.modelBreakdown && result.modelBreakdown.some(m => m.manipulation) && (
                      <div className="mb-4">
                        <button
                          onClick={() => setShowEditBreakdown(!showEditBreakdown)}
                          className="flex w-full items-center gap-2 rounded-lg bg-muted/50 px-4 py-3 text-left transition-colors hover:bg-muted/80"
                        >
                          <Pencil className="h-4 w-4 text-primary" />
                          <span className="flex-1 text-xs font-semibold text-foreground">Per-Model Edit Breakdown</span>
                          {showEditBreakdown ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                        {showEditBreakdown && (
                          <motion.div
                            className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                          >
                            {result.modelBreakdown.filter(m => m.manipulation).map((m, i) => {
                              const manip = m.manipulation!;
                              return (
                                <div key={i} className="rounded-lg border border-border bg-muted/30 p-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-semibold text-foreground">{m.model}</span>
                                    <span className={`text-xs font-bold ${manip.edited ? "text-warning" : "text-success"}`}>
                                      {manip.confidence}% {manip.edited ? "Edited" : "Original"}
                                    </span>
                                  </div>
                                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted mb-2">
                                    <div
                                      className={`h-full rounded-full ${manip.edited ? "bg-warning" : "bg-success"}`}
                                      style={{ width: `${manip.confidence}%`, float: manip.edited ? "right" : "left" }}
                                    />
                                  </div>
                                  <ul className="space-y-1">
                                    {manip.reasons.slice(0, 3).map((r, j) => (
                                      <li key={j} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                                        <div className={`mt-1 h-1 w-1 shrink-0 rounded-full ${manip.edited ? "bg-warning" : "bg-success"}`} />
                                        {r}
                                      </li>
                                    ))}
                                   </ul>
                                  {m.model === "SightEngine" && (
                                    <p className="text-[10px] text-muted-foreground/60 italic mt-1.5">
                                      SightEngine checks metadata and image quality signals only — not visual manipulation.
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </motion.div>
                        )}
                      </div>
                    )}

                    {/* Manipulation tips */}
                    <div className="rounded-lg bg-muted/50 p-4">
                      <div className="mb-2 flex items-center gap-2 text-xs font-medium text-foreground">
                        <Info className="h-3.5 w-3.5 text-primary" />
                        Editing Detection Tips
                      </div>
                      <ul className="space-y-1">
                        {manipulation.tips.map((tip, i) => (
                          <li key={i} className="text-xs text-muted-foreground">• {tip}</li>
                        ))}
                      </ul>
                    </div>
                  </>
                ) : (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    Manipulation analysis not available for this scan.
                  </div>
                )}
              </TabsContent>

              {/* Details Tab */}
              <TabsContent value="details">
                {/* Detected Signals Table */}
                <div className="mb-4">
                  <h3 className="mb-3 font-display text-sm font-semibold text-foreground flex items-center gap-2">
                    <Eye className="h-4 w-4 text-primary" />
                    Detected Signals
                  </h3>
                  <div className="rounded-lg border border-border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50 border-b border-border">
                          <th className="px-3 py-2 text-left text-xs font-semibold text-foreground">Signal</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-foreground">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detectedSignals.map((signal, i) => (
                          <tr key={i} className="border-b border-border last:border-0">
                            <td className="px-3 py-2 text-xs text-muted-foreground">{signal.label}</td>
                            <td className="px-3 py-2">
                              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                signal.detected
                                  ? "bg-destructive/10 text-destructive"
                                  : "bg-success/10 text-success"
                              }`}>
                                {signal.detected ? "Detected" : "Not detected"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Metadata Information */}
                <div className="mb-4">
                  <h3 className="mb-3 font-display text-sm font-semibold text-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Image Metadata
                  </h3>
                  <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Confidence Level</span>
                      <span className="font-medium text-foreground">{confidenceLabel}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground/70 italic -mt-1">{confidenceLabelDescription}</p>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">AI Detection Models</span>
                      <span className="font-medium text-foreground">{totalModels > 0 ? `${totalModels} models analyzed` : "N/A"}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Model Agreement</span>
                      <span className="font-medium text-foreground">{totalModels > 0 ? `${modelsAgreed}/${totalModels} agree` : "N/A"}</span>
                    </div>
                    {manipulation && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Edit Detection</span>
                        <span className="font-medium text-foreground">{manipulation.confidence}% {isEdited ? "likely edited" : "likely original"}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* AI Observational Notes */}
                <div className="rounded-lg bg-muted/50 p-4">
                  <div className="mb-2 flex items-center gap-2 text-xs font-medium text-foreground">
                    <Info className="h-3.5 w-3.5 text-primary" />
                    AI Observational Notes
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                    The 5 AI models in this analysis each look for specific indicators based on their training:
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                    <span className="font-medium text-foreground">AI Detection (Winston AI, SightEngine, AI or Not):</span>{" "}
                    These models look for statistical patterns associated with AI generation tools. They report the probability that this image was created by an AI generator.
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                    <span className="font-medium text-foreground">Edit Detection (Gemini, Hive):</span>{" "}
                    These models look for visual signs of post-processing manipulation. They report whether they found indicators of editing — not what type of image this is.
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                    All results are probabilistic. Models report what they find based on their training data and may interpret the same image differently.
                  </p>
                  <p className="text-[10px] text-muted-foreground/70 italic">
                    AI-generated analysis may be inaccurate. Results are informational only and should be independently verified.
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            {/* Footer */}
            <div className="px-6 pb-6">
              <p className="mb-4 text-center text-[11px] text-muted-foreground/70">
                AI-generated analysis may be inaccurate. Results are informational only and should be independently verified.
              </p>

              {/* Share link section */}
              {shareLink && (
                <div className="mb-4 rounded-lg border border-border bg-muted/30 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <LinkIcon className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-semibold text-foreground">Share Link</span>
                    <button
                      onClick={handleTogglePrivacy}
                      className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {isPublic ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                      {isPublic ? "Public" : "Private"}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                       readOnly
                       value={shareLink}
                       className="flex-1 bg-muted rounded px-2 py-1 text-xs text-foreground border border-border"
                       onClick={(e) => (e.target as HTMLInputElement).select()}
                       onFocus={(e) => (e.target as HTMLInputElement).select()}
                     />
                     <Button
                       size="sm"
                       variant="outline"
                       className="text-xs h-7"
                       onClick={async () => {
                         if (!shareLink) return;
                         try {
                           await navigator.clipboard.writeText(shareLink);
                           toast({ title: "Link copied!", description: "Paste it anywhere to share your report." });
                         } catch (err) {
                           try {
                             const textArea = document.createElement("textarea");
                             textArea.value = shareLink;
                             textArea.style.position = "fixed";
                             textArea.style.left = "-9999px";
                             textArea.style.top = "-9999px";
                             document.body.appendChild(textArea);
                             textArea.focus();
                             textArea.select();
                             const success = document.execCommand("copy");
                             document.body.removeChild(textArea);
                             if (success) {
                               toast({ title: "Link copied!", description: "Paste it anywhere to share your report." });
                             } else {
                               throw new Error("execCommand failed");
                             }
                           } catch (fallbackErr) {
                             const input = document.querySelector('input[value="' + shareLink + '"]') as HTMLInputElement;
                             if (input) { input.focus(); input.select(); }
                             toast({ title: "Please copy manually", description: "Press Ctrl+C to copy the selected link.", variant: "destructive" });
                           }
                         }
                       }}
                     >
                       Copy
                     </Button>
                  </div>
                  <div className="mt-2 rounded-lg bg-muted/30 border border-border p-3">
                    <p className="text-[10px] font-medium text-foreground mb-1">
                      Share preview:
                    </p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed whitespace-pre-line">
                      {`🔍 ${result.confidence}% likely ${isAI ? "AI-Generated 🤖" : "Human-Created ✅"}\n${result.reasons[0]}\n\nView: ${shareLink}`}
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {/* Primary actions */}
                <div className="flex flex-wrap justify-center gap-3">
                  <Button variant="outline" onClick={onReset} className="gap-2">
                    <RotateCcw className="h-4 w-4" />
                    Analyze Another
                  </Button>
                  {plan === "pro" ? (
                    <Button variant="secondary" onClick={handleDownloadPdf} disabled={isExportingPdf} className="gap-2">
                      {isExportingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                      Download PDF
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      onClick={() => {
                        document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="gap-2 opacity-80"
                    >
                      <Lock className="h-4 w-4" />
                      Unlock PDF Reports
                    </Button>
                  )}
                </div>
                {/* Secondary actions */}
                <div className="flex flex-wrap justify-center gap-3">
                  {!shareLink && (
                    <Button variant="ghost" size="sm" onClick={handleGenerateShareLink} disabled={isSharing} className="gap-2 text-xs">
                      {isSharing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LinkIcon className="h-3.5 w-3.5" />}
                      Generate Share Link
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={handleShare} className="gap-2 text-xs">
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
                    Share
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ResultsDisplay;
