import { useState, useCallback } from "react";
import { AlertTriangle, CheckCircle, Info, RotateCcw, ChevronDown, ChevronUp, BarChart3, Share2, Check, Brain, Pencil, ShieldCheck, Download, Link as LinkIcon, Lock, Globe, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AnalysisResult, ModelBreakdown } from "@/components/ResultsDisplay";
import { shareContent } from "@/lib/share";
import { exportReportPdf } from "@/lib/pdf-export";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePlan } from "@/contexts/PlanContext";
import { useToast } from "@/hooks/use-toast";
import ImageHeatmap from "@/components/ImageHeatmap";

export interface BatchItem {
  fileName: string;
  preview: string;
  result: AnalysisResult;
}

interface BatchResultsDisplayProps {
  items: BatchItem[];
  onReset: () => void;
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

const BatchResultsDisplay = ({ items, onReset }: BatchResultsDisplayProps) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showBreakdown, setShowBreakdown] = useState<number | null>(null);
  const [showEditBreakdown, setShowEditBreakdown] = useState<number | null>(null);
  const [exportingPdfIndex, setExportingPdfIndex] = useState<number | null>(null);
  const [sharingIndex, setSharingIndex] = useState<number | null>(null);
  const [shareLinks, setShareLinks] = useState<Record<number, { link: string; id: string; isPublic: boolean }>>({});
  const { toast } = useToast();
  const { user } = useAuth();
  const { plan } = usePlan();

  const handleShareItem = async (item: BatchItem, index: number) => {
    const isAI = item.result.verdict === "ai";
    const editInfo = item.result.manipulation
      ? ` | Edit: ${item.result.manipulation.confidence}% ${item.result.manipulation.edited ? "edited" : "unmodified"}`
      : "";
    const text = `ImageTruth AI: "${item.fileName}" is ${item.result.confidence}% likely ${isAI ? "AI-generated" : "human-created"}. ${item.result.reasons[0]}${editInfo}`;
    const url = shareLinks[index]?.link || "";
    const res = await shareContent(text, "ImageTruth AI Result", url, item.preview);
    if (res === "copied") {
      setCopiedIndex(index);
      toast({ title: "Copied to clipboard!" });
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  };

  const handleDownloadPdf = useCallback(async (item: BatchItem, index: number) => {
    setExportingPdfIndex(index);
    try {
      await exportReportPdf(item.result, item.preview);
      toast({ title: "PDF downloaded", description: `Report for ${item.fileName} saved.` });
    } catch (err) {
      console.error("PDF export error:", err);
      toast({ title: "Export failed", description: "Could not generate PDF.", variant: "destructive" });
    } finally {
      setExportingPdfIndex(null);
    }
  }, [toast]);

  const handleGenerateShareLink = useCallback(async (item: BatchItem, index: number) => {
    if (!user) {
      toast({ title: "Sign in required", description: "You need to be signed in to share reports.", variant: "destructive" });
      return;
    }
    setSharingIndex(index);
    try {
      const { data: { session: freshSession } } = await supabase.auth.getSession();
      if (!freshSession) {
        toast({ title: "Session expired", description: "Please sign in again.", variant: "destructive" });
        setSharingIndex(null);
        return;
      }
      const { data, error } = await supabase.from("shared_reports").insert({
        user_id: user.id,
        is_public: true,
        image_url: item.preview.startsWith("blob:") ? null : item.preview,
        verdict: item.result.verdict,
        confidence: item.result.confidence,
        reasons: item.result.reasons,
        tips: item.result.tips,
        model_breakdown: item.result.modelBreakdown ? JSON.parse(JSON.stringify(item.result.modelBreakdown)) : null,
        manipulation: item.result.manipulation ? JSON.parse(JSON.stringify(item.result.manipulation)) : null,
        file_name: item.fileName,
      }).select("share_token, id").single();
      if (error) throw error;
      const link = `${window.location.origin}/report/${data.share_token}`;
      setShareLinks(prev => ({ ...prev, [index]: { link, id: data.id, isPublic: true } }));
      await navigator.clipboard.writeText(link);
      toast({ title: "Share link copied!", description: "Anyone with the link can view this report." });
    } catch (err: any) {
      console.error("Share error:", err);
      toast({ title: "Failed to generate link", description: err.message, variant: "destructive" });
    } finally {
      setSharingIndex(null);
    }
  }, [user, toast]);

  const handleTogglePrivacy = useCallback(async (index: number) => {
    const share = shareLinks[index];
    if (!share) return;
    const newPublic = !share.isPublic;
    const { error } = await supabase.from("shared_reports").update({ is_public: newPublic }).eq("id", share.id);
    if (error) {
      toast({ title: "Update failed", variant: "destructive" });
      return;
    }
    setShareLinks(prev => ({ ...prev, [index]: { ...prev[index], isPublic: newPublic } }));
    toast({ title: newPublic ? "Report is now public" : "Report is now private" });
  }, [shareLinks, toast]);

  const aiCount = items.filter((i) => i.result.verdict === "ai").length;
  const humanCount = items.length - aiCount;
  const avgConfidence = Math.round(
    items.reduce((sum, i) => sum + i.result.confidence, 0) / items.length
  );

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl">
          {/* Summary header */}
          <div className="mb-8 rounded-xl border border-border bg-card p-6 shadow-card">
            <div className="mb-4 flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <BarChart3 className="h-4 w-4 text-primary" />
              Batch Summary — {items.length} image{items.length !== 1 ? "s" : ""} analyzed
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg bg-muted/50 p-4 text-center">
                <p className="text-2xl font-bold text-destructive">{aiCount}</p>
                <p className="text-xs text-muted-foreground">AI-Generated</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-4 text-center">
                <p className="text-2xl font-bold text-success">{humanCount}</p>
                <p className="text-xs text-muted-foreground">Human-Created</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-4 text-center">
                <p className="text-2xl font-bold text-primary">{avgConfidence}%</p>
                <p className="text-xs text-muted-foreground">Avg Confidence</p>
              </div>
            </div>

            {/* Stacked bar */}
            <div className="mt-4">
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="flex h-full">
                  <div
                    className="bg-success transition-all"
                    style={{ width: `${(humanCount / items.length) * 100}%` }}
                  />
                  <div
                    className="bg-destructive transition-all"
                    style={{ width: `${(aiCount / items.length) * 100}%` }}
                  />
                </div>
              </div>
              <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                <span>Human</span>
                <span>AI</span>
              </div>
            </div>
          </div>

          {/* Individual results */}
          <div className="space-y-3">
            {items.map((item, i) => {
              const isAI = item.result.verdict === "ai";
              const isExpanded = expandedIndex === i;
              const manipulation = item.result.manipulation;
              const isEdited = manipulation?.edited ?? false;
              const itemShareLink = shareLinks[i];

              return (
                <div
                  key={i}
                  className="overflow-hidden rounded-xl border border-border bg-card shadow-card transition-all"
                >
                  {/* Row header — use div instead of button to avoid nesting */}
                  <div
                    onClick={() => setExpandedIndex(isExpanded ? null : i)}
                    className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-muted/30 cursor-pointer"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpandedIndex(isExpanded ? null : i); } }}
                  >
                    <img
                      src={item.preview}
                      alt={item.fileName}
                      className="h-12 w-12 shrink-0 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {item.fileName}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {isAI ? (
                          <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                        ) : (
                          <CheckCircle className="h-3.5 w-3.5 text-success" />
                        )}
                        <span
                          className={`text-sm font-semibold ${
                            isAI ? "text-destructive" : "text-success"
                          }`}
                        >
                          {item.result.confidence}% {isAI ? "AI" : "Human"}
                        </span>
                        {manipulation && (
                          <>
                            <span className="text-muted-foreground text-xs">·</span>
                            {isEdited ? (
                              <Pencil className="h-3.5 w-3.5 text-warning" />
                            ) : (
                              <ShieldCheck className="h-3.5 w-3.5 text-success" />
                            )}
                            <span className={`text-xs font-medium ${isEdited ? "text-warning" : "text-success"}`}>
                              {isEdited ? "Edited" : "Original"}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Mini confidence bar */}
                    <div className="hidden w-24 sm:block">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full ${isAI ? "bg-destructive" : "bg-success"}`}
                          style={{
                            width: `${item.result.confidence}%`,
                            float: isAI ? "right" : "left",
                          }}
                        />
                      </div>
                    </div>

                    <button
                      onClick={(e) => { e.stopPropagation(); handleShareItem(item, i); }}
                      className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      title="Share result"
                    >
                      {copiedIndex === i ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
                    </button>

                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="border-t border-border px-4 pb-4 pt-3">
                      {/* Heatmap */}
                      <div className="mb-4">
                        <ImageHeatmap
                          imageUrl={item.preview}
                          reasons={item.result.reasons}
                          manipulationReasons={manipulation?.reasons}
                        />
                      </div>

                      <Tabs defaultValue="ai-detection">
                        <TabsList className="grid w-full grid-cols-2 mb-3 h-10 bg-muted/80 border border-border">
                          <TabsTrigger value="ai-detection" className="gap-1.5 text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=inactive]:bg-card data-[state=inactive]:text-foreground data-[state=inactive]:border data-[state=inactive]:border-border data-[state=inactive]:hover:bg-accent">
                            <Brain className="h-3.5 w-3.5" />
                            AI Detection
                          </TabsTrigger>
                          <TabsTrigger value="edit-detection" className="gap-1.5 text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=inactive]:bg-card data-[state=inactive]:text-foreground data-[state=inactive]:border data-[state=inactive]:border-border data-[state=inactive]:hover:bg-accent">
                            <Pencil className="h-3.5 w-3.5" />
                            Edit Detection
                          </TabsTrigger>
                        </TabsList>

                        {/* AI Detection Tab */}
                        <TabsContent value="ai-detection" className="space-y-3">
                          <div>
                            <h4 className="mb-2 text-xs font-semibold text-foreground">
                              Analysis Details
                            </h4>
                            <ul className="space-y-1.5">
                              {item.result.reasons.map((reason, ri) => (
                                <li
                                  key={ri}
                                  className="flex items-start gap-2 text-xs text-muted-foreground"
                                >
                                  <div
                                    className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${
                                      isAI ? "bg-destructive" : "bg-success"
                                    }`}
                                  />
                                  {reason}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Per-model breakdown */}
                          {item.result.modelBreakdown && item.result.modelBreakdown.length > 0 && (
                            <div>
                              <button
                                onClick={() => setShowBreakdown(showBreakdown === i ? null : i)}
                                className="flex w-full items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-left transition-colors hover:bg-muted/80"
                              >
                                <Brain className="h-3.5 w-3.5 text-primary" />
                                <span className="flex-1 text-[11px] font-semibold text-foreground">Per-Model Breakdown</span>
                                {showBreakdown === i ? (
                                  <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                                ) : (
                                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                                )}
                              </button>
                              {showBreakdown === i && (
                                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                   {item.result.modelBreakdown.filter(m => m.confidence > 0 || m.reasons.length > 0).map((m, mi) => (
                                     <ModelCard key={mi} m={m} />
                                   ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Tips */}
                          <div className="rounded-lg bg-muted/50 p-3">
                            <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-foreground">
                              <Info className="h-3 w-3 text-primary" />
                              Tips
                            </div>
                            <ul className="space-y-0.5">
                              {item.result.tips.map((tip, ti) => (
                                <li key={ti} className="text-[11px] text-muted-foreground">
                                  • {tip}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </TabsContent>

                        {/* Edit Detection Tab */}
                        <TabsContent value="edit-detection">
                          {manipulation ? (
                            <div className="space-y-3">
                              <div className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                                isEdited
                                  ? "bg-warning/10 border border-warning/20"
                                  : "bg-success/10 border border-success/20"
                              }`}>
                                {isEdited ? (
                                  <Pencil className="h-4 w-4 text-warning shrink-0" />
                                ) : (
                                  <ShieldCheck className="h-4 w-4 text-success shrink-0" />
                                )}
                                <div>
                                  <p className="text-sm font-bold text-foreground">
                                    {isEdited
                                      ? `${manipulation.confidence}% Likely Edited`
                                      : `${manipulation.confidence}% Likely Unmodified`}
                                  </p>
                                </div>
                              </div>

                              <div>
                                <h4 className="mb-2 text-xs font-semibold text-foreground">Edit Analysis</h4>
                                <ul className="space-y-1.5">
                                  {manipulation.reasons.map((reason, ri) => (
                                    <li key={ri} className="flex items-start gap-2 text-xs text-muted-foreground">
                                      <div className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${isEdited ? "bg-warning" : "bg-success"}`} />
                                      {reason}
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              {/* Per-Model Edit Breakdown */}
                              {item.result.modelBreakdown && item.result.modelBreakdown.some(m => m.manipulation) && (
                                <div>
                                  <button
                                    onClick={() => setShowEditBreakdown(showEditBreakdown === i ? null : i)}
                                    className="flex w-full items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-left transition-colors hover:bg-muted/80"
                                  >
                                    <Pencil className="h-3.5 w-3.5 text-primary" />
                                    <span className="flex-1 text-[11px] font-semibold text-foreground">Per-Model Edit Breakdown</span>
                                    {showEditBreakdown === i ? (
                                      <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                                    ) : (
                                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                                    )}
                                  </button>
                                  {showEditBreakdown === i && (
                                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                      {item.result.modelBreakdown.filter(m => m.manipulation).map((m, mi) => {
                                        const manip = m.manipulation!;
                                        return (
                                          <div key={mi} className="rounded-lg border border-border bg-muted/30 p-3">
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
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              )}

                              {manipulation.tips && manipulation.tips.length > 0 && (
                                <div className="rounded-lg bg-muted/50 p-3">
                                  <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-foreground">
                                    <Info className="h-3 w-3 text-primary" />
                                    Edit Detection Tips
                                  </div>
                                  <ul className="space-y-0.5">
                                    {manipulation.tips.map((tip, ti) => (
                                      <li key={ti} className="text-[11px] text-muted-foreground">• {tip}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="py-6 text-center text-xs text-muted-foreground">
                              Manipulation analysis not available for this scan.
                            </div>
                          )}
                        </TabsContent>
                      </Tabs>

                      {/* Share link section */}
                      {itemShareLink && (
                        <div className="mt-4 rounded-lg border border-border bg-muted/30 p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <LinkIcon className="h-3.5 w-3.5 text-primary" />
                            <span className="text-xs font-semibold text-foreground">Share Link</span>
                            <button
                              onClick={() => handleTogglePrivacy(i)}
                              className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {itemShareLink.isPublic ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                              {itemShareLink.isPublic ? "Public" : "Private"}
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              readOnly
                              value={itemShareLink.link}
                              className="flex-1 bg-muted rounded px-2 py-1 text-xs text-foreground border border-border"
                              onClick={(e) => (e.target as HTMLInputElement).select()}
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-7"
                              onClick={() => {
                                navigator.clipboard.writeText(itemShareLink.link);
                                toast({ title: "Link copied!" });
                              }}
                            >
                              Copy
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="mt-4 flex flex-wrap gap-2">
                        {plan === "pro" ? (
                          <Button size="sm" variant="secondary" onClick={() => handleDownloadPdf(item, i)} disabled={exportingPdfIndex === i} className="gap-1.5 text-xs">
                            {exportingPdfIndex === i ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                            Download PDF
                          </Button>
                        ) : (
                          <Button size="sm" variant="secondary" disabled className="gap-1.5 text-xs opacity-60" title="PDF export is available on the Unlimited plan">
                            <Lock className="h-3.5 w-3.5" />
                            PDF (Unlimited)
                          </Button>
                        )}
                        {!itemShareLink && (
                          <Button size="sm" variant="secondary" onClick={() => handleGenerateShareLink(item, i)} disabled={sharingIndex === i} className="gap-1.5 text-xs">
                            {sharingIndex === i ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LinkIcon className="h-3.5 w-3.5" />}
                            Generate Share Link
                          </Button>
                        )}
                        <Button size="sm" variant="secondary" onClick={() => handleShareItem(item, i)} className="gap-1.5 text-xs">
                          {copiedIndex === i ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
                          Share
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Disclaimer + reset */}
          <div className="mt-8 text-center">
            <p className="mb-4 text-[11px] text-muted-foreground/70">
              No detector is 100% accurate — use as a helper tool alongside your judgment.
            </p>
            <Button variant="outline" onClick={onReset} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Analyze More Images
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BatchResultsDisplay;
