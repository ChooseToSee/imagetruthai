import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-stream, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ModelResult {
  model: string;
  verdict: "ai" | "human";
  confidence: number;
  reasons: string[];
  manipulation: {
    edited: boolean;
    confidence: number;
    reasons: string[];
  };
}

const SYSTEM_PROMPT =
  "You are an expert forensic image analyst specializing in two tasks: (1) detecting AI-generated images vs real photographs, and (2) detecting image manipulation/editing (Photoshop, filters, splicing, clone stamping, content-aware fill, etc.). You MUST respond with valid JSON only, no markdown, no code fences.";

const USER_PROMPT =
  'Analyze this image for TWO things:\n1. AI DETECTION: Is this image AI-generated or a real photograph? Provide your verdict, confidence score (50-99), and 3-5 specific forensic reasons.\n2. MANIPULATION DETECTION: Has this image been edited or manipulated by an image editor (e.g., Photoshop, retouching, splicing, filters, clone stamping, content-aware fill)? Look for inconsistent lighting, JPEG compression artifacts, cloned regions, unnatural edges, mismatched noise patterns, and metadata anomalies. Provide edited (true/false), confidence (50-99), and 3-5 reasons.\n\nRespond with ONLY this JSON structure (no markdown, no code fences):\n{"verdict":"ai"|"human","confidence":number,"reasons":["..."],"manipulation":{"edited":boolean,"confidence":number,"reasons":["..."]}}';

const GEMINI_PRO_SYSTEM = "You are an expert forensic image analyst specializing in detecting AI-generated images and image manipulation. You perform deep, methodical analysis. You MUST respond with valid JSON only, no markdown, no code fences.";

// ── Google AI (Gemini) direct call ──────────────────────────────────
async function analyzeWithGoogleAI(
  model: string,
  modelLabel: string,
  systemOverride: string | null,
  base64Image: string,
  mimeType: string,
  apiKey: string
): Promise<ModelResult> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const body: any = {
    contents: [
      {
        role: "user",
        parts: [
          { text: (systemOverride ?? SYSTEM_PROMPT) + "\n\n" + USER_PROMPT },
          { inline_data: { mime_type: mimeType, data: base64Image } },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 4000,
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const t = await res.text();
    const err = new Error(`${modelLabel} error [${res.status}]: ${t}`);
    (err as any).status = res.status;
    throw err;
  }

  const data = await res.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";

  let jsonStr = content.trim();
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  }

  const args = JSON.parse(jsonStr);
  return parseModelResult(modelLabel, args);
}

// ── OpenAI API call ─────────────────────────────────────────────────
async function analyzeWithOpenAI(
  model: string,
  modelLabel: string,
  dataUrl: string,
  apiKey: string
): Promise<ModelResult> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: USER_PROMPT },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
      // gpt-5-mini does not support custom temperature
      max_completion_tokens: 4000,
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    const err = new Error(`${modelLabel} error [${res.status}]: ${t}`);
    (err as any).status = res.status;
    throw err;
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content ?? "{}";

  let jsonStr = content.trim();
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  }

  const args = JSON.parse(jsonStr);
  return parseModelResult(modelLabel, args);
}

function parseModelResult(modelLabel: string, args: any): ModelResult {
  const clamp = (v: number) => Math.max(50, Math.min(99, Math.round(v ?? 50)));
  return {
    model: modelLabel,
    verdict: args.verdict ?? "human",
    confidence: clamp(args.confidence),
    reasons: args.reasons ?? [],
    manipulation: {
      edited: args.manipulation?.edited ?? false,
      confidence: clamp(args.manipulation?.confidence),
      reasons: args.manipulation?.reasons ?? [],
    },
  };
}

// ── Weighted consensus ───────────────────────────────────────────────
function computeConsensus(results: ModelResult[]) {
  const weights: Record<string, number> = {
    "Gemini Pro": 0.40,
    "GPT-5": 0.35,
    "Gemini Flash": 0.25,
  };

  let aiWeightedScore = 0;
  let humanWeightedScore = 0;
  let totalWeight = 0;

  for (const r of results) {
    const w = weights[r.model] ?? 0.25;
    totalWeight += w;
    const score = r.confidence / 100;
    if (r.verdict === "ai") {
      aiWeightedScore += score * w;
      humanWeightedScore += (1 - score) * w;
    } else {
      humanWeightedScore += score * w;
      aiWeightedScore += (1 - score) * w;
    }
  }

  if (totalWeight > 0) {
    aiWeightedScore /= totalWeight;
    humanWeightedScore /= totalWeight;
  }

  const verdict: "ai" | "human" = aiWeightedScore >= humanWeightedScore ? "ai" : "human";
  const confidence = Math.max(50, Math.min(99, Math.round(Math.max(aiWeightedScore, humanWeightedScore) * 100)));

  const allReasons: string[] = [];
  const aligned = results.filter((r) => r.verdict === verdict);
  for (const r of aligned) {
    for (const reason of r.reasons.slice(0, 2)) {
      allReasons.push(reason);
    }
  }

  const agreementCount = results.filter((r) => r.verdict === verdict).length;
  if (agreementCount === results.length) {
    allReasons.unshift(`All ${results.length} models agree: image is ${verdict === "ai" ? "AI-generated" : "human-created"}`);
  } else {
    allReasons.unshift(`${agreementCount}/${results.length} models lean ${verdict === "ai" ? "AI-generated" : "human-created"}`);
  }

  // --- Manipulation consensus ---
  let editedWeightedScore = 0;
  let cleanWeightedScore = 0;
  let manipTotalWeight = 0;

  for (const r of results) {
    const w = weights[r.model] ?? 0.25;
    manipTotalWeight += w;
    const score = r.manipulation.confidence / 100;
    if (r.manipulation.edited) {
      editedWeightedScore += score * w;
      cleanWeightedScore += (1 - score) * w;
    } else {
      cleanWeightedScore += score * w;
      editedWeightedScore += (1 - score) * w;
    }
  }

  if (manipTotalWeight > 0) {
    editedWeightedScore /= manipTotalWeight;
    cleanWeightedScore /= manipTotalWeight;
  }

  const manipEdited = editedWeightedScore >= cleanWeightedScore;
  const manipConfidence = Math.max(50, Math.min(99, Math.round(Math.max(editedWeightedScore, cleanWeightedScore) * 100)));

  const manipReasons: string[] = [];
  const manipAligned = results.filter((r) => r.manipulation.edited === manipEdited);
  for (const r of manipAligned) {
    for (const reason of r.manipulation.reasons.slice(0, 2)) {
      manipReasons.push(reason);
    }
  }

  const manipAgreement = manipAligned.length;
  if (manipAgreement === results.length) {
    manipReasons.unshift(`All ${results.length} models agree: image is ${manipEdited ? "edited" : "unmodified"}`);
  } else {
    manipReasons.unshift(`${manipAgreement}/${results.length} models lean ${manipEdited ? "edited" : "unmodified"}`);
  }

  const tips = [
    "Check for inconsistencies in small details like fingers, text, or reflections",
    "Zoom in on edges and textures — AI often produces unnaturally smooth surfaces",
    "Look at the image metadata using an EXIF viewer for camera info",
    "Reverse image search to check for original sources",
  ];

  const manipTips = [
    "Look for mismatched lighting directions across the image",
    "Check edges around subjects for unnatural halos or artifacts",
    "Inspect backgrounds for cloned or repeated patterns",
    "Use an error-level analysis (ELA) tool for deeper investigation",
  ];

  return {
    verdict,
    confidence,
    reasons: allReasons.slice(0, 5),
    tips,
    manipulation: {
      edited: manipEdited,
      confidence: manipConfidence,
      reasons: manipReasons.slice(0, 5),
      tips: manipTips,
    },
  };
}

// ── Main handler ─────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const imageFile = formData.get("image") as File;

    if (!imageFile) {
      return new Response(JSON.stringify({ error: "No image provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (imageFile.size > 2 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: "Image too large. Please upload an image under 2 MB." }),
        { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

    if (!GOOGLE_AI_API_KEY && !OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured — missing API keys" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const imageBytes = new Uint8Array(await imageFile.arrayBuffer());
    const base64Image = base64Encode(imageBytes);
    const mimeType = imageFile.type || "image/jpeg";
    const dataUrl = `data:${mimeType};base64,${base64Image}`;

    // Check if client wants streaming
    const wantsStream = req.headers.get("x-stream") === "true";

    // Build model tasks based on available keys
    type ModelTask = { run: () => Promise<ModelResult>; label: string };
    const tasks: ModelTask[] = [];

    if (GOOGLE_AI_API_KEY) {
      tasks.push({
        label: "Gemini Flash",
        run: () => analyzeWithGoogleAI("gemini-2.5-flash", "Gemini Flash", null, base64Image, mimeType, GOOGLE_AI_API_KEY),
      });
      tasks.push({
        label: "Gemini Pro",
        run: () => analyzeWithGoogleAI("gemini-2.5-pro", "Gemini Pro", GEMINI_PRO_SYSTEM, base64Image, mimeType, GOOGLE_AI_API_KEY),
      });
    }
    if (OPENAI_API_KEY) {
      tasks.push({
        label: "GPT-5",
        run: () => analyzeWithOpenAI("gpt-5-mini", "GPT-5", dataUrl, OPENAI_API_KEY),
      });
    }

    if (tasks.length === 0) {
      return new Response(JSON.stringify({ error: "No API keys configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!wantsStream) {
      // Non-streaming path
      const results = await Promise.allSettled(tasks.map((t) => t.run()));

      const successfulResults: ModelResult[] = [];
      const modelBreakdown: ModelResult[] = [];

      for (const r of results) {
        if (r.status === "fulfilled") {
          successfulResults.push(r.value);
          modelBreakdown.push(r.value);
        } else {
          console.error("Model failed:", r.reason);
        }
      }

      if (successfulResults.length === 0) {
        return new Response(JSON.stringify({ error: "All analysis models failed. Please check your API keys." }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const consensus = computeConsensus(successfulResults);
      return new Response(
        JSON.stringify({ ...consensus, modelBreakdown }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Streaming SSE path ─────────────────────────────────────────
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: string, data: unknown) => {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        };

        const successfulResults: ModelResult[] = [];
        const modelBreakdown: ModelResult[] = [];

        const promises = tasks.map(async (task) => {
          try {
            const result = await task.run();
            successfulResults.push(result);
            modelBreakdown.push(result);

            send("model", result);

            const interim = computeConsensus([...successfulResults]);
            send("consensus", {
              ...interim,
              modelBreakdown: [...modelBreakdown],
              modelsCompleted: successfulResults.length,
              modelsTotal: tasks.length,
            });
          } catch (err) {
            console.error(`${task.label} failed:`, err);
            send("model_error", { model: task.label, error: err.message });
          }
        });

        await Promise.allSettled(promises);

        if (successfulResults.length === 0) {
          send("error", { error: "All analysis models failed" });
        } else {
          const final = computeConsensus(successfulResults);
          send("done", { ...final, modelBreakdown });
        }

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("analyze-image error:", error);

    if (error.message?.includes("429") || error.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again shortly" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
