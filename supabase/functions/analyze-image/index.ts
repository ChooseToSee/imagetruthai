import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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
  manipulation?: {
    edited: boolean;
    confidence: number;
    reasons: string[];
  };
}

// Sanitize error text to remove potential secrets/keys before logging
function sanitizeErrorText(text: string): string {
  return text
    .replace(/[A-Za-z0-9_\-]{20,}/g, "[REDACTED]")
    .replace(/key[=:]\s*\S+/gi, "key=[REDACTED]")
    .replace(/bearer\s+\S+/gi, "Bearer [REDACTED]")
    .replace(/api[_-]?key[=:]\s*\S+/gi, "api_key=[REDACTED]")
    .slice(0, 200);
}

// ── Winston AI ──────────────────────────────────────────────────────
async function analyzeWithWinston(
  imageUrlOrNull: string | null,
  imageBytes: Uint8Array,
  mimeType: string,
  apiKey: string
): Promise<ModelResult> {
  const normalizedApiKey = apiKey
    .trim()
    .replace(/^['"]|['"]$/g, "")
    .replace(/^(authorization:)?\s*bearer\s+/i, "")
    .replace(/^x-api-key:\s*/i, "")
    .replace(/^apikey:\s*/i, "");

  // Try URL-based first, fallback to base64
  let body: Record<string, unknown>;
  if (imageUrlOrNull) {
    body = { url: imageUrlOrNull };
    console.log("[Winston] Using URL mode");
  } else {
    const b64 = base64Encode(imageBytes);
    body = { image: `data:${mimeType};base64,${b64}` };
    console.log("[Winston] Using base64 mode (URL unavailable)");
  }

  const res = await fetch("https://api.gowinston.ai/v2/image-detection", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${normalizedApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const t = await res.text();
    console.error(`[Winston] API error [${res.status}]:`, sanitizeErrorText(t));
    throw new Error(`Winston analysis failed (${res.status})`);
  }

  const data = await res.json();
  console.log("[Winston] Response score:", data.score);

  const humanScore = data.score ?? 50;
  const aiScore = 100 - humanScore;
  const verdict: "ai" | "human" = aiScore >= 50 ? "ai" : "human";
  const confidence = Math.max(50, Math.min(99, Math.round(Math.max(aiScore, humanScore))));

  const reasons: string[] = [];
  if (verdict === "ai") {
    reasons.push(`Winston AI scored ${aiScore}% AI generation probability`);
    reasons.push("Trained on millions of AI-generated images with 99.98% claimed accuracy");
    reasons.push("Analyzes pixel patterns and metadata for synthetic generation signatures");
  } else {
    reasons.push(`Winston AI scored ${humanScore}% authentic probability`);
    reasons.push("Image characteristics consistent with real photographic capture");
    reasons.push("No AI generation patterns detected by Winston's classifier");
  }

  return { model: "Winston", verdict, confidence, reasons };
}

// ── SightEngine ─────────────────────────────────────────────────────
async function analyzeWithSightEngine(
  imageBytes: Uint8Array,
  mimeType: string,
  apiUser: string,
  apiSecret: string
): Promise<ModelResult> {
  const blob = new Blob([imageBytes], { type: mimeType });
  const formData = new FormData();
  formData.append("media", blob, "image.jpg");
  formData.append("models", "genai");
  formData.append("api_user", apiUser);
  formData.append("api_secret", apiSecret);

  const res = await fetch("https://api.sightengine.com/1.0/check.json", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const t = await res.text();
    console.error(`[SightEngine] API error [${res.status}]:`, sanitizeErrorText(t));
    throw new Error(`SightEngine analysis failed (${res.status})`);
  }

  const data = await res.json();

  if (data.status !== "success") {
    console.error("[SightEngine] Non-success status:", sanitizeErrorText(JSON.stringify(data)));
    throw new Error("SightEngine analysis returned non-success status");
  }

  const aiGenerated = data?.type?.ai_generated ?? 0.5;
  const confidence = Math.max(50, Math.min(99, Math.round(Math.max(aiGenerated, 1 - aiGenerated) * 100)));
  const verdict: "ai" | "human" = aiGenerated >= 0.5 ? "ai" : "human";

  const reasons: string[] = [];
  if (verdict === "ai") {
    reasons.push(`SightEngine scored ${(aiGenerated * 100).toFixed(1)}% AI generation probability`);
    reasons.push("Pixel-level analysis detected synthetic generation patterns");
    reasons.push("Purpose-trained classifier for diffusion and GAN detection");
  } else {
    reasons.push(`SightEngine scored ${((1 - aiGenerated) * 100).toFixed(1)}% authentic probability`);
    reasons.push("Image pixel patterns consistent with optical camera capture");
    reasons.push("No synthetic generation artifacts detected");
  }

  return { model: "SightEngine", verdict, confidence, reasons };
}

// ── SightEngine Quality Check (for edit detection) ──────────────────
async function checkSightEngineQuality(
  imageBytes: Uint8Array,
  mimeType: string,
  apiUser: string,
  apiSecret: string
): Promise<{ edited: boolean; confidence: number; reasons: string[] }> {
  console.log("[EditDetection] Starting SightEngine quality check...");
  const blob = new Blob([imageBytes], { type: mimeType });
  const formData = new FormData();
  formData.append("media", blob, "image.jpg");
  formData.append("models", "quality,properties");
  formData.append("api_user", apiUser);
  formData.append("api_secret", apiSecret);

  const res = await fetch("https://api.sightengine.com/1.0/check.json", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    console.error("[EditDetection] SightEngine quality error:", res.status);
    return { edited: false, confidence: 50, reasons: ["Quality check unavailable"] };
  }

  const data = await res.json();
  console.log("[EditDetection] SightEngine quality response status:", data.status);
  if (data.status !== "success") return { edited: false, confidence: 50, reasons: ["Quality check failed"] };

  const reasons: string[] = [];
  let editScore = 0;

  const hasExif = data?.media?.has_exif ?? false;
  const software = data?.media?.software ?? "";
  const metadataLimited = !hasExif;

  if (software && /photoshop|gimp|lightroom|affinity|snapseed/i.test(software)) {
    editScore += 40;
    reasons.push(`Editing software detected in metadata: ${software}`);
  }

  const quality = data?.quality?.score ?? -1;
  if (quality >= 0 && quality < 0.3) {
    editScore += 15;
    reasons.push("Low quality score may indicate heavy compression or editing");
  }

  // If editing indicators were found, confidence reflects how edited it is
  // If no indicators found, confidence reflects how unedited it is
  const edited = editScore >= 30;
  let confidence: number;
  if (edited) {
    // Editing detected: confidence scales with editScore (30-55 → 70-95%)
    confidence = Math.min(95, 60 + editScore);
  } else {
    // No editing detected: high confidence it's unmodified
    // With EXIF present and clean metadata → higher confidence
    confidence = metadataLimited ? 70 : 85;
  }

  if (reasons.length === 0) {
    reasons.push(
      metadataLimited
        ? "No strong editing indicators found; metadata is limited after export/share"
        : "No obvious editing indicators found in metadata or quality analysis"
    );
  }

  console.log("[EditDetection] SightEngine quality result: edited=", edited, "confidence=", confidence, "reasons=", reasons.length);
  return { edited, confidence, reasons };
}

// ── Direct Gemini Edit Detection ────────────────────────────────────
async function analyzeEditWithAI(
  imageBytes: Uint8Array,
  mimeType: string,
  apiKey: string
): Promise<{ edited: boolean; confidence: number; reasons: string[] }> {
  const b64 = base64Encode(imageBytes);
  const normalizedApiKey = apiKey.trim();

  console.log("[EditDetection] Starting Gemini analysis...");

  let res: Response;
  try {
    res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${normalizedApiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `You are a forensic image analyst. Analyze this image for any signs of editing or manipulation including: Photoshop edits, cloning, splicing, retouching, inpainting, face swapping, background replacement, color manipulation, or any other post-processing.

Return your analysis as JSON with exactly this structure:
{"edited": true/false, "confidence": 50-99, "reasons": ["reason1", "reason2", "reason3"]}

If you detect editing, explain specifically what was edited. If the image appears unedited, explain what indicates it is authentic.`,
              },
              {
                inlineData: { mimeType, data: b64 },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 1024,
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              edited: { type: "BOOLEAN" },
              confidence: { type: "NUMBER" },
              reasons: {
                type: "ARRAY",
                items: { type: "STRING" },
              },
            },
            required: ["edited", "confidence", "reasons"],
          },
        },
      }),
    });
  } catch (fetchErr: any) {
    console.error("[EditDetection] Fetch error:", sanitizeErrorText(fetchErr.message));
    return {
      edited: false,
      confidence: 50,
      reasons: ["Edit detection service temporarily unavailable"],
    };
  }

  if (!res.ok) {
    const errorBody = await res.text();
    console.error(`[EditDetection] Gemini API error [${res.status}]:`, sanitizeErrorText(errorBody));
    
    // If structured output fails, retry without responseSchema
    if (res.status === 400) {
      console.log("[EditDetection] Retrying without responseSchema...");
      return analyzeEditWithAIFallback(imageBytes, mimeType, normalizedApiKey);
    }
    
    return {
      edited: false,
      confidence: 50,
      reasons: ["Edit detection service temporarily unavailable"],
    };
  }

  const data = await res.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text || "").join("\n")?.trim() ?? "";
  console.log("[EditDetection] Raw response:", rawText.slice(0, 300));

  const parsed = parseEditAnalysisFromText(rawText);

  if (parsed) {
    console.log("[EditDetection] Parsed successfully, edited:", parsed.edited, "reasons:", parsed.reasons.length);
    return parsed;
  }

  console.warn("[EditDetection] Failed to parse structured response, trying fallback...");
  return analyzeEditWithAIFallback(imageBytes, mimeType, normalizedApiKey);
}

// Fallback without responseSchema (plain text prompt)
async function analyzeEditWithAIFallback(
  imageBytes: Uint8Array,
  mimeType: string,
  apiKey: string
): Promise<{ edited: boolean; confidence: number; reasons: string[] }> {
  const b64 = base64Encode(imageBytes);

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `Analyze this image for editing/manipulation signs. Reply with ONLY valid JSON, no markdown: {"edited": true_or_false, "confidence": 50_to_99, "reasons": ["reason1", "reason2"]}`,
            },
            { inlineData: { mimeType, data: b64 } },
          ],
        },
      ],
      generationConfig: { temperature: 0.1, maxOutputTokens: 512 },
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    console.error("[EditDetection Fallback] Error:", sanitizeErrorText(t));
    return { edited: false, confidence: 50, reasons: ["Edit analysis unavailable"] };
  }

  const data = await res.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text || "").join("\n")?.trim() ?? "";
  console.log("[EditDetection Fallback] Raw:", rawText.slice(0, 300));

  const parsed = parseEditAnalysisFromText(rawText);
  if (parsed) {
    return parsed;
  }

  return { edited: false, confidence: 55, reasons: ["Could not parse edit analysis response"] };
}

// Robust JSON parser
function parseJsonSafe(text: string): any | null {
  if (!text) return null;
  try { return JSON.parse(text); } catch {}

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)?.[1];
  if (fenced) { try { return JSON.parse(fenced.trim()); } catch {} }

  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first !== -1 && last > first) {
    try { return JSON.parse(text.slice(first, last + 1)); } catch {}
  }
  return null;
}

function parseEditAnalysisFromText(text: string): { edited: boolean; confidence: number; reasons: string[] } | null {
  const parsed = parseJsonSafe(text);
  if (parsed && typeof parsed === "object") {
    const edited = typeof parsed.edited === "boolean" ? parsed.edited : null;
    const confidenceRaw = Number(parsed.confidence);
    const reasonsRaw = Array.isArray(parsed.reasons) ? parsed.reasons : [];
    const reasons = reasonsRaw
      .filter((r: unknown) => typeof r === "string" && r.trim().length > 0)
      .map((r: string) => r.replace(/\s+/g, " ").trim())
      .slice(0, 5);

    if (edited !== null) {
      return {
        edited,
        confidence: Math.max(50, Math.min(99, Number.isFinite(confidenceRaw) ? confidenceRaw : 60)),
        reasons: reasons.length > 0 ? reasons : ["No strong visual manipulation indicators detected"],
      };
    }
  }

  const editedMatch = text.match(/"edited"\s*:\s*(true|false)/i);
  if (!editedMatch) return null;

  const confidenceMatch = text.match(/"confidence"\s*:\s*(\d{1,3})/i);
  const reasonsBlock = text.match(/"reasons"\s*:\s*\[([\s\S]*?)\]/i)?.[1] ?? "";

  const extractedReasons: string[] = [];
  for (const m of reasonsBlock.matchAll(/"([\s\S]*?)"/g)) {
    const cleaned = m[1].replace(/\\n/g, " ").replace(/\s+/g, " ").trim();
    if (cleaned.length > 0) extractedReasons.push(cleaned);
  }

  return {
    edited: editedMatch[1].toLowerCase() === "true",
    confidence: Math.max(50, Math.min(99, Number(confidenceMatch?.[1] ?? 60))),
    reasons: extractedReasons.slice(0, 5).length > 0 ? extractedReasons.slice(0, 5) : ["No strong visual manipulation indicators detected"],
  };
}

// ── Hive VLM Edit/Deepfake Detection ────────────────────────────────
async function analyzeEditWithHive(
  imageBytes: Uint8Array,
  mimeType: string,
  apiKey: string
): Promise<{ edited: boolean; confidence: number; reasons: string[] }> {
  console.log("[EditDetection] Starting HiveVLM edit analysis...");
  const b64 = base64Encode(imageBytes);
  const dataUrl = `data:${mimeType};base64,${b64}`;

  const normalizedApiKey = apiKey.trim().replace(/^['"]|['"]$/g, "");

  let res: Response;
  try {
    res = await fetch("https://api.thehive.ai/api/v3/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${normalizedApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "hive/moderation-11b-vision-language-model",
        max_tokens: 512,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `You are a forensic image analyst. Examine this image for signs of editing or manipulation including: cloning, splicing, retouching, inpainting, face swapping, background replacement, or color manipulation.\n\nReturn ONLY valid JSON with no markdown:\n{"edited": true_or_false, "confidence": 50_to_99, "reasons": ["reason1", "reason2", "reason3"]}`,
              },
              {
                type: "image_url",
                image_url: { url: dataUrl },
              },
            ],
          },
        ],
      }),
    });
  } catch (fetchErr: any) {
    console.error("[HiveVLM] Fetch error:", sanitizeErrorText(fetchErr.message));
    return { edited: false, confidence: 50, reasons: ["Hive analysis temporarily unavailable"] };
  }

  if (!res.ok) {
    const t = await res.text();
    console.error(`[HiveVLM] API error [${res.status}]:`, sanitizeErrorText(t));
    return { edited: false, confidence: 50, reasons: [`Hive analysis failed (${res.status})`] };
  }

  const data = await res.json();
  const rawText = data?.choices?.[0]?.message?.content?.trim() ?? "";
  console.log("[HiveVLM] Raw response:", rawText.slice(0, 300));

  const parsed = parseEditAnalysisFromText(rawText);
  if (parsed) {
    console.log("[HiveVLM] Parsed successfully, edited:", parsed.edited, "confidence:", parsed.confidence);
    return parsed;
  }

  return { edited: false, confidence: 50, reasons: ["Could not parse Hive response"] };
}

// ── AI or Not ───────────────────────────────────────────────────────
async function analyzeWithAIorNot(
  imageBytes: Uint8Array,
  mimeType: string,
  apiKey: string
): Promise<ModelResult> {
  const blob = new Blob([imageBytes], { type: mimeType });
  const formData = new FormData();
  formData.append("image", blob, "image.jpg");
  formData.append("only", "ai_generated");

  const res = await fetch("https://api.aiornot.com/v2/image/sync", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  });

  if (!res.ok) {
    const t = await res.text();
    console.error(`[AI or Not] API error [${res.status}]:`, sanitizeErrorText(t));
    throw new Error(`AI or Not analysis failed (${res.status})`);
  }

  const data = await res.json();

  const report = data?.report?.ai_generated;
  if (!report) {
    throw new Error("AI or Not returned no ai_generated report");
  }

  const verdictRaw = report.verdict;
  const aiConf = report.ai?.confidence ?? 0.5;
  const humanConf = report.human?.confidence ?? 0.5;

  const verdict: "ai" | "human" = verdictRaw === "ai" ? "ai" : "human";
  const rawConf = verdict === "ai" ? aiConf : humanConf;
  const confidence = Math.max(50, Math.min(99, Math.round(rawConf * 100)));

  const reasons: string[] = [];

  const generator = report.generator;
  let topGenerator = "";
  if (generator && typeof generator === "object") {
    let maxScore = 0;
    for (const [name, score] of Object.entries(generator)) {
      if (typeof score === "number" && score > maxScore) {
        maxScore = score;
        topGenerator = name;
      }
    }
  }

  if (verdict === "ai") {
    reasons.push(`AI or Not verdict: AI-generated with ${(aiConf * 100).toFixed(1)}% confidence`);
    if (topGenerator) reasons.push(`Top suspected generator: ${topGenerator.replace(/_/g, " ")}`);
    reasons.push("Specialized classifier trained to identify AI synthesis patterns");
  } else {
    reasons.push(`AI or Not verdict: Human-created with ${(humanConf * 100).toFixed(1)}% confidence`);
    reasons.push("Image characteristics match authentic photographic content");
    reasons.push("No AI generator signatures detected");
  }

  return { model: "AI or Not", verdict, confidence, reasons };
}

// ── Weighted consensus ───────────────────────────────────────────────
function computeConsensus(results: ModelResult[], expectedTotal = results.length) {
  const weights: Record<string, number> = {
    Winston: 0.40,
    SightEngine: 0.30,
    "AI or Not": 0.30,
  };

  let aiWeightedScore = 0;
  let humanWeightedScore = 0;
  let totalWeight = 0;

  for (const r of results) {
    const w = weights[r.model] ?? 0.30;
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

  const agreementCount = aligned.length;
  if (agreementCount === expectedTotal && expectedTotal > 0) {
    allReasons.unshift(`All ${expectedTotal} classifiers agree: image is ${verdict === "ai" ? "AI-generated" : "human-created"}`);
  } else {
    allReasons.unshift(`${agreementCount}/${expectedTotal} classifiers currently lean ${verdict === "ai" ? "AI-generated" : "human-created"}`);
  }

  const tips = [
    "These results are from purpose-trained classifiers, not general AI models",
    "Reverse image search to check for original sources",
    "Check for metadata like EXIF camera info using an EXIF viewer",
    "No single detector is 100% accurate — use results as guidance",
  ];

  return { verdict, confidence, reasons: allReasons.slice(0, 5), tips };
}

// ── Compute manipulation consensus ──────────────────────────────────
function computeManipulation(editResults: { edited: boolean; confidence: number; reasons: string[] }[]) {
  if (editResults.length === 0) return undefined;

  let editScore = 0;
  let totalWeight = 0;
  const allReasons: string[] = [];

  for (const r of editResults) {
    const w = 1;
    totalWeight += w;
    // editScore: 0 = definitely not edited, 1 = definitely edited
    if (r.edited) {
      editScore += (r.confidence / 100) * w;
    } else {
      // Not edited with high confidence → low edit score
      editScore += (1 - r.confidence / 100) * w;
    }
    allReasons.push(...r.reasons.slice(0, 2));
  }

  editScore = totalWeight > 0 ? editScore / totalWeight : 0.5;
  const edited = editScore >= 0.5;
  const confidence = Math.max(50, Math.min(99, Math.round(Math.max(editScore, 1 - editScore) * 100)));

  const tips = [
    "Check EXIF data for editing software markers",
    "Look for inconsistent lighting, shadows, or perspective",
    "Zoom in to edges for signs of cloning or splicing",
    "Compare noise grain patterns across different areas",
  ];

  return { edited, confidence, reasons: allReasons.slice(0, 5), tips };
}

// ── Main handler ─────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Early Content-Length check before reading body
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > 3 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: "Request too large. Please upload an image under 2 MB." }),
        { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    const WINSTON_API_KEY = Deno.env.get("WINSTON_API_KEY");
    const SIGHTENGINE_API_USER = Deno.env.get("SIGHTENGINE_API_USER");
    const SIGHTENGINE_API_SECRET = Deno.env.get("SIGHTENGINE_API_SECRET");
    const AIORNOT_API_KEY = Deno.env.get("AIORNOT_API_KEY");
    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    const HIVE_API_KEY = Deno.env.get("HIVE_API_KEY");

    const imageBytes = new Uint8Array(await imageFile.arrayBuffer());
    const mimeType = imageFile.type || "image/jpeg";

    const wantsStream = req.headers.get("x-stream") === "true";

    // Upload image to temp storage for Winston (needs a public URL)
    let tempImageUrl: string | null = null;
    let tempImagePath: string | null = null;
    if (WINSTON_API_KEY) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const sb = createClient(supabaseUrl, supabaseServiceKey);
        const ext = mimeType.split("/")[1] || "jpg";
        tempImagePath = `temp/${crypto.randomUUID()}.${ext}`;
        console.log("[Winston] Uploading temp image:", tempImagePath);
        const { error: uploadErr } = await sb.storage
          .from("scan-images")
          .upload(tempImagePath, imageBytes, { contentType: mimeType, upsert: true });
        if (!uploadErr) {
          const { data: urlData } = sb.storage.from("scan-images").getPublicUrl(tempImagePath);
          tempImageUrl = urlData.publicUrl;
          console.log("[Winston] Temp URL ready:", tempImageUrl?.slice(0, 80));
        } else {
          console.error("[Winston] Temp upload failed:", JSON.stringify(uploadErr));
        }
      } catch (e) {
        console.error("[Winston] Temp upload exception:", (e as Error).message);
      }
    }

    // Build AI detection tasks
    type ModelTask = { run: () => Promise<ModelResult>; label: string };
    const tasks: ModelTask[] = [];

    if (WINSTON_API_KEY) {
      tasks.push({
        label: "Winston",
        run: () => analyzeWithWinston(tempImageUrl, imageBytes, mimeType, WINSTON_API_KEY),
      });
    }
    if (SIGHTENGINE_API_USER && SIGHTENGINE_API_SECRET) {
      tasks.push({
        label: "SightEngine",
        run: () => analyzeWithSightEngine(imageBytes, mimeType, SIGHTENGINE_API_USER, SIGHTENGINE_API_SECRET),
      });
    }
    if (AIORNOT_API_KEY) {
      tasks.push({
        label: "AI or Not",
        run: () => analyzeWithAIorNot(imageBytes, mimeType, AIORNOT_API_KEY),
      });
    }

    if (tasks.length === 0) {
      return new Response(JSON.stringify({ error: "No API keys configured for any detection service" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build edit detection tasks
    type EditResult = { edited: boolean; confidence: number; reasons: string[] };
    type EditTask = { run: () => Promise<EditResult>; label: string };
    const editTasks: EditTask[] = [];

    if (SIGHTENGINE_API_USER && SIGHTENGINE_API_SECRET) {
      editTasks.push({
        label: "SightEngine",
        run: () => checkSightEngineQuality(imageBytes, mimeType, SIGHTENGINE_API_USER, SIGHTENGINE_API_SECRET),
      });
    }
    if (GOOGLE_AI_API_KEY) {
      editTasks.push({
        label: "Gemini",
        run: () => analyzeEditWithAI(imageBytes, mimeType, GOOGLE_AI_API_KEY),
      });
    }
    if (HIVE_API_KEY) {
      editTasks.push({
        label: "Hive",
        run: () => analyzeEditWithHive(imageBytes, mimeType, HIVE_API_KEY),
      });
    }

    const attachEditToModels = (models: ModelResult[], edits: { label: string; result: EditResult }[]) => {
      for (const edit of edits) {
        // Try to find matching model by label prefix
        const match = models.find(m => m.model.startsWith(edit.label));
        if (match) {
          match.manipulation = edit.result;
        } else {
          // Add as a new entry with manipulation data only
          models.push({
            model: edit.label,
            verdict: "human",
            confidence: 0,
            reasons: [],
            manipulation: edit.result,
          });
        }
      }
    };

    // Helper to clean up temp image with retry
    const cleanupTemp = async () => {
      if (!tempImagePath) return;
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const sb = createClient(supabaseUrl, supabaseServiceKey);
      const maxRetries = 3;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const { error } = await sb.storage.from("scan-images").remove([tempImagePath]);
          if (error) throw error;
          return; // success
        } catch (e) {
          console.error(`Temp cleanup attempt ${attempt}/${maxRetries} failed:`, e);
          if (attempt < maxRetries) {
            await new Promise((r) => setTimeout(r, 500 * attempt));
          }
        }
      }
      console.error(`CRITICAL: Failed to clean up temp image after ${maxRetries} attempts: ${tempImagePath}`);
    };

    if (!wantsStream) {
      // Run AI detection and edit detection in parallel
      const [aiResults, editResults] = await Promise.all([
        Promise.allSettled(tasks.map((t) => t.run())),
        Promise.allSettled(editTasks.map((t) => t.run())),
      ]);

      const successfulResults: ModelResult[] = [];
      for (const r of aiResults) {
        if (r.status === "fulfilled") successfulResults.push(r.value);
        else console.error("Model failed:", r.reason);
      }

      const successfulEdits: { label: string; result: { edited: boolean; confidence: number; reasons: string[] } }[] = [];
      for (let i = 0; i < editResults.length; i++) {
        const r = editResults[i];
        if (r.status === "fulfilled") successfulEdits.push({ label: editTasks[i].label, result: r.value });
        else console.error("Edit check failed:", r.reason);
      }

      if (successfulResults.length === 0) {
        return new Response(JSON.stringify({ error: "All detection services failed." }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const consensus = computeConsensus(successfulResults, tasks.length);
      const manipulation = computeManipulation(successfulEdits.map(e => e.result));
      attachEditToModels(successfulResults, successfulEdits);

      await cleanupTemp();

      return new Response(
        JSON.stringify({ ...consensus, modelBreakdown: successfulResults, manipulation }),
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
        const labeledEdits: { label: string; result: { edited: boolean; confidence: number; reasons: string[] } }[] = [];

        // Run edit detection in background
        const editPromise = Promise.allSettled(editTasks.map(async (task) => {
          try {
            const result = await task.run();
            labeledEdits.push({ label: task.label, result });
          } catch (err) {
            console.error(`${task.label} edit failed:`, err);
          }
        }));

        // Stream AI detection results
        const aiPromises = tasks.map(async (task) => {
          try {
            const result = await task.run();
            successfulResults.push(result);

            send("model", result);

            const interim = computeConsensus([...successfulResults], tasks.length);
            send("consensus", {
              ...interim,
              modelBreakdown: [...successfulResults],
              modelsCompleted: successfulResults.length,
              modelsTotal: tasks.length,
            });
          } catch (err) {
            console.error(`${task.label} failed:`, err);
            send("model_error", { model: task.label, error: (err as Error).message });
          }
        });

        await Promise.allSettled(aiPromises);
        await editPromise;

        if (successfulResults.length === 0) {
          send("error", { error: "All detection services failed" });
        } else {
          const final = computeConsensus(successfulResults, tasks.length);
          const manipulation = computeManipulation(labeledEdits.map(e => e.result));
          attachEditToModels(successfulResults, labeledEdits);
          send("done", { ...final, modelBreakdown: successfulResults, manipulation });
        }

        await cleanupTemp();
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

    if ((error as any).message?.includes("429") || (error as any).status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again shortly" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ error: "Analysis failed. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
