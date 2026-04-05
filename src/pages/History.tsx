import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePlan } from "@/contexts/PlanContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2, Clock, AlertTriangle, CheckCircle, Lock, FileDown, ChevronDown, ChevronUp, ZoomIn, Home, Upload, History as HistoryIcon, Zap } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ImageLightbox from "@/components/ImageLightbox";
import { useToast } from "@/hooks/use-toast";
import { exportReportPdf } from "@/lib/pdf-export";
import type { AnalysisResult } from "@/components/ResultsDisplay";

interface ScanRecord {
  id: string;
  file_name: string;
  verdict: string;
  confidence: number;
  reasons: string[];
  tips: string[];
  created_at: string;
  image_url: string | null;
  model_breakdown: any | null;
  manipulation: any | null;
}

const History = () => {
  const { user } = useAuth();
  const { plan } = usePlan();
  const navigate = useNavigate();
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { toast } = useToast();

  const showFullResults = plan === "plus" || plan === "pro";
  const canDownloadPdf = plan === "pro";
  const selectionMode = selectedIds.size > 0;

  useEffect(() => {
    if (!user) return;
    const fetchScans = async () => {
      const { data, error } = await supabase
        .from("scan_history")
        .select("id, file_name, verdict, confidence, reasons, tips, created_at, image_url, model_breakdown, manipulation")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) {
        toast({ title: "Error loading history", description: error.message, variant: "destructive" });
      } else {
        setScans(data || []);
      }
      setLoading(false);
    };
    fetchScans();
  }, [user]);

  if (plan === "free") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-32 pb-16 text-center max-w-md">
          <HistoryIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h1 className="text-2xl font-bold text-foreground mb-3">Scan History</h1>
          <p className="text-muted-foreground mb-6">
            Scan history is available on Plus and Pro plans. Upgrade to keep a full record of all your image analyses.
          </p>
          <Button
            onClick={() => {
              navigate("/");
              setTimeout(() => {
                document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
              }, 300);
            }}
            className="gap-2 shadow-glow"
          >
            <Zap className="h-4 w-4" />
            Upgrade to Plus
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === scans.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(scans.map((s) => s.id)));
    }
  };

  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    const ids = Array.from(selectedIds);
    const { error } = await supabase.from("scan_history").delete().in("id", ids);
    if (error) {
      toast({ title: "Failed to delete scans", description: error.message, variant: "destructive" });
    } else {
      setScans((prev) => prev.filter((s) => !selectedIds.has(s.id)));
      toast({ title: `${ids.length} scan${ids.length > 1 ? "s" : ""} deleted` });
      setSelectedIds(new Set());
    }
    setBulkDeleting(false);
    setShowConfirm(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("scan_history").delete().eq("id", id);
    if (!error) {
      setScans((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const handleDownloadPdf = async (scan: ScanRecord) => {
    if (!canDownloadPdf) return;
    setDownloadingId(scan.id);
    try {
      const result: AnalysisResult = {
        verdict: scan.verdict as "ai" | "human",
        confidence: scan.confidence,
        reasons: scan.reasons,
        tips: scan.tips || [],
        modelBreakdown: scan.model_breakdown || undefined,
        manipulation: scan.manipulation || undefined,
      };
      await exportReportPdf(result, scan.image_url || "");
      toast({ title: "PDF exported successfully" });
    } catch {
      toast({ title: "PDF export failed", variant: "destructive" });
    } finally {
      setDownloadingId(null);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center pt-32">
          <p className="text-muted-foreground">Please sign in to view your scan history.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="font-display text-3xl font-bold text-foreground">Scan History</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/")} className="gap-2">
              <Home className="h-4 w-4" />
              Home
            </Button>
            <Button size="sm" onClick={() => { sessionStorage.setItem("scrollToUpload", "true"); navigate("/"); }} className="gap-2 shadow-glow">
              <Upload className="h-4 w-4" />
              Upload Image
            </Button>
          </div>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : scans.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <Clock className="mx-auto mb-4 h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">No scans yet. Upload an image to get started.</p>
            <Button onClick={() => { sessionStorage.setItem("scrollToUpload", "true"); navigate("/"); }} className="gap-2 shadow-glow">
              <Upload className="h-4 w-4" />
              Upload Your First Image
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Bulk actions bar */}
            <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-2">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={selectedIds.size === scans.length && scans.length > 0}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all scans"
                />
                <span className="text-sm text-muted-foreground">
                  {selectionMode
                    ? `${selectedIds.size} of ${scans.length} selected`
                    : "Select all"}
                </span>
              </div>
              {selectionMode && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowConfirm(true)}
                  disabled={bulkDeleting}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete {selectedIds.size}
                </Button>
              )}
            </div>

            {!showFullResults && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
                <Lock className="h-4 w-4 shrink-0" />
                <span>
                  Free plan shows basic verdicts only.{" "}
                  <a href="#pricing" className="font-semibold text-primary hover:underline">Upgrade to Plus</a>{" "}
                  for full analysis results.
                </span>
              </div>
            )}
            {scans.map((scan) => {
              const isExpanded = expandedId === scan.id;
              const isSelected = selectedIds.has(scan.id);
              return (
                <div
                  key={scan.id}
                  className={`rounded-lg border overflow-hidden transition-colors ${
                    isSelected ? "border-primary bg-primary/5" : "border-border bg-card"
                  }`}
                >
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelect(scan.id)}
                        aria-label={`Select ${scan.file_name}`}
                        className="shrink-0"
                      />
                      {scan.image_url ? (
                        <div
                          className="relative group cursor-zoom-in shrink-0"
                          onClick={() => setLightboxUrl(scan.image_url)}
                        >
                          <img
                            src={scan.image_url}
                            alt={scan.file_name}
                            className="h-12 w-12 rounded-md object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-background/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                            <ZoomIn className="h-4 w-4 text-foreground" />
                          </div>
                        </div>
                      ) : scan.verdict === "ai" ? (
                        <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                      ) : (
                        <CheckCircle className="h-5 w-5 text-success shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground truncate">{scan.file_name}</p>
                          {scan.verdict === "ai" ? (
                            <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive shrink-0">AI</span>
                          ) : (
                            <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success shrink-0">Human</span>
                          )}
                        </div>
                        {showFullResults ? (
                          <p className="text-xs text-muted-foreground">
                            {scan.confidence}% confidence · {new Date(scan.created_at).toLocaleDateString()}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            {new Date(scan.created_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {canDownloadPdf && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadPdf(scan)}
                          disabled={downloadingId === scan.id}
                          title="Download PDF report"
                        >
                          <FileDown className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      )}
                      {showFullResults && scan.reasons.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedId(isExpanded ? null : scan.id)}
                          title="View details"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(scan.id)}>
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                  {showFullResults && isExpanded && scan.reasons.length > 0 && (
                    <div className="border-t border-border px-4 py-3 bg-muted/30">
                      <p className="text-xs font-medium text-foreground mb-2">Analysis Details</p>
                      <ul className="space-y-1">
                        {scan.reasons.map((reason, i) => (
                          <li key={i} className="text-xs text-muted-foreground">• {reason}</li>
                        ))}
                      </ul>
                      {scan.manipulation && (
                        <div className="mt-3">
                          <p className="text-xs font-medium text-foreground mb-1">Edit Detection</p>
                          <p className="text-xs text-muted-foreground">
                            {scan.manipulation.confidence}% likely{scan.manipulation.edited ? " edited" : " unmodified"}
                          </p>
                          <ul className="space-y-1 mt-1">
                            {(scan.manipulation.reasons || []).slice(0, 3).map((reason: string, i: number) => (
                              <li key={i} className="text-xs text-muted-foreground">• {reason}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bulk delete confirmation dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} scan{selectedIds.size > 1 ? "s" : ""}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The selected scans will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {bulkDeleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ImageLightbox imageUrl={lightboxUrl} onClose={() => setLightboxUrl(null)} />
      <Footer />
    </div>
  );
};

export default History;
