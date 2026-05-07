import type { ModelBreakdown } from "@/components/ResultsDisplay";

export type VerdictState = "none" | "mixed" | "all";

export interface VerdictStateInfo {
  state: VerdictState;
  aiModelCount: number;
  totalModelCount: number;
  /** Tailwind text color class for label text */
  textClass: string;
  /** Tailwind background class (translucent) for badge container */
  bgClass: string;
  /** Tailwind border class for badge container */
  borderClass: string;
  /** Tailwind solid background class for confidence bar fill */
  barClass: string;
  /** Short label, e.g. "No AI Indicators Found" / "Mixed: 2 of 5 Models Found AI Indicators" / "AI Indicators Found" */
  label: (confidence?: number) => string;
}

export function computeVerdictState(
  modelBreakdown: ModelBreakdown[] | undefined,
  fallbackVerdict?: "ai" | "human"
): VerdictStateInfo {
  const active = (modelBreakdown ?? []).filter(
    (m) => m.confidence > 0 || (m.reasons && m.reasons.length > 0)
  );
  const aiModelCount = active.filter((m) => m.verdict === "ai").length;
  const totalModelCount = active.length;

  let state: VerdictState;
  if (totalModelCount === 0) {
    // Fall back to top-level verdict when we don't have a breakdown
    state = fallbackVerdict === "ai" ? "all" : "none";
  } else if (aiModelCount === 0) {
    state = "none";
  } else if (aiModelCount === totalModelCount) {
    state = "all";
  } else {
    state = "mixed";
  }

  if (state === "none") {
    return {
      state,
      aiModelCount,
      totalModelCount,
      textClass: "text-success",
      bgClass: "bg-success/10",
      borderClass: "border-success/20",
      barClass: "bg-success",
      label: () => "No AI Indicators Found",
    };
  }
  if (state === "all") {
    return {
      state,
      aiModelCount,
      totalModelCount,
      textClass: "text-destructive",
      bgClass: "bg-destructive/10",
      borderClass: "border-destructive/20",
      barClass: "bg-destructive",
      label: () => "AI Indicators Found",
    };
  }
  return {
    state,
    aiModelCount,
    totalModelCount,
    textClass: "text-amber-500",
    bgClass: "bg-amber-500/10",
    borderClass: "border-amber-500/20",
    barClass: "bg-amber-500",
    label: () =>
      `AI Indicators Found by ${aiModelCount} of ${totalModelCount} Models`,
  };
}

export function consensusText(info: VerdictStateInfo): string {
  const { aiModelCount, totalModelCount, state } = info;
  const total = totalModelCount || 5;
  if (state === "none") {
    return `No AI generation indicators detected by any of the ${total} models.`;
  }
  if (state === "all") {
    return `All ${total} models found AI generation indicators in this image.`;
  }
  if (aiModelCount <= 2) {
    return `${aiModelCount} of ${total} models found AI generation indicators — results are mixed. See individual model findings below.`;
  }
  return `${aiModelCount} of ${total} models found AI generation indicators — see individual model findings below.`;
}
