import { useState } from "react";
import { AlertTriangle, CheckCircle, Info, RotateCcw, ChevronDown, ChevronUp, Brain, Share2, Check, Pencil, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { shareContent } from "@/lib/share";

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

const ResultsDisplay = ({ result, imagePreview, onReset, streamProgress }: ResultsDisplayProps) => {
  const isAI = result.verdict === "ai";
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showEditBreakdown, setShowEditBreakdown] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const isStreaming = !!streamProgress;

  const manipulation = result.manipulation;
  const isEdited = manipulation?.edited ?? false;

  const modelsAgreed = result.modelBreakdown
    ? result.modelBreakdown.filter((m) => m.verdict === result.verdict).length
    : 0;
  const totalModels = result.modelBreakdown?.length ?? 0;

  const handleShare = async () => {
    const editInfo = manipulation
      ? ` | Edit detection: ${manipulation.confidence}% likely ${isEdited ? "edited" : "unmodified"}.`
      : "";
    const text = `ImageTruth AI verdict: ${result.confidence}% likely ${isAI ? "AI-generated" : "human-created"}. ${result.reasons[0]}${editInfo}`;
    const res = await shareContent(text, "ImageTruth AI Result", "", imagePreview);
    if (res === "copied") {
      setCopied(true);
      toast({ title: "Copied to clipboard!", description: "Share the result with anyone." });
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
            {/* Image preview */}
            <div className="p-6 pb-0">
              <motion.div
                className="relative mb-4 overflow-hidden rounded-lg bg-muted"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <img
                  src={imagePreview}
                  alt="Analyzed"
                  className="mx-auto max-h-64 rounded-lg object-contain"
                />
                <motion.div
                  className="absolute inset-x-0 h-0.5 bg-primary/40"
                  initial={{ top: 0 }}
                  animate={{ top: ["0%", "100%", "0%"] }}
                  transition={{ duration: 2, repeat: 1, ease: "easeInOut" }}
                />
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
            </div>
            {/* Tabbed results */}
            <Tabs defaultValue="ai-detection" className="px-6 pb-6">
              <TabsList className="grid w-full grid-cols-2 mb-4 h-11 bg-muted/80 border border-border">
                <TabsTrigger value="ai-detection" className="gap-2 text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">
                  <Brain className="h-4 w-4" />
                  AI Detection
                </TabsTrigger>
                <TabsTrigger value="edit-detection" className="gap-2 text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">
                  <Pencil className="h-4 w-4" />
                  Edit Detection
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
                        ? `Consensus from ${totalModels} AI models — ${modelsAgreed}/${totalModels} agree`
                        : isAI
                        ? "This image shows strong indicators of AI generation."
                        : "This image appears to be authentically captured."}
                    </p>
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
                        {result.modelBreakdown.map((m, i) => (
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
            </Tabs>

            {/* Footer */}
            <div className="px-6 pb-6">
              <p className="mb-4 text-center text-[11px] text-muted-foreground/70">
                No detector is 100% accurate — use as a helper tool alongside your judgment.
              </p>
              <div className="flex justify-center gap-3">
                <Button variant="outline" onClick={onReset} className="gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Analyze Another Image
                </Button>
                <Button variant="secondary" onClick={handleShare} className="gap-2">
                  {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                  Share Result
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ResultsDisplay;
