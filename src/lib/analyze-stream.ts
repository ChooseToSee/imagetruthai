import type { AnalysisResult, ModelBreakdown } from "@/components/ResultsDisplay";

export interface StreamConsensus extends AnalysisResult {
  modelsCompleted: number;
  modelsTotal: number;
  modelBreakdown: ModelBreakdown[];
}

export interface StreamCallbacks {
  onModel: (model: ModelBreakdown) => void;
  onConsensus: (consensus: StreamConsensus) => void;
  onDone: (result: AnalysisResult) => void;
  onError: (error: string) => void;
}

export async function analyzeImageStream(
  file: File,
  callbacks: StreamCallbacks
): Promise<void> {
  const formData = new FormData();
  formData.append("image", file);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  let resp: Response;
  try {
    resp = await fetch(`${supabaseUrl}/functions/v1/analyze-image`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${supabaseKey}`,
        "x-stream": "true",
      },
      body: formData,
    });
  } catch (fetchError: any) {
    console.error("Fetch network error:", fetchError);
    throw new Error(`Network error: ${fetchError.message}. Please check your connection and try again.`);
  }

  if (!resp.ok) {
    const text = await resp.text();
    let parsed: any = null;
    try { parsed = JSON.parse(text); } catch {}

    if (resp.status === 429 && parsed?.limitReached) {
      const err = new Error(parsed.error || "Daily scan limit reached");
      (err as any).limitReached = true;
      (err as any).tier = parsed.tier;
      (err as any).limit = parsed.limit;
      (err as any).current = parsed.current;
      throw err;
    }
    if (resp.status === 402) {
      throw new Error("Service temporarily unavailable — please try again later.");
    }
    if (resp.status === 429) {
      throw new Error("Too many requests — please wait a moment and try again.");
    }
    throw new Error(parsed?.error || "Analysis failed");
  }

  if (!resp.body) throw new Error("No response stream");

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    let newlineIdx: number;
    while ((newlineIdx = buffer.indexOf("\n\n")) !== -1) {
      const chunk = buffer.slice(0, newlineIdx);
      buffer = buffer.slice(newlineIdx + 2);

      let event = "";
      let data = "";

      for (const line of chunk.split("\n")) {
        if (line.startsWith("event: ")) event = line.slice(7).trim();
        else if (line.startsWith("data: ")) data = line.slice(6);
      }

      if (!event || !data) continue;

      try {
        const parsed = JSON.parse(data);

        switch (event) {
          case "model":
            callbacks.onModel(parsed as ModelBreakdown);
            break;
          case "consensus":
            callbacks.onConsensus(parsed as StreamConsensus);
            break;
          case "done":
            callbacks.onDone(parsed as AnalysisResult);
            break;
          case "error":
            callbacks.onError(parsed.error || "Analysis failed");
            break;
          case "model_error":
            // Individual model failure, consensus will still work
            break;
        }
      } catch {
        // Ignore parse errors
      }
    }
  }
}
