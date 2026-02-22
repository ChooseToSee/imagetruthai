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
  manipulation: {
    edited: boolean;
    confidence: number;
    reasons: string[];
  };
}

const TOOL_SCHEMA = {
  type: "function",
  function: {
    name: "report_analysis",
    description: "Report the combined AI detection and manipulation analysis result",
    parameters: {
      type: "object",
      properties: {
        verdict: { type: "string", enum: ["ai", "human"] },
        confidence: { type: "number", description: "50-99" },
        reasons: {
          type: "array",
          items: { type: "string" },
          description: "3-5 forensic reasons for AI vs human verdict",
        },
        manipulation: {
          type: "object",
          properties: {
            edited: { type: "boolean", description: "Whether the image has been edited/manipulated" },
            confidence: { type: "number", description: "50-99" },
            reasons: {
              type: "array",
              items: { type: "string" },
              description: "3-5 reasons for manipulation verdict",
            },
          },
          required: ["edited", "confidence", "reasons"],
          additionalProperties: false,
        },
      },
      required: ["verdict", "confidence", "reasons", "manipulation"],
      additionalProperties: false,
    },
  },
};

const SYSTEM_PROMPT =
  "You are an expert forensic image analyst specializing in two tasks: (1) detecting AI-generated images vs real photographs, and (2) detecting image manipulation/editing (Photoshop, filters, splicing, clone stamping, content-aware fill, etc.). Respond only via the provided tool.";

const USER_PROMPT =
  "Analyze this image for TWO things:\n1. AI DETECTION: Is this image AI-generated or a real photograph? Provide your verdict, confidence score (50-99), and 3-5 specific forensic reasons.\n2. MANIPULATION DETECTION: Has this image been edited or manipulated by an image editor (e.g., Photoshop, retouching, splicing, filters, clone stamping, content-aware fill)? Look for inconsistent lighting, JPEG compression artifacts, cloned regions, unnatural edges, mismatched noise patterns, and metadata anomalies. Provide edited (true/false), confidence (50-99), and 3-5 reasons.";

async function analyzeWithModel(
  model: string,
  modelLabel: string,
  systemOverride: string | null,
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
      model,
      messages: [
        { role: "system", content: systemOverride ?? SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: USER_PROMPT },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
      tools: [TOOL_SCHEMA],
      tool_choice: { type: "function", function: { name: "report_analysis" } },
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`${modelLabel} error [${res.status}]: ${t}`);
  }

  const data = await res.json();
  const args = JSON.parse(data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments ?? "{}");

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

  // --- AI detection consensus ---
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

    const [geminiResult, gpt5Result, geminiProResult] = await Promise.allSettled([
      analyzeWithModel("google/gemini-2.5-flash", "Gemini Flash", null, dataUrl, LOVABLE_API_KEY),
      analyzeWithModel("openai/gpt-5", "GPT-5", null, dataUrl, LOVABLE_API_KEY),
      analyzeWithModel("google/gemini-2.5-pro", "Gemini Pro",
        "You are an expert forensic image analyst specializing in detecting AI-generated images and image manipulation. You perform deep, methodical analysis. Respond only via the provided tool.",
        dataUrl, LOVABLE_API_KEY),
    ]);

    const successfulResults: ModelResult[] = [];
    const modelBreakdown: ModelResult[] = [];

    for (const r of [geminiResult, gpt5Result, geminiProResult]) {
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
