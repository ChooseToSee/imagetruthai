const AI_SIGNALS = [
  { label: "Generative Fingerprint", keywords:
    ["noise pattern","diffusion","gan","generator",
     "fingerprint","generation","synthetic origin",
     "ai-generated","generated"] },
  { label: "Synthetic Texture", keywords:
    ["texture","skin","smooth","hair","surface",
     "micro-detail","synthetic texture","unnatural"] },
  { label: "Structural Anomalies", keywords:
    ["hand","finger","eye","anatomy","distort",
     "warp","structural","anomal","face","proportion"] },
  { label: "Metadata Anomalies", keywords:
    ["metadata","exif","timestamp","camera",
     "missing field","no camera","stripped"] },
];

const EDIT_SIGNALS = [
  { label: "Manipulation Artifacts", keywords:
    ["cloning","splicing","retouching","editing",
     "manipulation","composite","photoshop",
     "alter","modified"] },
  { label: "Compression Issues", keywords:
    ["compression","jpeg artifact","inconsistent",
     "region","block","quality"] },
];

const AI_MODELS = ["Winston","SightEngine","AI or Not"];
const EDIT_MODELS = ["Gemini","Hive"];

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

function hasSignal(
  reasons: string[],
  keywords: string[]
): boolean {
  const text = reasons.join(" ").toLowerCase();
  return keywords.some(kw => text.includes(kw));
}

export default function SignalMatrix({
  modelBreakdown,
  manipulation
}: SignalMatrixProps) {
  const getAI = (name: string) =>
    modelBreakdown.find(m =>
      m.model.toLowerCase().includes(name.toLowerCase())
    );
  const getEdit = (name: string) =>
    manipulation?.modelBreakdown?.find(m =>
      m.model.toLowerCase().includes(name.toLowerCase())
    );

  let detected = 0;
  const possible =
    AI_SIGNALS.length * AI_MODELS.length +
    EDIT_SIGNALS.length * EDIT_MODELS.length;

  AI_SIGNALS.forEach(sig =>
    AI_MODELS.forEach(name => {
      const m = getAI(name);
      if (m && hasSignal(m.reasons, sig.keywords)) detected++;
    })
  );
  EDIT_SIGNALS.forEach(sig =>
    EDIT_MODELS.forEach(name => {
      const m = getEdit(name);
      if (m && hasSignal(m.reasons, sig.keywords)) detected++;
    })
  );

  let uniqueCatches = 0;
  [...AI_SIGNALS, ...EDIT_SIGNALS].forEach((sig, si) => {
    const isAI = si < AI_SIGNALS.length;
    const names = isAI ? AI_MODELS : EDIT_MODELS;
    const hits = names.filter(name => {
      const m = isAI ? getAI(name) : getEdit(name);
      return m && hasSignal(m.reasons, sig.keywords);
    }).length;
    if (hits > 0 && hits < names.length) uniqueCatches++;
  });

  const Dot = ({ on, color }: {
    on: boolean;
    color: "blue" | "amber"
  }) => {
    if (on) {
      const ringBg = color === "blue"
        ? "rgba(99,102,241,0.15)"
        : "rgba(251,191,36,0.15)";
      const ringBorder = color === "blue"
        ? "1px solid rgba(99,102,241,0.4)"
        : "1px solid rgba(251,191,36,0.4)";
      const dotBg = color === "blue"
        ? "rgb(99,102,241)"
        : "rgb(251,191,36)";
      return (
        <div style={{
          margin:"0 auto",
          width:24,height:24,
          borderRadius:"50%",
          display:"flex",
          alignItems:"center",
          justifyContent:"center",
          backgroundColor: ringBg,
          border: ringBorder,
        }}>
          <div style={{
            width:10,height:10,
            borderRadius:"50%",
            backgroundColor: dotBg,
          }} />
        </div>
      );
    }
    return (
      <div style={{
        margin:"0 auto",width:24,height:24,
        display:"flex",alignItems:"center",
        justifyContent:"center"
      }}>
        <div style={{
          width:14,height:2,borderRadius:1,
          backgroundColor:"rgba(100,116,139,0.2)"
        }} />
      </div>
    );
  };

  return (
    <div className="mx-auto mt-6 rounded-xl border border-border bg-card p-6 shadow-card">
      <h4 className="mb-6 text-center font-display text-lg font-semibold text-foreground">
        Signals Detected in This Image
      </h4>
      <div style={{overflowX:"auto"}}>
        <table style={{
          width:"100%",
          borderCollapse:"separate",
          borderSpacing:0,
          fontSize:12
        }}>
          <thead>
            <tr>
              <th style={{width:130,paddingBottom:4}} />
              <th colSpan={3} style={{
                paddingBottom:4,
                textAlign:"center",
                fontSize:10,
                fontWeight:700,
                textTransform:"uppercase",
                letterSpacing:"0.1em",
                color:"rgb(99,102,241)",
                borderBottom:"2px solid rgb(99,102,241)"
              }}>
                AI Analysis
              </th>
              <th style={{
                width:12,
                borderLeft:"2px solid rgba(100,116,139,0.4)"
              }} />
              <th colSpan={2} style={{
                paddingBottom:4,
                textAlign:"center",
                fontSize:10,
                fontWeight:700,
                textTransform:"uppercase",
                letterSpacing:"0.1em",
                color:"rgb(251,191,36)",
                borderBottom:"2px solid rgb(251,191,36)"
              }}>
                Edit Analysis
              </th>
            </tr>
            <tr>
              <th style={{width:130,paddingBottom:12}} />
              {["Winston","SightEngine","AI or Not"]
                .map(n => (
                <th key={n} style={{
                  paddingBottom:12,
                  textAlign:"center",
                  fontSize:10,
                  fontWeight:600,
                  color:"rgb(99,102,241)",
                  paddingLeft:4,paddingRight:4
                }}>{n}</th>
              ))}
              <th style={{
                width:12,
                borderLeft:"2px solid rgba(100,116,139,0.4)"
              }} />
              {["Gemini","Hive"].map(n => (
                <th key={n} style={{
                  paddingBottom:12,
                  textAlign:"center",
                  fontSize:10,
                  fontWeight:600,
                  color:"rgb(251,191,36)",
                  paddingLeft:4,paddingRight:4
                }}>{n}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {AI_SIGNALS.map(sig => (
              <tr key={sig.label}>
                <td style={{
                  paddingTop:10,paddingBottom:10,
                  paddingRight:12,
                  fontSize:11,fontWeight:500,
                  color:"rgb(100,116,139)",
                  textAlign:"right"
                }}>
                  {sig.label}
                </td>
                {AI_MODELS.map(name => {
                  const m = getAI(name);
                  return (
                    <td key={name} style={{
                      paddingTop:10,paddingBottom:10,
                      paddingLeft:4,paddingRight:4,
                      textAlign:"center"
                    }}>
                      <Dot
                        on={!!m && hasSignal(
                          m.reasons, sig.keywords
                        )}
                        color="blue"
                      />
                    </td>
                  );
                })}
                <td style={{
                  width:12,
                  borderLeft:"2px solid rgba(100,116,139,0.4)"
                }} />
                {EDIT_MODELS.map(name => (
                  <td key={name} style={{
                    paddingTop:10,paddingBottom:10,
                    paddingLeft:4,paddingRight:4,
                    textAlign:"center"
                  }}>
                    <Dot on={false} color="amber" />
                  </td>
                ))}
              </tr>
            ))}
            {EDIT_SIGNALS.map(sig => (
              <tr key={sig.label}>
                <td style={{
                  paddingTop:10,paddingBottom:10,
                  paddingRight:12,
                  fontSize:11,fontWeight:500,
                  color:"rgb(100,116,139)",
                  textAlign:"right"
                }}>
                  {sig.label}
                </td>
                {AI_MODELS.map(name => (
                  <td key={name} style={{
                    paddingTop:10,paddingBottom:10,
                    paddingLeft:4,paddingRight:4,
                    textAlign:"center"
                  }}>
                    <Dot on={false} color="blue" />
                  </td>
                ))}
                <td style={{
                  width:12,
                  borderLeft:"2px solid rgba(100,116,139,0.4)"
                }} />
                {EDIT_MODELS.map(name => {
                  const m = getEdit(name);
                  return (
                    <td key={name} style={{
                      paddingTop:10,paddingBottom:10,
                      paddingLeft:4,paddingRight:4,
                      textAlign:"center"
                    }}>
                      <Dot
                        on={!!m && hasSignal(
                          m.reasons, sig.keywords
                        )}
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
      <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
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
      <div className="mt-5 rounded-lg bg-primary/5 p-4 text-center">
        <p className="text-sm font-semibold text-foreground">
          {detected} of {possible} possible signals detected across 5 models
        </p>
        {uniqueCatches > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            {uniqueCatches} signal{uniqueCatches > 1 ? "s" : ""} caught by models that others missed — coverage no single model could provide alone
          </p>
        )}
      </div>
    </div>
  );
}
