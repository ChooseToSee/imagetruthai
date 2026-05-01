import React from "react";

// Detailed signals — only meaningful for reasoning models that emit prose.
const REASONING_SIGNALS = [
  // --- AI generation signals ---
  {
    label: "Diffusion Noise Pattern",
    category: "ai",
    keywords: ["diffusion", "noise pattern", "denoising", "latent noise"],
  },
  {
    label: "GAN Fingerprint",
    category: "ai",
    keywords: ["gan", "generator artifact", "checkerboard", "spectral fingerprint"],
  },
  {
    label: "Synthetic Skin / Texture",
    category: "ai",
    keywords: ["skin", "smooth", "plastic", "waxy", "synthetic texture", "micro-detail", "pores"],
  },
  {
    label: "Hair / Fine Detail Errors",
    category: "ai",
    keywords: ["hair", "strand", "fine detail", "fuzzy", "frizz"],
  },
  {
    label: "Anatomy / Hands / Fingers",
    category: "ai",
    keywords: ["hand", "finger", "anatomy", "limb", "extra digit", "missing finger"],
  },
  {
    label: "Eye / Face Asymmetry",
    category: "ai",
    keywords: ["eye", "iris", "pupil", "asymmetr", "face", "facial"],
  },
  {
    label: "Lighting / Shadow Inconsistency",
    category: "ai",
    keywords: ["lighting", "shadow", "highlight", "illumination", "light source"],
  },
  {
    label: "Background Warping",
    category: "ai",
    keywords: ["background", "warp", "distort", "melt", "incoherent background"],
  },
  {
    label: "Text / Symbol Garbling",
    category: "ai",
    keywords: ["text", "letter", "garbled", "nonsense", "symbol", "writing"],
  },
  {
    label: "Reflection / Perspective Errors",
    category: "ai",
    keywords: ["reflection", "perspective", "vanishing point", "geometry"],
  },
  // --- Edit / manipulation signals ---
  {
    label: "Cloning / Splicing",
    category: "edit",
    keywords: ["clon", "splice", "splicing", "duplicate region", "copy-paste"],
  },
  {
    label: "Retouching / Healing",
    category: "edit",
    keywords: ["retouch", "heal", "smoothed", "blurred patch", "softening"],
  },
  {
    label: "Composite / Layer Mismatch",
    category: "edit",
    keywords: ["composite", "layer", "blend", "edge artifact", "halo", "fringe"],
  },
  {
    label: "Compression Inconsistency",
    category: "edit",
    keywords: ["compression", "jpeg", "block", "quantization", "ela", "ghost"],
  },
  {
    label: "Color / Tone Mismatch",
    category: "edit",
    keywords: ["color cast", "tone mismatch", "hue", "white balance"],
  },
  {
    label: "Metadata Stripped / Altered",
    category: "edit",
    keywords: ["metadata", "exif", "stripped", "missing field", "no camera"],
  },
];

const REASONING_MODELS = ["Gemini", "Hive"];
const SCORE_MODELS = ["Winston", "SightEngine", "AI or Not"];

interface ModelResult {
  model: string;
  verdict: string;
  confidence: number;
  reasons: string[];
}

interface ManipulationModel {
  model: string;
  verdict: string;
  confidence: number;
  reasons: string[];
}

interface SignalMatrixProps {
  modelBreakdown: ModelResult[];
  manipulation?: {
    verdict: string;
    confidence: number;
    modelBreakdown?: ManipulationModel[];
  } | null;
}

const NEGATION_TERMS = [
  "no ", "not ", "non-", "without", "lacks", "lacking", "absence of",
  "doesn't", "does not", "didn't", "did not", "isn't", "is not",
  "aren't", "are not", "wasn't", "was not", "weren't", "were not",
  "unlikely", "no signs", "no evidence", "no indication", "no sign",
  "free of", "free from", "appears authentic", "appears original",
  "appears genuine", "appears real", "looks authentic", "looks real",
  "no obvious", "no apparent",
];

function isPositiveVerdict(verdict: string): boolean {
  const v = (verdict || "").toLowerCase();
  if (!v) return false;
  if (v.includes("original") || v.includes("authentic") ||
      v.includes("real") || v.includes("human") ||
      v.includes("genuine") || v === "no" ||
      v.includes("not ai") || v.includes("not-ai") ||
      v.includes("no manipulation") || v.includes("unedited") ||
      v.includes("clean")) {
    return false;
  }
  return v.includes("ai") || v.includes("generated") || v.includes("synthetic") ||
         v.includes("manipulat") || v.includes("edit") || v.includes("fake") ||
         v.includes("altered") || v.includes("modified") || v.includes("suspicious");
}

function hasSignal(reasons: string[], keywords: string[], verdict: string): boolean {
  if (!isPositiveVerdict(verdict)) return false;
  if (!reasons || reasons.length === 0) return false;

  const sentences = reasons
    .join(". ")
    .toLowerCase()
    .split(/[.!?;]\s*|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);

  return sentences.some((sentence) => {
    const hasKeyword = keywords.some((kw) => sentence.includes(kw.toLowerCase()));
    if (!hasKeyword) return false;
    const isNegated = NEGATION_TERMS.some((neg) => sentence.includes(neg));
    return !isNegated;
  });
}

function Dot({ on, color }: { on: boolean; color: "blue" | "amber" }) {
  if (on) {
    return (
      <div
        style={{
          margin: "0 auto",
          width: 22,
          height: 22,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: color === "blue" ? "rgba(99,102,241,0.15)" : "rgba(251,191,36,0.15)",
          border: color === "blue" ? "1px solid rgba(99,102,241,0.4)" : "1px solid rgba(251,191,36,0.4)",
        }}
      >
        <div
          style={{
            width: 9,
            height: 9,
            borderRadius: "50%",
            backgroundColor: color === "blue" ? "rgb(99,102,241)" : "rgb(251,191,36)",
          }}
        />
      </div>
    );
  }
  return (
    <div
      style={{
        margin: "0 auto",
        width: 22,
        height: 22,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: 12,
          height: 2,
          borderRadius: 1,
          backgroundColor: "rgba(100,116,139,0.25)",
        }}
      />
    </div>
  );
}

export default function SignalMatrix({ modelBreakdown, manipulation }: SignalMatrixProps) {
  const findModel = (
    list: { model: string; verdict: string; confidence: number; reasons: string[] }[] | undefined,
    name: string,
  ) => list?.find((m) => m.model.toLowerCase().includes(name.toLowerCase()));

  // Reasoning models: Gemini lives in manipulation breakdown; Hive may be in either.
  const getReasoning = (name: string) => {
    return (
      findModel(manipulation?.modelBreakdown, name) ||
      findModel(modelBreakdown, name)
    );
  };

  // Score models: Winston / SightEngine / AI or Not — live in modelBreakdown.
  const getScore = (name: string) => findModel(modelBreakdown, name);

  // Stats for reasoning grid
  let detected = 0;
  const possible = REASONING_SIGNALS.length * REASONING_MODELS.length;
  REASONING_SIGNALS.forEach((sig) => {
    REASONING_MODELS.forEach((name) => {
      const m = getReasoning(name);
      if (m && hasSignal(m.reasons, sig.keywords, m.verdict)) detected++;
    });
  });

  const cellStyle: React.CSSProperties = {
    paddingTop: 3,
    paddingBottom: 3,
    paddingLeft: 4,
    paddingRight: 4,
    textAlign: "center",
    lineHeight: 1,
  };

  const labelStyle: React.CSSProperties = {
    paddingTop: 3,
    paddingBottom: 3,
    paddingRight: 12,
    fontSize: 11,
    fontWeight: 500,
    color: "rgb(148,163,184)",
    textAlign: "right",
    width: 180,
    lineHeight: 1.1,
  };

  const sectionLabel: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    color: "rgb(148,163,184)",
    paddingRight: 12,
    paddingLeft: 12,
    paddingTop: 10,
    paddingBottom: 4,
    textAlign: "center",
  };

  const verdictBadge = (verdict: string, confidence: number) => {
    const positive = isPositiveVerdict(verdict);
    const label = (verdict || "—").trim();
    return (
      <div
        style={{
          display: "inline-flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
        }}
      >
        <div
          style={{
            padding: "3px 10px",
            borderRadius: 999,
            fontSize: 10,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            backgroundColor: positive
              ? "rgba(239,68,68,0.12)"
              : "rgba(34,197,94,0.12)",
            border: positive
              ? "1px solid rgba(239,68,68,0.35)"
              : "1px solid rgba(34,197,94,0.35)",
            color: positive ? "rgb(248,113,113)" : "rgb(74,222,128)",
          }}
        >
          {label}
        </div>
        <div style={{ fontSize: 10, color: "rgb(100,116,139)" }}>
          {Math.round(confidence ?? 0)}% conf.
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        marginTop: 24,
        borderRadius: 12,
        border: "1px solid rgba(100,116,139,0.2)",
        backgroundColor: "var(--card, #1a1a2e)",
        padding: 24,
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
      }}
    >
      <h4
        style={{
          marginBottom: 6,
          textAlign: "center",
          fontSize: 16,
          fontWeight: 600,
          color: "var(--foreground, #f1f5f9)",
        }}
      >
        Signals Detected in This Image
      </h4>
      <p
        style={{
          marginTop: 0,
          marginBottom: 20,
          textAlign: "center",
          fontSize: 11,
          color: "rgb(100,116,139)",
        }}
      >
        Detailed forensic signals from reasoning models, plus overall verdicts from score-based models.
      </p>

      {/* === SCORE-ONLY MODELS STRIP === */}
      <div>
        <p
          style={{
            margin: "0 0 12px 0",
            fontSize: 10,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "rgb(148,163,184)",
            textAlign: "center",
          }}
        >
          Score-Based Models — overall verdict only
        </p>
        <p
          style={{
            margin: "0 0 14px 0",
            fontSize: 11,
            color: "rgb(100,116,139)",
            textAlign: "center",
          }}
        >
          These detectors return a single probability score rather than per-signal reasoning.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${SCORE_MODELS.length}, minmax(0,1fr))`,
            gap: 12,
          }}
        >
          {SCORE_MODELS.map((name) => {
            const m = getScore(name);
            return (
              <div
                key={name}
                style={{
                  padding: 12,
                  borderRadius: 8,
                  border: "1px solid rgba(100,116,139,0.2)",
                  backgroundColor: "rgba(15,23,42,0.4)",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "rgb(165,180,252)",
                    marginBottom: 8,
                  }}
                >
                  {name}
                </div>
                {m
                  ? verdictBadge(m.verdict, m.confidence)
                  : (
                    <div style={{ fontSize: 11, color: "rgb(100,116,139)" }}>
                      No response
                    </div>
                  )}
              </div>
            );
          })}
        </div>
      </div>

      {/* === REASONING MODELS GRID === */}
      <div style={{ overflowX: "auto", marginTop: 24, paddingTop: 16, borderTop: "1px solid rgba(100,116,139,0.2)" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "separate",
            borderSpacing: 0,
            fontSize: 12,
          }}
        >
          <thead>
            <tr>
              <th style={{ width: 180, paddingBottom: 4 }} />
              <th
                colSpan={REASONING_MODELS.length}
                style={{
                  paddingBottom: 6,
                  textAlign: "center",
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "rgb(165,180,252)",
                  borderBottom: "2px solid rgba(99,102,241,0.5)",
                }}
              >
                Reasoning Models — per-signal detection
              </th>
            </tr>
            <tr>
              <th style={{ width: 180, paddingBottom: 8 }} />
              {REASONING_MODELS.map((name) => (
                <th
                  key={name}
                  style={{
                    paddingBottom: 8,
                    paddingTop: 6,
                    textAlign: "center",
                    fontSize: 10,
                    fontWeight: 600,
                    color: "rgb(165,180,252)",
                  }}
                >
                  {name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={1 + REASONING_MODELS.length} style={sectionLabel}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}>
                  <div style={{ flex: 1, height: 1, background: "rgba(100,116,139,0.25)" }} />
                  <span style={{ whiteSpace: "nowrap" }}>AI generation indicators</span>
                  <div style={{ flex: 1, height: 1, background: "rgba(100,116,139,0.25)" }} />
                </div>
              </td>
            </tr>
            {REASONING_SIGNALS.filter((s) => s.category === "ai").map((sig) => (
              <tr key={sig.label}>
                <td style={labelStyle}>{sig.label}</td>
                {REASONING_MODELS.map((name) => {
                  const m = getReasoning(name);
                  return (
                    <td key={name} style={cellStyle}>
                      <Dot
                        on={!!m && hasSignal(m.reasons, sig.keywords, m.verdict)}
                        color="blue"
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr>
              <td colSpan={1 + REASONING_MODELS.length} style={sectionLabel}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}>
                  <div style={{ flex: 1, height: 1, background: "rgba(100,116,139,0.25)" }} />
                  <span style={{ whiteSpace: "nowrap" }}>Edit / manipulation indicators</span>
                  <div style={{ flex: 1, height: 1, background: "rgba(100,116,139,0.25)" }} />
                </div>
              </td>
            </tr>
            {REASONING_SIGNALS.filter((s) => s.category === "edit").map((sig) => (
              <tr key={sig.label}>
                <td style={labelStyle}>{sig.label}</td>
                {REASONING_MODELS.map((name) => {
                  const m = getReasoning(name);
                  return (
                    <td key={name} style={cellStyle}>
                      <Dot
                        on={!!m && hasSignal(m.reasons, sig.keywords, m.verdict)}
                        color="amber"
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div
        style={{
          marginTop: 20,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          fontSize: 12,
          color: "rgb(100,116,139)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "rgb(99,102,241)" }} />
          <span>AI signal detected</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "rgb(251,191,36)" }} />
          <span>Edit signal detected</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 12, height: 2, borderRadius: 1, backgroundColor: "rgba(100,116,139,0.3)" }} />
          <span>Not detected</span>
        </div>
      </div>

      <div
        style={{
          marginTop: 20,
          borderRadius: 8,
          backgroundColor: "rgba(99,102,241,0.05)",
          padding: 16,
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--foreground, #f1f5f9)",
            margin: 0,
          }}
        >
          {detected} of {possible} reasoning-model signals detected
        </p>
        <p
          style={{
            fontSize: 12,
            color: "rgb(100,116,139)",
            marginTop: 4,
            marginBottom: 0,
          }}
        >
          Combined with verdicts from 3 score-based detectors for full 5-model coverage.
        </p>
      </div>
    </div>
  );
}
