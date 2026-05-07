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
    label: () => `${aiModelCount}/4 found AI indicators`,
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
  return `${aiModelCount}/4 AI detection models found AI generation indicators — results are mixed. See individual model findings below.`;
}

export interface EditVerdictStateInfo {
  state: VerdictState;
  editModelCount: number;
  totalEditModelCount: number;
  textClass: string;
  bgClass: string;
  borderClass: string;
  barClass: string;
  label: (confidence?: number) => string;
}

export function computeEditVerdictState(
  modelBreakdown: ModelBreakdown[] | undefined,
  fallbackEdited?: boolean
): EditVerdictStateInfo {
  const editModels = (modelBreakdown ?? []).filter((m) => m.manipulation !== undefined);
  const editModelCount = editModels.filter((m) => m.manipulation?.edited === true).length;
  const totalEditModelCount = editModels.length;

  let state: VerdictState;
  if (totalEditModelCount === 0) {
    state = fallbackEdited ? "all" : "none";
  } else if (editModelCount === 0) {
    state = "none";
  } else if (editModelCount === totalEditModelCount) {
    state = "all";
  } else {
    state = "mixed";
  }

  if (state === "none") {
    return {
      state,
      editModelCount,
      totalEditModelCount,
      textClass: "text-success",
      bgClass: "bg-success/10",
      borderClass: "border-success/20",
      barClass: "bg-success",
      label: (c) => c != null ? `${c}% — No Manipulation Indicators Found` : "No Manipulation Indicators Found",
    };
  }
  if (state === "all") {
    return {
      state,
      editModelCount,
      totalEditModelCount,
      textClass: "text-warning",
      bgClass: "bg-warning/10",
      borderClass: "border-warning/20",
      barClass: "bg-warning",
      label: (c) => c != null ? `${c}% — Manipulation Indicators Found` : "Manipulation Indicators Found",
    };
  }
  return {
    state,
    editModelCount,
    totalEditModelCount,
    textClass: "text-amber-500",
    bgClass: "bg-amber-500/10",
    borderClass: "border-amber-500/20",
    barClass: "bg-amber-500",
    label: () =>
      `Manipulation Indicators Found by ${editModelCount} of ${totalEditModelCount} Models`,
  };
}

export function editConsensusText(info: EditVerdictStateInfo): string {
  const { editModelCount, totalEditModelCount, state } = info;
  const total = totalEditModelCount || 2;
  if (state === "none") {
    return "No manipulation indicators detected by any model.";
  }
  if (state === "all") {
    return total === 2
      ? "Both visual analysis models found manipulation indicators in this image."
      : `All ${total} visual analysis models found manipulation indicators in this image.`;
  }
  return `${editModelCount} of ${total} visual analysis models found manipulation indicators — results are mixed. Review individual model findings below.`;
}
