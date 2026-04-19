import type { AnalysisResult, ModelBreakdown } from "@/components/ResultsDisplay";
import { supabase } from "@/integrations/supabase/client";

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
  callbacks: StreamCallbacks,
  recaptchaToken?: string | null
): Promise<void> {
  const formData = new FormData();
  formData.append("image", file);
  if (recaptchaToken) formData.append("recaptcha_token", recaptchaToken);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  // Robustly retrieve the user's access token. getSession() can transiently
  // return null during session restoration (e.g. right after page load), so
  // fall back to refreshSession() before giving up.
  let token: string | null = null;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    token = session?.access_token ?? null;

    if (!token) {
      console.log("[Auth] No session found, attempting refresh...");
      const { data: { session: refreshed } } = await supabase.auth.refreshSession();
      token = refreshed?.access_token ?? null;
    }
  } catch (err) {
    console.error("[Auth] Session retrieval failed:", err);
  }

  // If still no token, send the anon key so the edge function can return a
  // proper requiresAuth response rather than the client crashing here.
  const authValue = token ? `Bearer ${token}` : `Bearer ${supabaseAnonKey}`;
  console.log("[Auth] Using token type:", token ? "user JWT" : "anon fallback");

  let resp: Response;
  try {
    resp = await fetch(`${supabaseUrl}/functions/v1/analyze-image`, {
      method: "POST",
      headers: {
        Authorization: authValue,
        apikey: supabaseAnonKey,
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

    if (resp.status === 401 || parsed?.requiresAuth) {
      const err = new Error(parsed?.error || "Sign in required to analyze images.");
      (err as any).requiresAuth = true;
      throw err;
    }
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
