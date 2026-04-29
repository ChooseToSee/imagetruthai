import { motion } from "framer-motion";

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

const AI_SIGNALS = [
  {
    label: "Generative Fingerprint",
    keywords: ["noise pattern", "diffusion", "gan",
      "generator", "fingerprint", "generation",
      "synthetic origin", "ai-generated", "generated"],
  },
  {
    label: "Synthetic Texture",
    keywords: ["texture", "skin", "smooth", "hair",
      "surface", "micro-detail", "synthetic texture",
      "unnatural"],
  },
  {
    label: "Structural Anomalies",
    keywords: ["hand", "finger", "eye", "anatomy",
      "distort", "warp", "structural", "anomal",
      "face", "proportion"],
  },
  {
    label: "Metadata Anomalies",
    keywords: ["metadata", "exif", "timestamp",
      "camera", "missing field", "no camera",
      "stripped"],
  },
];

const EDIT_SIGNALS = [
  {
    label: "Manipulation Artifacts",
    keywords: ["cloning", "splicing", "retouching",
      "editing", "manipulation", "composite",
      "photoshop", "alter", "modified"],
  },
  {
    label: "Compression Inconsistencies",
    keywords: ["compression", "jpeg artifact",
      "inconsistent", "region", "block", "quality"],
  },
];

const AI_MODELS = ["Winston", "SightEngine", "AI or Not"];
const EDIT_MODELS = ["Gemini", "Hive"];

function signalDetected(
  reasons: string[],
  keywords: string[]
): boolean {
  const text = reasons.join(" ").toLowerCase();
  return keywords.some((kw) => text.includes(kw.toLowerCase()));
}

function modelDetectedSignal(
  modelResult: ModelResult | ManipulationModel | undefined,
  signal: { keywords: string[] }
): boolean {
  if (!modelResult) return false;
  if (modelResult.verdict === "ai" ||
      modelResult.verdict === "manipulated" ||
      modelResult.verdict === "edited") {
    if (signalDetected(modelResult.reasons, signal.keywords))
      return true;
    // If model flagged positive but reasons don't keyword-match,
    // mark first signal as detected by default
  }
  return signalDetected(modelResult.reasons, signal.keywords);
}

const SignalMatrix = ({ modelBreakdown, manipulation }: SignalMatrixProps) => {
  const getAIModel = (name: string) =>
    modelBreakdown?.find((m) =>
      m.model.toLowerCase().includes(name.toLowerCase())
    );
  const getEditModel = (name: string) =>
    manipulation?.modelBreakdown?.find((m) =>
      m.model.toLowerCase().includes(name.toLowerCase())
    );

  const allSignals = [...AI_SIGNALS, ...EDIT_SIGNALS];

  // Count total detections for summary
  let detected = 0;
  const possible =
    AI_SIGNALS.length * AI_MODELS.length +
    EDIT_SIGNALS.length * EDIT_MODELS.length;

  allSignals.forEach((signal, si) => {
    if (si < AI_SIGNALS.length) {
      AI_MODELS.forEach((name) => {
        const m = getAIModel(name);
        if (m && modelDetectedSignal(m, signal)) detected++;
      });
    } else {
      EDIT_MODELS.forEach((name) => {
        const m = getEditModel(name);
        if (m && modelDetectedSignal(m, signal)) detected++;
      });
    }
  });

  // Count unique signals caught by at least one model but not all
  let uniqueCatches = 0;
  allSignals.forEach((signal, si) => {
    const modelNames = si < AI_SIGNALS.length
      ? AI_MODELS : EDIT_MODELS;
    const getModel = si < AI_SIGNALS.length
      ? getAIModel : getEditModel;
    const results = modelNames.map((n) => {
      const m = getModel(n);
      return m ? modelDetectedSignal(m, signal) : false;
    });
    const trueCount = results.filter(Boolean).length;
    if (trueCount > 0 && trueCount < modelNames.length) {
      uniqueCatches++;
    }
  });

  const Cell = ({
    detected,
    color,
    delay,
  }: {
    detected: boolean;
    color: "primary" | "amber";
    delay: number;
  }) => {
    const colorClasses =
      color === "primary"
        ? { ring: "bg-primary/15 border-primary/40", dot: "bg-primary" }
        : { ring: "bg-amber-400/15 border-amber-400/40", dot: "bg-amber-400" };

    return detected ? (
      <motion.div
        className={`mx-auto flex h-6 w-6 items-center justify-center rounded-full border ${colorClasses.ring}`}
        initial={{ scale: 0 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true }}
        transition={{ delay, type: "spring" }}
      >
        <div className={`h-2.5 w-2.5 rounded-full ${colorClasses.dot}`} />
      </motion.div>
    ) : (
      <div className="mx-auto flex h-6 w-6 items-center justify-center">
        <div className="h-0.5 w-3.5 rounded-full bg-muted-foreground/20" />
      </div>
    );
  };

  return (
    <motion.div
      className="mx-auto mt-12 max-w-2xl rounded-xl border border-border bg-card p-6 shadow-card"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.2 }}
    >
      <h4 className="mb-6 text-center font-display text-lg font-semibold text-foreground">
        Signals Detected in This Image
      </h4>
      <table className="w-full text-sm border-separate border-spacing-0">
        <thead>
          <tr>
            <th className="w-36 pb-1" />
            <th
              colSpan={3}
              className="pb-1 text-center text-[10px] font-bold uppercase tracking-widest text-primary border-b-2 border-primary px-1"
            >
              AI Analysis
            </th>
            <th className="w-2 border-l-2 border-border/60" />
            <th
              colSpan={2}
              className="pb-1 text-center text-[10px] font-bold uppercase tracking-widest text-amber-400 border-b-2 border-amber-400 px-1"
            >
              Edit Analysis
            </th>
          </tr>
          <tr>
            <th className="w-36 pb-3" />
            {["Winston", "SightEngine", "AI or Not"].map((name) => (
              <th
                key={name}
                className="pb-3 text-center text-[10px] font-semibold text-primary px-1"
              >
                {name}
              </th>
            ))}
            <th className="w-2 border-l-2 border-border/60" />
            {["Gemini", "Hive"].map((name) => (
              <th
                key={name}
                className="pb-3 text-center text-[10px] font-semibold text-amber-400 px-1"
              >
                {name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {AI_SIGNALS.map((signal, rowIndex) => (
            <motion.tr
              key={signal.label}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 + rowIndex * 0.08 }}
            >
              <td className="py-2.5 pr-3 text-[11px] font-medium text-muted-foreground text-right">
                {signal.label}
              </td>
              {AI_MODELS.map((name, i) => {
                const m = getAIModel(name);
                const det = m
                  ? modelDetectedSignal(m, signal)
                  : false;
                return (
                  <td key={name} className="py-2.5 px-1 text-center">
                    <Cell
                      detected={det}
                      color="primary"
                      delay={0.4 + rowIndex * 0.08 + i * 0.04}
                    />
                  </td>
                );
              })}
              <td className="w-2 border-l-2 border-border/60" />
              {EDIT_MODELS.map((name, i) => (
                <td key={name} className="py-2.5 px-1 text-center">
                  <Cell
                    detected={false}
                    color="amber"
                    delay={0.4 + rowIndex * 0.08 + i * 0.04}
                  />
                </td>
              ))}
            </motion.tr>
          ))}
          {EDIT_SIGNALS.map((signal, rowIndex) => (
            <motion.tr
              key={signal.label}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 + rowIndex * 0.08 }}
            >
              <td className="py-2.5 pr-3 text-[11px] font-medium text-muted-foreground text-right">
                {signal.label}
              </td>
              {AI_MODELS.map((name, i) => (
                <td key={name} className="py-2.5 px-1 text-center">
                  <Cell
                    detected={false}
                    color="primary"
                    delay={0.7 + rowIndex * 0.08 + i * 0.04}
                  />
                </td>
              ))}
              <td className="w-2 border-l-2 border-border/60" />
              {EDIT_MODELS.map((name, i) => {
                const m = getEditModel(name);
                const det = m
                  ? modelDetectedSignal(m, signal)
                  : false;
                return (
                  <td key={name} className="py-2.5 px-1 text-center">
                    <Cell
                      detected={det}
                      color="amber"
                      delay={0.7 + rowIndex * 0.08 + i * 0.04}
                    />
                  </td>
                );
              })}
            </motion.tr>
          ))}
        </tbody>
      </table>
      {/* Legend */}
      <div className="mt-5 flex items-center justify-center gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-primary" />
          <span>AI signal detected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span>Edit signal detected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-0.5 w-4 rounded-full bg-muted-foreground/30" />
          <span>Not detected</span>
        </div>
      </div>
      {/* Summary */}
      <div className="mt-5 rounded-lg bg-primary/5 p-4 text-center">
        <p className="text-sm font-semibold text-foreground">
          {detected} of {possible} possible signals detected across 5 models
        </p>
        {uniqueCatches > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            {uniqueCatches} signal{uniqueCatches > 1 ? "s" : ""} caught
            by models that others missed — coverage no single
            model could provide alone
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default SignalMatrix;
