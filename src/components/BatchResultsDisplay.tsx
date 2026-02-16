import { useState } from "react";
import { AlertTriangle, CheckCircle, Info, RotateCcw, ChevronDown, ChevronUp, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AnalysisResult } from "@/components/ResultsDisplay";

export interface BatchItem {
  fileName: string;
  preview: string;
  result: AnalysisResult;
}

interface BatchResultsDisplayProps {
  items: BatchItem[];
  onReset: () => void;
}

const BatchResultsDisplay = ({ items, onReset }: BatchResultsDisplayProps) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

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

              return (
                <div
                  key={i}
                  className="overflow-hidden rounded-xl border border-border bg-card shadow-card transition-all"
                >
                  {/* Row header */}
                  <button
                    onClick={() => setExpandedIndex(isExpanded ? null : i)}
                    className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-muted/30"
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
                          className={`text-xs font-medium ${
                            isAI ? "text-destructive" : "text-success"
                          }`}
                        >
                          {item.result.confidence}% {isAI ? "AI" : "Human"}
                        </span>
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

                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                  </button>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="border-t border-border px-4 pb-4 pt-3">
                      <div className="flex flex-col gap-4 sm:flex-row">
                        <div className="shrink-0 overflow-hidden rounded-lg bg-muted">
                          <img
                            src={item.preview}
                            alt={item.fileName}
                            className="h-48 w-full rounded-lg object-contain sm:w-48"
                          />
                        </div>

                        <div className="flex-1 space-y-4">
                          {/* Reasons */}
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
                        </div>
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
