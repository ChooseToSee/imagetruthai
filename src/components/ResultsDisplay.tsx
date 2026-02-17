import { useState } from "react";
import { AlertTriangle, CheckCircle, Info, RotateCcw, ChevronDown, ChevronUp, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ModelBreakdown {
  model: string;
  verdict: "ai" | "human";
  confidence: number;
  reasons: string[];
}

export interface AnalysisResult {
  verdict: "ai" | "human";
  confidence: number;
  reasons: string[];
  tips: string[];
  modelBreakdown?: ModelBreakdown[];
}

interface ResultsDisplayProps {
  result: AnalysisResult;
  imagePreview: string;
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

const ResultsDisplay = ({ result, imagePreview, onReset }: ResultsDisplayProps) => {
  const isAI = result.verdict === "ai";
  const [showBreakdown, setShowBreakdown] = useState(false);

  const modelsAgreed = result.modelBreakdown
    ? result.modelBreakdown.filter((m) => m.verdict === result.verdict).length
    : 0;
  const totalModels = result.modelBreakdown?.length ?? 0;

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
            {/* Verdict header */}
            <div
              className={`flex items-center gap-3 px-6 py-4 ${
                isAI
                  ? "bg-destructive/10 border-b border-destructive/20"
                  : "bg-success/10 border-b border-success/20"
              }`}
            >
              {isAI ? (
                <AlertTriangle className="h-5 w-5 text-destructive" />
              ) : (
                <CheckCircle className="h-5 w-5 text-success" />
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
                    : "This image appears to be authentically captured or created by a human."}
                </p>
              </div>
            </div>

            {/* Image preview */}
            <div className="p-6">
              <div className="relative mb-6 overflow-hidden rounded-lg bg-muted">
                <img
                  src={imagePreview}
                  alt="Analyzed"
                  className="mx-auto max-h-64 rounded-lg object-contain"
                />
                {isAI && (
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-destructive/10 via-transparent to-warning/10 pointer-events-none" />
                )}
              </div>

              {/* Confidence bar */}
              <div className="mb-6">
                <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                  <span>Human</span>
                  <span>AI-Generated</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      isAI ? "bg-destructive" : "bg-success"
                    }`}
                    style={{
                      width: `${isAI ? result.confidence : 100 - result.confidence}%`,
                      marginLeft: isAI ? "auto" : "0",
                      float: isAI ? "right" : "left",
                    }}
                  />
                </div>
              </div>

              {/* Reasons */}
              <div className="mb-6">
                <h3 className="mb-3 font-display text-sm font-semibold text-foreground">
                  Analysis Details
                </h3>
                <ul className="space-y-2">
                  {result.reasons.map((reason, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <div
                        className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                          isAI ? "bg-destructive" : "bg-success"
                        }`}
                      />
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Model Breakdown (expandable) */}
              {result.modelBreakdown && result.modelBreakdown.length > 0 && (
                <div className="mb-6">
                  <button
                    onClick={() => setShowBreakdown(!showBreakdown)}
                    className="flex w-full items-center gap-2 rounded-lg bg-muted/50 px-4 py-3 text-left transition-colors hover:bg-muted/80"
                  >
                    <Brain className="h-4 w-4 text-primary" />
                    <span className="flex-1 text-xs font-semibold text-foreground">
                      Per-Model Breakdown
                    </span>
                    {showBreakdown ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                  {showBreakdown && (
                    <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {result.modelBreakdown.map((m, i) => (
                        <ModelCard key={i} m={m} />
                      ))}
                    </div>
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
                    <li key={i} className="text-xs text-muted-foreground">
                      • {tip}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Disclaimer */}
              <p className="mt-4 text-center text-[11px] text-muted-foreground/70">
                No detector is 100% accurate — use as a helper tool alongside your judgment.
              </p>

              <div className="mt-6 text-center">
                <Button variant="outline" onClick={onReset} className="gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Analyze Another Image
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ResultsDisplay;
