import React from "react";

const AI_SIGNALS = [
  {
    label: "Generative Fingerprint",
    keywords: [
      "noise pattern","diffusion","gan","generator",
      "fingerprint","generation","synthetic origin",
      "ai-generated","generated"
    ],
  },
  {
    label: "Synthetic Texture",
    keywords: [
      "texture","skin","smooth","hair","surface",
      "micro-detail","synthetic texture","unnatural"
    ],
  },
  {
    label: "Structural Anomalies",
    keywords: [
      "hand","finger","eye","anatomy","distort",
      "warp","structural","anomal","face","proportion"
    ],
  },
  {
    label: "Metadata Anomalies",
    keywords: [
      "metadata","exif","timestamp","camera",
      "missing field","no camera","stripped"
    ],
  },
];

const EDIT_SIGNALS = [
  {
    label: "Manipulation Artifacts",
    keywords: [
      "cloning","splicing","retouching","editing",
      "manipulation","composite","photoshop",
      "alter","modified"
    ],
  },
  {
    label: "Compression Issues",
    keywords: [
      "compression","jpeg artifact","inconsistent",
      "region","block","quality"
    ],
  },
];

const AI_MODELS = ["Winston", "SightEngine", "AI or Not"];
const EDIT_MODELS = ["Gemini", "Hive"];

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

function hasSignal(reasons: string[], keywords: string[]): boolean {
  const text = reasons.join(" ").toLowerCase();
  return keywords.some((kw) => text.includes(kw.toLowerCase()));
}

function Dot({ on, color }: { on: boolean; color: "blue" | "amber" }) {
  if (on) {
    return (
      <div
        style={{
          margin: "0 auto",
          width: 24,
          height: 24,
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
            width: 10,
            height: 10,
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
        width: 24,
        height: 24,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: 14,
          height: 2,
          borderRadius: 1,
          backgroundColor: "rgba(100,116,139,0.2)",
        }}
      />
    </div>
  );
}

export default function SignalMatrix({ modelBreakdown, manipulation }: SignalMatrixProps) {
  const getAI = (name: string) =>
    modelBreakdown.find((m) =>
      m.model.toLowerCase().includes(name.toLowerCase())
    );

  const getEdit = (name: string) =>
    manipulation?.modelBreakdown?.find((m) =>
      m.model.toLowerCase().includes(name.toLowerCase())
    );

  let detected = 0;
  const possible =
    AI_SIGNALS.length * AI_MODELS.length +
    EDIT_SIGNALS.length * EDIT_MODELS.length;

  AI_SIGNALS.forEach((sig) =>
    AI_MODELS.forEach((name) => {
      const m = getAI(name);
      if (m && hasSignal(m.reasons, sig.keywords)) detected++;
    })
  );

  EDIT_SIGNALS.forEach((sig) =>
    EDIT_MODELS.forEach((name) => {
      const m = getEdit(name);
      if (m && hasSignal(m.reasons, sig.keywords)) detected++;
    })
  );

  let uniqueCatches = 0;
  [...AI_SIGNALS, ...EDIT_SIGNALS].forEach((sig, si) => {
    const isAISig = si < AI_SIGNALS.length;
    const names = isAISig ? AI_MODELS : EDIT_MODELS;
    const hits = names.filter((name) => {
      const m = isAISig ? getAI(name) : getEdit(name);
      return m && hasSignal(m.reasons, sig.keywords);
    }).length;
    if (hits > 0 && hits < names.length) uniqueCatches++;
  });

  const cellStyle: React.CSSProperties = {
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 4,
    paddingRight: 4,
    textAlign: "center",
  };

  const dividerStyle: React.CSSProperties = {
    width: 12,
    borderLeft: "2px solid rgba(100,116,139,0.35)",
  };

  const labelStyle: React.CSSProperties = {
    paddingTop: 10,
    paddingBottom: 10,
    paddingRight: 12,
    fontSize: 11,
    fontWeight: 500,
    color: "rgb(100,116,139)",
    textAlign: "right",
    width: 130,
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
          marginBottom: 24,
          textAlign: "center",
          fontSize: 16,
          fontWeight: 600,
          color: "var(--foreground, #f1f5f9)",
        }}
      >
        Signals Detected in This Image
      </h4>

      <div style={{ overflowX: "auto" }}>
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
              <th style={{ width: 130, paddingBottom: 4 }} />
              <th
                colSpan={3}
                style={{
                  paddingBottom: 4,
                  textAlign: "center",
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "rgb(99,102,241)",
                  borderBottom: "2px solid rgb(99,102,241)",
                  paddingLeft: 4,
                  paddingRight: 4,
                }}
              >
                AI Analysis
              </th>
              <th style={dividerStyle} />
              <th
                colSpan={2}
                style={{
                  paddingBottom: 4,
                  textAlign: "center",
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "rgb(251,191,36)",
                  borderBottom: "2px solid rgb(251,191,36)",
                  paddingLeft: 4,
                  paddingRight: 4,
                }}
              >
                Edit Analysis
              </th>
            </tr>
            <tr>
              <th style={{ width: 130, paddingBottom: 12 }} />
              {AI_MODELS.map((name) => (
                <th
                  key={name}
                  style={{
                    paddingBottom: 12,
                    textAlign: "center",
                    fontSize: 10,
                    fontWeight: 600,
                    color: "rgb(99,102,241)",
                    paddingLeft: 4,
                    paddingRight: 4,
                  }}
                >
                  {name}
                </th>
              ))}
              <th style={dividerStyle} />
              {EDIT_MODELS.map((name) => (
                <th
                  key={name}
                  style={{
                    paddingBottom: 12,
                    textAlign: "center",
                    fontSize: 10,
                    fontWeight: 600,
                    color: "rgb(251,191,36)",
                    paddingLeft: 4,
                    paddingRight: 4,
                  }}
                >
                  {name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {AI_SIGNALS.map((sig) => (
              <tr key={sig.label}>
                <td style={labelStyle}>{sig.label}</td>
                {AI_MODELS.map((name) => {
                  const m = getAI(name);
                  return (
                    <td key={name} style={cellStyle}>
                      <Dot
                        on={!!m && hasSignal(m.reasons, sig.keywords)}
                        color="blue"
                      />
                    </td>
                  );
                })}
                <td style={dividerStyle} />
                {EDIT_MODELS.map((name) => {
                  const m = getEdit(name);
                  return (
                    <td key={name} style={cellStyle}>
                      <Dot
                        on={!!m && hasSignal(m.reasons, sig.keywords)}
                        color="amber"
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
            {EDIT_SIGNALS.map((sig) => (
              <tr key={sig.label}>
                <td style={labelStyle}>{sig.label}</td>
                {AI_MODELS.map((name) => {
                  const m = getAI(name);
                  return (
                    <td key={name} style={cellStyle}>
                      <Dot
                        on={!!m && hasSignal(m.reasons, sig.keywords)}
                        color="blue"
                      />
                    </td>
                  );
                })}
                <td style={dividerStyle} />
                {EDIT_MODELS.map((name) => {
                  const m = getEdit(name);
                  return (
                    <td key={name} style={cellStyle}>
                      <Dot
                        on={!!m && hasSignal(m.reasons, sig.keywords)}
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
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              backgroundColor: "rgb(99,102,241)",
            }}
          />
          <span>AI signal detected</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              backgroundColor: "rgb(251,191,36)",
            }}
          />
          <span>Edit signal detected</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 14,
              height: 2,
              borderRadius: 1,
              backgroundColor: "rgba(100,116,139,0.3)",
            }}
          />
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
          {detected} of {possible} possible signals detected across 5 models
        </p>
        {uniqueCatches > 0 && (
          <p
            style={{
              fontSize: 12,
              color: "rgb(100,116,139)",
              marginTop: 4,
              marginBottom: 0,
            }}
          >
            {uniqueCatches} signal{uniqueCatches > 1 ? "s" : ""} caught by
            models that others missed — coverage no single model could
            provide alone
          </p>
        )}
      </div>
    </div>
  );
}
