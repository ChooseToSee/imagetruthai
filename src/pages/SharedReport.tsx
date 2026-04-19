import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertTriangle, CheckCircle, Pencil, ShieldCheck, Info, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import ImageHeatmap from "@/components/ImageHeatmap";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import type { AnalysisResult, ModelBreakdown, ManipulationResult } from "@/components/ResultsDisplay";

interface SharedReportData {
  id: string;
  verdict: string;
  confidence: number;
  reasons: string[];
  tips: string[];
  model_breakdown: any;
  manipulation: any;
  image_url: string | null;
  file_name: string;
  created_at: string;
}

const SIGNAL_KEYWORDS = [
  { label: "Lighting Inconsistencies", keywords: ["lighting", "shadow", "illumination"] },
  { label: "Compression Artifacts", keywords: ["compression", "jpeg", "artifact", "quality"] },
  { label: "Edge Irregularities", keywords: ["edge", "boundary", "outline", "halo"] },
  { label: "Metadata Anomalies", keywords: ["metadata", "exif", "camera", "gps"] },
  { label: "Texture Inconsistencies", keywords: ["texture", "noise", "grain", "smoothing", "skin"] },
  { label: "Pattern Anomalies", keywords: ["pattern", "repeating", "clone", "uniform"] },
];

const SharedReport = () => {
  const { token } = useParams<{ token: string }>();
  const [report, setReport] = useState<SharedReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    (async () => {
      const { data, error: err } = await supabase
        .from("shared_reports")
        .select("*")
        .eq("share_token", token)
        .eq("is_public", true)
        .single();
      if (err || !data) {
        setError("Report not found or is private.");
      } else {
        setReport(data as unknown as SharedReportData);
      }
      setLoading(false);
    })();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-24 text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Report Not Found</h1>
          <p className="text-muted-foreground mb-6">{error || "This report doesn't exist or is private."}</p>
          <Link to="/">
            <Button>Go to Homepage</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const isAI = report.verdict === "ai";
  const confidence = Number(report.confidence);
  const confidenceLabel = confidence >= 85 ? "High" : confidence >= 60 ? "Moderate" : "Low";
  const manipulation = report.manipulation as ManipulationResult | null;
  const isEdited = manipulation?.edited ?? false;
  const modelBreakdown = (report.model_breakdown as ModelBreakdown[]) ?? [];

  const allReasons = [
    ...report.reasons,
    ...(manipulation?.reasons ?? []),
  ].map((r) => r.toLowerCase());

  const detectedSignals = SIGNAL_KEYWORDS.map((s) => ({
    label: s.label,
    detected: s.keywords.some((kw) => allReasons.some((r) => r.includes(kw))),
  }));

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Analysis Report — ImageTruth AI</title>
        <meta name="description" content="View the AI image analysis report from ImageTruth AI." />
        <meta property="og:title" content={`ImageTruth AI — ${confidence}% ${isAI ? "AI Generation Indicators Detected" : "No AI Generation Indicators Detected"}`} />
        <meta property="og:description" content={report.reasons[0] || "View the full AI image analysis report."} />
        <meta property="og:image" content={report.image_url || "https://imagetruthai.com/share-image.png"} />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={report.image_url || "https://imagetruthai.com/share-image.png"} />
      </Helmet>
      <Navbar />

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl">
            {/* About these results disclaimer */}
            <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 mb-4 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">About these results:</span>{" "}
              These results show what 5 AI models found when analyzing this image. AI Detection models look for patterns associated with AI generation tools. Edit Detection models look for post-processing manipulation indicators. Results are probabilistic — not definitive.
            </div>

            {/* Share on X */}
            <div className="flex justify-end mb-6">
              <button
                onClick={() => {
                  const xText = encodeURIComponent(
                    `🔍 Check out this image analysis from @ImageTruthAI\n\n${window.location.href}`
                  );
                  window.open(`https://twitter.com/intent/tweet?text=${xText}`, "_blank");
                }}
                className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                Share on X
              </button>
            </div>

            <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
              {/* Header */}
              <div className="px-6 pt-6 pb-2">
                <p className="text-xs text-muted-foreground mb-1">
                  Analyzed on {new Date(report.created_at).toLocaleDateString()} · {report.file_name}
                </p>
                <h1 className="font-display text-xl font-bold text-foreground mb-4">
                  ImageTruth AI Analysis Report
                </h1>
              </div>

              {/* Image with heatmap */}
              <div className="px-6">
                {report.image_url ? (
                  <ImageHeatmap
                    imageUrl={report.image_url}
                    reasons={report.reasons}
                    manipulationReasons={manipulation?.reasons}
                  />
                ) : (
                  <div className="mb-4 rounded-lg bg-muted h-48 flex items-center justify-center text-muted-foreground text-sm">
                    Image not available
                  </div>
                )}
              </div>

              {/* AI Detection result */}
              <div className="px-6 pb-4">
                <div className={`flex items-center gap-3 rounded-lg px-4 py-3 mb-4 ${
                  isAI ? "bg-destructive/10 border border-destructive/20" : "bg-success/10 border border-success/20"
                }`}>
                  {isAI ? (
                    <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-success shrink-0" />
                  )}
                  <div>
                    <p className="font-display text-lg font-bold text-foreground">
                      {confidence}% — {isAI ? "AI Generation Indicators Detected" : "No AI Generation Indicators Detected"}
                    </p>
                    <p className="text-xs text-muted-foreground">Confidence: {confidenceLabel}</p>
                  </div>
                </div>

                {/* Reasons */}
                <ul className="space-y-2 mb-4">
                  {report.reasons.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <div className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${isAI ? "bg-destructive" : "bg-success"}`} />
                      {r}
                    </li>
                  ))}
                </ul>

                {/* Per-model breakdown */}
                {modelBreakdown.length > 0 && (
                  <div className="mb-4">
                    <h3 className="mb-2 text-sm font-semibold text-foreground">Per-Model Breakdown</h3>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {modelBreakdown.filter(m => m.confidence > 0 || m.reasons.length > 0).map((m, i) => {
                        const mIsAI = m.verdict === "ai";
                        return (
                          <div key={i} className="rounded-lg border border-border bg-muted/30 p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-semibold text-foreground">{m.model}</span>
                              <span className={`text-xs font-bold ${mIsAI ? "text-destructive" : "text-success"}`}>
                                {m.confidence}% — {mIsAI ? "indicators found" : "no indicators found"}
                              </span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                              <div
                                className={`h-full rounded-full ${mIsAI ? "bg-destructive" : "bg-success"}`}
                                style={{ width: `${m.confidence}%`, float: mIsAI ? "right" : "left" }}
                              />
                            </div>
                            <div className="flex justify-between mt-0.5 mb-2">
                              <span className="text-[10px] text-muted-foreground">{mIsAI ? "100%" : "1%"}</span>
                              <span className="text-[10px] text-muted-foreground">{mIsAI ? "1%" : "100%"}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Edit detection */}
                {manipulation && (
                  <div className={`flex items-center gap-3 rounded-lg px-4 py-3 mb-4 ${
                    isEdited ? "bg-warning/10 border border-warning/20" : "bg-success/10 border border-success/20"
                  }`}>
                    {isEdited ? (
                      <Pencil className="h-5 w-5 text-warning shrink-0" />
                    ) : (
                      <ShieldCheck className="h-5 w-5 text-success shrink-0" />
                    )}
                    <div>
                      <p className="font-display text-base font-bold text-foreground">
                        {manipulation.confidence}% — Manipulation Indicators {isEdited ? "Detected" : "Not Detected"}
                      </p>
                    </div>
                  </div>
                )}

                {/* Detected signals table */}
                <div className="mb-4">
                  <h3 className="mb-2 text-sm font-semibold text-foreground">Detected Signals</h3>
                  <div className="rounded-lg border border-border overflow-hidden">
                    <table className="w-full text-sm">
                      <tbody>
                        {detectedSignals.map((s, i) => (
                          <tr key={i} className="border-b border-border last:border-0">
                            <td className="px-3 py-2 text-xs text-muted-foreground">{s.label}</td>
                            <td className="px-3 py-2">
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                s.detected ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"
                              }`}>
                                {s.detected ? "Detected" : "Not detected"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* AI explanation */}
                <div className="rounded-lg bg-muted/50 p-4 mb-4">
                  <div className="mb-2 flex items-center gap-2 text-xs font-medium text-foreground">
                    <Info className="h-3.5 w-3.5 text-primary" />
                    About This Analysis
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    This analysis was performed by multiple AI models. The signals identified are based on
                    pattern analysis and do not guarantee that manipulation has occurred. Results should be
                    interpreted cautiously and independently verified.
                  </p>
                </div>

                {/* Disclaimer */}
                <p className="text-center text-[11px] text-muted-foreground/70 mb-4">
                  AI-generated analysis may be inaccurate. Results are informational only and should be independently verified.
                </p>

                {/* CTA */}
                <div className="text-center">
                  <Link to="/">
                    <Button className="gap-2">
                      Analyze Your Own Image
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default SharedReport;
