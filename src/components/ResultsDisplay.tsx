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
import { decideXShareNavigation } from "@/lib/x-share";


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
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${isAI ? "bg-destructive" : "bg-success"}`}
          style={{ width: `${m.confidence}%`, float: isAI ? "right" : "left" }}
        />
      </div>
      <div className="flex justify-between mt-0.5 mb-2">
        <span className="text-[10px] text-muted-foreground">{isAI ? "100%" : "1%"}</span>
        <span className="text-[10px] text-muted-foreground">{isAI ? "1%" : "100%"}</span>
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
      // Auto-generate a share link for the PDF if one doesn't exist yet,
      // so the report always includes shareable URLs.
      let pdfShareLink = shareLink;
      if (!pdfShareLink && user) {
        try {
          pdfShareLink = await handleGenerateShareLink();
        } catch {
          pdfShareLink = null;
        }
      }
      await exportReportPdf(result, imagePreview, pdfShareLink || undefined);
      toast({
        title: "PDF downloaded",
        description: pdfShareLink
          ? "Share link included in report."
          : "Your analysis report has been saved as PDF.",
      });
    } catch (err) {
      console.error("PDF export error:", err);
      toast({ title: "Export failed", description: "Could not generate PDF.", variant: "destructive" });
    } finally {
      setIsExportingPdf(false);
    }
  }, [result, imagePreview, shareLink, user, handleGenerateShareLink, toast]);

  const handleGenerateShareLink = useCallback(async (): Promise<string | null> => {
    if (!user) {
      toast({ title: "Sign in required", description: "You need to be signed in to share reports.", variant: "destructive" });
      return null;
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
      return link;
    } catch (err: any) {
      console.error("Full share error:", err);
      toast({ title: "Failed to generate link", description: err?.message || JSON.stringify(err) || "Unknown error", variant: "destructive" });
      return null;
    } finally {
      setIsSharing(false);
    }
  }, [user, result, imagePreview, toast]);

  const handleXShare = useCallback(async () => {
    let linkToShare = shareLink;
    if (!linkToShare) {
      try {
        linkToShare = await handleGenerateShareLink();
      } catch {
        linkToShare = null;
      }
    }
    const displayUrl =
      linkToShare && linkToShare.length < 100 ? linkToShare : "https://imagetruthai.com";
    const tweetText = `🔍 ${result.confidence}% — ${
      isAI ? "AI indicators detected 🤖" : "No AI indicators detected ✅"
    }\n\nSee what 5 AI models found:\n${displayUrl}\n\nvia @ImageTruthAI`;
    const decision = decideXShareNavigation(tweetText, navigator.userAgent);
    console.log("[XShare] Tweet URL:", decision.url.slice(0, 300));
    console.log("[XShare] URL length:", decision.url.length, "mode:", decision.mode);
    setTimeout(() => {
      if (decision.mode === "same-tab") {
        window.location.href = decision.url;
        return;
      }
      window.open(decision.url, "_blank", "noopener,noreferrer");
    }, 100);
  }, [shareLink, handleGenerateShareLink, result.confidence, isAI]);

  const handleFacebookShare = useCallback(async () => {
    let linkToShare = shareLink;
    if (!linkToShare) {
      try {
        linkToShare = await handleGenerateShareLink();
      } catch {
        linkToShare = null;
      }
    }
    const urlToShare = linkToShare || "https://imagetruthai.com";

    // On mobile, prefer the native share sheet (Facebook app integration is unreliable via web sharer)
    const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
    if (isMobile && navigator.share) {
      try {
        await navigator.share({
          title: "ImageTruth AI Analysis",
          text: `${result.confidence}% — ${
            isAI ? "AI generation indicators detected" : "No AI generation indicators detected"
          }`,
          url: urlToShare,
        });
        return;
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        // fall through to web sharer
      }
    }

    // Desktop / fallback: open Facebook web sharer with the clean report URL
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(urlToShare)}`,
      "_blank",
      "width=600,height=400,noopener,noreferrer"
    );
  }, [shareLink, handleGenerateShareLink, result.confidence, isAI]);

  const handleLinkedInShare = useCallback(async () => {
    let linkToShare = shareLink;
    if (!linkToShare) {
      try {
        linkToShare = await handleGenerateShareLink();
      } catch {
        linkToShare = null;
      }
    }
    const urlToShare = linkToShare || "https://imagetruthai.com";
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(urlToShare)}`,
      "_blank",
      "width=600,height=400,noopener,noreferrer"
    );
  }, [shareLink, handleGenerateShareLink]);

  const copyLinkAndToast = useCallback(async (platformName: string) => {
    const link = shareLink ?? (await handleGenerateShareLink()) ?? "https://imagetruthai.com";
    try {
      await navigator.clipboard.writeText(link);
      toast({ title: "Link copied!", description: `Paste it into ${platformName}` });
    } catch {
      toast({ title: "Couldn't copy link", variant: "destructive" });
    }
  }, [shareLink, handleGenerateShareLink, toast]);

  const handleSnapchatShare = useCallback(async () => {
    const link = shareLink ?? (await handleGenerateShareLink()) ?? "https://imagetruthai.com";
    window.open(
      `https://www.snapchat.com/scan?attachmentUrl=${encodeURIComponent(link)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }, [shareLink, handleGenerateShareLink]);

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
                  <div className="flex justify-between mt-0.5">
                    <span className="text-[10px] text-muted-foreground">{isAI ? "100%" : "1%"}</span>
                    <span className="text-[10px] text-muted-foreground">{isAI ? "1%" : "100%"}</span>
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
                      <div className="flex justify-between mt-0.5">
                        <span className="text-[10px] text-muted-foreground">{isEdited ? "100%" : "1%"}</span>
                        <span className="text-[10px] text-muted-foreground">{isEdited ? "1%" : "100%"}</span>
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
                                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                    <div
                                      className={`h-full rounded-full ${manip.edited ? "bg-warning" : "bg-success"}`}
                                      style={{ width: `${manip.confidence}%`, float: manip.edited ? "right" : "left" }}
                                    />
                                  </div>
                                  <div className="flex justify-between mt-0.5 mb-2">
                                    <span className="text-[10px] text-muted-foreground">{manip.edited ? "100%" : "1%"}</span>
                                    <span className="text-[10px] text-muted-foreground">{manip.edited ? "1%" : "100%"}</span>
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
                  <Button variant="ghost" size="sm" onClick={handleXShare} className="gap-2 text-xs">
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    Share on X
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleFacebookShare} className="gap-2 text-xs">
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    Share on Facebook
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleLinkedInShare} className="gap-2 text-xs">
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.063 2.063 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                    Share on LinkedIn
                  </Button>
                  {/* Instagram - copy link (no web share API) */}
                  <Button variant="ghost" size="sm" onClick={() => copyLinkAndToast("Instagram")} className="gap-2 text-xs">
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                    </svg>
                    Instagram
                  </Button>
                  {/* Snapchat */}
                  <Button variant="ghost" size="sm" onClick={handleSnapchatShare} className="gap-2 text-xs">
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path d="M12.166.007C8.864-.107 5.514 2.165 4.428 5.673c-.395 1.272-.302 3.484-.246 4.997l.012.288c-.066.04-.205.077-.434.077-.32 0-.71-.087-1.16-.258a1.04 1.04 0 00-.379-.072c-.485 0-1.087.32-1.18.929-.066.434.16 1.063 1.546 1.612.13.052.293.103.466.158.625.197 1.57.495 1.825 1.097.13.31.075.713-.166 1.197l-.005.012c-.065.152-1.621 3.726-5.099 4.302-.279.045-.486.296-.474.578a.96.96 0 00.034.226c.234.546 1.213.94 2.99 1.21.06.092.121.401.158.59.038.196.077.395.13.604.057.221.225.484.687.484.176 0 .378-.038.617-.082.339-.064.804-.151 1.387-.151.32 0 .654.026.991.077 1.187.198 1.967 1.183 3.069 1.733.838.42 1.628.665 2.484.665.012 0 .024-.001.036-.002a.95.95 0 00.116.002c.857 0 1.646-.245 2.484-.665 1.102-.55 1.882-1.535 3.069-1.733a6.04 6.04 0 01.991-.077c.583 0 1.048.087 1.387.151.239.044.441.082.617.082.461 0 .63-.263.687-.484.052-.21.092-.408.13-.604.037-.189.099-.498.158-.59 1.776-.27 2.756-.664 2.99-1.21a.96.96 0 00.034-.226c.012-.282-.195-.533-.474-.578-3.478-.576-5.034-4.15-5.099-4.302l-.005-.012c-.241-.484-.296-.887-.166-1.197.255-.602 1.2-.9 1.825-1.097.173-.055.336-.106.466-.158 1.025-.404 1.557-.918 1.578-1.526a1.07 1.07 0 00-.78-1.066 1.32 1.32 0 00-.499-.099c-.143 0-.273.022-.388.07-.4.16-.756.245-1.058.245-.245 0-.4-.058-.481-.107l.011-.241c.057-1.514.149-3.726-.246-4.998C18.4 2.197 15.082-.107 11.834.007z"/>
                    </svg>
                    Snapchat
                  </Button>
                  {/* TikTok - copy link (no web share API) */}
                  <Button variant="ghost" size="sm" onClick={() => copyLinkAndToast("TikTok")} className="gap-2 text-xs">
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005.1 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1.14-.1z"/>
                    </svg>
                    TikTok
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
