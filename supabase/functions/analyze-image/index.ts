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
  manipulation?: {
    edited: boolean;
    confidence: number;
    reasons: string[];
  };
}

// ── Hive Moderation ─────────────────────────────────────────────────
async function analyzeWithHive(
  imageBytes: Uint8Array,
  mimeType: string,
  apiKey: string
): Promise<ModelResult> {
  const blob = new Blob([imageBytes], { type: mimeType });
  const formData = new FormData();
  formData.append("media", blob, "image.jpg");

  const res = await fetch("https://api.hivemoderation.com/api/v2/task/sync", {
    method: "POST",
    headers: { authorization: `token ${apiKey}` },
    body: formData,
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Hive error [${res.status}]: ${t}`);
  }

  const data = await res.json();

  // Parse Hive response: status[0].response.output[0].classes
  const output = data?.status?.[0]?.response?.output;
  if (!output || output.length === 0) {
    throw new Error("Hive returned no output");
  }

  let aiScore = 0.5;
  let source = "";
  const reasons: string[] = [];

  for (const item of output) {
    const classes = item.classes || [];
    for (const cls of classes) {
      if (cls.class === "ai_generated" && cls.score !== undefined) {
        aiScore = cls.score;
      }
      if (cls.class === "not_ai_generated" && cls.score !== undefined) {
        // Complementary score, but ai_generated is primary
      }
      // Source identification (Midjourney, DALL-E, etc.)
      if (
        cls.class !== "ai_generated" &&
        cls.class !== "not_ai_generated" &&
        cls.score > 0.3
      ) {
        source = cls.class;
      }
    }
  }

  const confidence = Math.max(50, Math.min(99, Math.round(Math.max(aiScore, 1 - aiScore) * 100)));
  const verdict: "ai" | "human" = aiScore >= 0.5 ? "ai" : "human";

  if (verdict === "ai") {
    reasons.push(`Hive classifier detected ${(aiScore * 100).toFixed(1)}% AI generation probability`);
    if (source) reasons.push(`Likely source identified: ${source}`);
    reasons.push("CNN-based detection trained on millions of AI-generated images");
  } else {
    reasons.push(`Hive classifier detected ${((1 - aiScore) * 100).toFixed(1)}% probability of authentic origin`);
    reasons.push("Image characteristics consistent with real camera capture");
    reasons.push("No AI generation patterns detected by Hive's neural network");
  }

  return { model: "Hive", verdict, confidence, reasons };
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
    throw new Error(`SightEngine error [${res.status}]: ${t}`);
  }

  const data = await res.json();

  if (data.status !== "success") {
    throw new Error(`SightEngine failed: ${JSON.stringify(data)}`);
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

// ── AI or Not ───────────────────────────────────────────────────────
async function analyzeWithAIorNot(
  imageBytes: Uint8Array,
  mimeType: string,
  apiKey: string
): Promise<ModelResult> {
  const blob = new Blob([imageBytes], { type: mimeType });
  const formData = new FormData();
  formData.append("image", blob, "image.jpg");
  // Only request ai_generated report for speed
  formData.append("only", "ai_generated");

  const res = await fetch("https://api.aiornot.com/v2/image/sync", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`AI or Not error [${res.status}]: ${t}`);
  }

  const data = await res.json();

  const report = data?.report?.ai_generated;
  if (!report) {
    throw new Error("AI or Not returned no ai_generated report");
  }

  const verdictRaw = report.verdict; // "ai" or "human"
  const aiConf = report.ai?.confidence ?? 0.5;
  const humanConf = report.human?.confidence ?? 0.5;

  const verdict: "ai" | "human" = verdictRaw === "ai" ? "ai" : "human";
  const rawConf = verdict === "ai" ? aiConf : humanConf;
  const confidence = Math.max(50, Math.min(99, Math.round(rawConf * 100)));

  const reasons: string[] = [];

  // Extract generator info
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
function computeConsensus(results: ModelResult[]) {
  const weights: Record<string, number> = {
    Hive: 0.40,
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
  if (agreementCount === results.length) {
    allReasons.unshift(`All ${results.length} classifiers agree: image is ${verdict === "ai" ? "AI-generated" : "human-created"}`);
  } else {
    allReasons.unshift(`${agreementCount}/${results.length} classifiers lean ${verdict === "ai" ? "AI-generated" : "human-created"}`);
  }

  const tips = [
    "These results are from purpose-trained classifiers, not general AI models",
    "Reverse image search to check for original sources",
    "Check for metadata like EXIF camera info using an EXIF viewer",
    "No single detector is 100% accurate — use results as guidance",
  ];

  return {
    verdict,
    confidence,
    reasons: allReasons.slice(0, 5),
    tips,
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

    const HIVE_API_KEY = Deno.env.get("HIVE_API_KEY");
    const SIGHTENGINE_API_USER = Deno.env.get("SIGHTENGINE_API_USER");
    const SIGHTENGINE_API_SECRET = Deno.env.get("SIGHTENGINE_API_SECRET");
    const AIORNOT_API_KEY = Deno.env.get("AIORNOT_API_KEY");

    const imageBytes = new Uint8Array(await imageFile.arrayBuffer());
    const mimeType = imageFile.type || "image/jpeg";

    const wantsStream = req.headers.get("x-stream") === "true";

    // Build model tasks based on available keys
    type ModelTask = { run: () => Promise<ModelResult>; label: string };
    const tasks: ModelTask[] = [];

    if (HIVE_API_KEY) {
      tasks.push({
        label: "Hive",
        run: () => analyzeWithHive(imageBytes, mimeType, HIVE_API_KEY),
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

    if (!wantsStream) {
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
        return new Response(JSON.stringify({ error: "All detection services failed. Please check your API keys." }), {
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
          send("error", { error: "All detection services failed" });
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
