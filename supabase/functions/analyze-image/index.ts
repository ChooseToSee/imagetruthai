import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ModelResult {
  model: string;
  verdict: "ai" | "human";
  confidence: number;
  reasons: string[];
}

// ── Gemini Flash via Lovable AI Gateway ──────────────────────────────
async function analyzeWithGemini(
  dataUrl: string,
  apiKey: string
): Promise<ModelResult> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content:
            "You are an expert forensic image analyst specializing in detecting AI-generated images. Respond only via the provided tool.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this image. Is it AI-generated or a real photograph? Provide your verdict, confidence score, and 3-5 specific forensic reasons.",
            },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "report_analysis",
            description: "Report the AI vs human image analysis result",
            parameters: {
              type: "object",
              properties: {
                verdict: { type: "string", enum: ["ai", "human"] },
                confidence: { type: "number", description: "50-99" },
                reasons: {
                  type: "array",
                  items: { type: "string" },
                  description: "3-5 forensic reasons",
                },
              },
              required: ["verdict", "confidence", "reasons"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "report_analysis" } },
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Gemini error [${res.status}]: ${t}`);
  }

  const data = await res.json();
  const args = JSON.parse(data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments ?? "{}");

  return {
    model: "Gemini Flash",
    verdict: args.verdict ?? "human",
    confidence: Math.max(50, Math.min(99, Math.round(args.confidence ?? 50))),
    reasons: args.reasons ?? [],
  };
}

// ── GPT-5 via Lovable AI Gateway ─────────────────────────────────────
async function analyzeWithGPT5(
  dataUrl: string,
  apiKey: string
): Promise<ModelResult> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openai/gpt-5",
      messages: [
        {
          role: "system",
          content:
            "You are an expert forensic image analyst. Determine if images are AI-generated or human-made. Respond only via the provided tool.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this image carefully. Is it AI-generated or a real photograph? Provide your verdict, confidence score, and 3-5 forensic reasons.",
            },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "report_analysis",
            description: "Report the AI vs human image analysis result",
            parameters: {
              type: "object",
              properties: {
                verdict: { type: "string", enum: ["ai", "human"] },
                confidence: { type: "number", description: "50-99" },
                reasons: {
                  type: "array",
                  items: { type: "string" },
                  description: "3-5 forensic reasons",
                },
              },
              required: ["verdict", "confidence", "reasons"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "report_analysis" } },
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`GPT-5 error [${res.status}]: ${t}`);
  }

  const data = await res.json();
  const args = JSON.parse(data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments ?? "{}");

  return {
    model: "GPT-5",
    verdict: args.verdict ?? "human",
    confidence: Math.max(50, Math.min(99, Math.round(args.confidence ?? 50))),
    reasons: args.reasons ?? [],
  };
}

// ── Hive Moderation API ──────────────────────────────────────────────
async function analyzeWithHive(imageBytes: Uint8Array, mimeType: string): Promise<ModelResult> {
  const HIVE_API_KEY = Deno.env.get("HIVE_API_KEY");
  if (!HIVE_API_KEY) throw new Error("HIVE_API_KEY not configured");

  const formData = new FormData();
  const blob = new Blob([imageBytes], { type: mimeType });
  formData.append("media", blob, "image.jpg");

  const res = await fetch("https://api.thehive.ai/api/v2/task/sync", {
    method: "POST",
    headers: { Authorization: `Token ${HIVE_API_KEY}` },
    body: formData,
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Hive error [${res.status}]: ${t}`);
  }

  const data = await res.json();

  // Parse Hive response — look for ai_generated model output
  let aiScore = 0;
  let notAiScore = 0;
  const reasons: string[] = [];

  const statuses = data?.status ?? [];
  for (const s of statuses) {
    const outputs = s?.response?.output ?? [];
    for (const output of outputs) {
      const classes = output?.classes ?? [];
      for (const cls of classes) {
        if (cls.class === "ai_generated") {
          aiScore = cls.score ?? 0;
        } else if (cls.class === "not_ai_generated") {
          notAiScore = cls.score ?? 0;
        }
      }
    }
  }

  const isAI = aiScore > notAiScore;
  const confidence = Math.max(50, Math.min(99, Math.round((isAI ? aiScore : notAiScore) * 100)));

  if (isAI) {
    reasons.push(`Hive AI detection score: ${(aiScore * 100).toFixed(1)}%`);
    reasons.push("Pattern analysis flagged synthetic generation artifacts");
    reasons.push("Image characteristics match known AI model outputs");
  } else {
    reasons.push(`Hive authenticity score: ${(notAiScore * 100).toFixed(1)}%`);
    reasons.push("No synthetic generation patterns detected");
    reasons.push("Image characteristics consistent with camera capture");
  }

  return { model: "Hive AI", verdict: isAI ? "ai" : "human", confidence, reasons };
}

// ── Weighted consensus ───────────────────────────────────────────────
function computeConsensus(
  results: ModelResult[]
): { verdict: "ai" | "human"; confidence: number; reasons: string[]; tips: string[] } {
  // Weights: Hive (purpose-built) = 0.45, GPT-5 = 0.30, Gemini = 0.25
  const weights: Record<string, number> = {
    "Hive AI": 0.45,
    "GPT-5": 0.30,
    "Gemini Flash": 0.25,
  };

  let aiWeightedScore = 0;
  let humanWeightedScore = 0;
  let totalWeight = 0;
  const allReasons: string[] = [];

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

  // Normalize
  if (totalWeight > 0) {
    aiWeightedScore /= totalWeight;
    humanWeightedScore /= totalWeight;
  }

  const verdict: "ai" | "human" = aiWeightedScore >= humanWeightedScore ? "ai" : "human";
  const confidence = Math.max(50, Math.min(99, Math.round(Math.max(aiWeightedScore, humanWeightedScore) * 100)));

  // Collect top reasons from the model closest to the consensus
  const aligned = results.filter((r) => r.verdict === verdict);
  for (const r of aligned) {
    for (const reason of r.reasons.slice(0, 2)) {
      allReasons.push(reason);
    }
  }

  // Agreement indicator
  const agreementCount = results.filter((r) => r.verdict === verdict).length;
  if (agreementCount === results.length) {
    allReasons.unshift(`All ${results.length} models agree: image is ${verdict === "ai" ? "AI-generated" : "human-created"}`);
  } else {
    allReasons.unshift(`${agreementCount}/${results.length} models lean ${verdict === "ai" ? "AI-generated" : "human-created"}`);
  }

  const tips = [
    "Check for inconsistencies in small details like fingers, text, or reflections",
    "Zoom in on edges and textures — AI often produces unnaturally smooth surfaces",
    "Look at the image metadata using an EXIF viewer for camera info",
    "Reverse image search to check for original sources",
  ];

  return { verdict, confidence, reasons: allReasons.slice(0, 5), tips };
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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const imageBytes = new Uint8Array(await imageFile.arrayBuffer());
    const base64Image = base64Encode(imageBytes);
    const mimeType = imageFile.type || "image/jpeg";
    const dataUrl = `data:${mimeType};base64,${base64Image}`;

    // Call all 3 models in parallel — each is resilient
    const [geminiResult, gpt5Result, hiveResult] = await Promise.allSettled([
      analyzeWithGemini(dataUrl, LOVABLE_API_KEY),
      analyzeWithGPT5(dataUrl, LOVABLE_API_KEY),
      analyzeWithHive(imageBytes, mimeType),
    ]);

    const successfulResults: ModelResult[] = [];
    const modelBreakdown: ModelResult[] = [];

    for (const r of [geminiResult, gpt5Result, hiveResult]) {
      if (r.status === "fulfilled") {
        successfulResults.push(r.value);
        modelBreakdown.push(r.value);
      } else {
        console.error("Model failed:", r.reason);
      }
    }

    if (successfulResults.length === 0) {
      return new Response(JSON.stringify({ error: "All analysis models failed" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const consensus = computeConsensus(successfulResults);

    return new Response(
      JSON.stringify({
        ...consensus,
        modelBreakdown,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("analyze-image error:", error);

    if (error.message?.includes("429") || error.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again shortly" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (error.message?.includes("402") || error.status === 402) {
      return new Response(JSON.stringify({ error: "AI usage limit reached" }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
