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

// ── Winston AI ──────────────────────────────────────────────────────
async function analyzeWithWinston(
  imageUrl: string,
  apiKey: string
): Promise<ModelResult> {
  const res = await fetch("https://api.gowinston.ai/v2/image-detection", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url: imageUrl }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Winston error [${res.status}]: ${t}`);
  }

  const data = await res.json();

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

// ── SightEngine Quality Check (for edit detection) ──────────────────
async function checkSightEngineQuality(
  imageBytes: Uint8Array,
  mimeType: string,
  apiUser: string,
  apiSecret: string
): Promise<{ edited: boolean; confidence: number; reasons: string[] }> {
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

  if (!res.ok) return { edited: false, confidence: 50, reasons: ["Quality check unavailable"] };

  const data = await res.json();
  if (data.status !== "success") return { edited: false, confidence: 50, reasons: ["Quality check failed"] };

  const reasons: string[] = [];
  let editScore = 0;

  // Check for signs of editing from quality/properties
  const hasExif = data?.media?.has_exif ?? false;
  const software = data?.media?.software ?? "";

  if (!hasExif) {
    editScore += 20;
    reasons.push("No EXIF metadata found — may indicate post-processing");
  }
  if (software && /photoshop|gimp|lightroom|affinity|snapseed/i.test(software)) {
    editScore += 40;
    reasons.push(`Editing software detected in metadata: ${software}`);
  }

  // Quality anomalies
  const quality = data?.quality?.score ?? -1;
  if (quality >= 0 && quality < 0.3) {
    editScore += 15;
    reasons.push("Low quality score may indicate heavy compression or editing");
  }

  const edited = editScore >= 30;
  const confidence = Math.max(50, Math.min(95, 50 + editScore));

  if (reasons.length === 0) {
    reasons.push("No obvious editing indicators found in metadata or quality analysis");
  }

  return { edited, confidence, reasons };
}

// ── AI Gateway Edit Detection ───────────────────────────────────────
async function analyzeEditWithAI(
  imageBytes: Uint8Array,
  mimeType: string,
  apiKey: string
): Promise<{ edited: boolean; confidence: number; reasons: string[] }> {
  const b64 = base64Encode(imageBytes);

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this image for signs of editing or manipulation (Photoshop, splicing, cloning, retouching, AI inpainting). Respond ONLY with valid JSON: {"edited": boolean, "confidence": number (50-99), "reasons": ["reason1", "reason2", "reason3"]}. Be conservative — only flag as edited if you see clear evidence.`,
            },
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${b64}` },
            },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`AI gateway error: ${res.status}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content ?? "";

  // Extract JSON from response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON in AI response");

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    edited: !!parsed.edited,
    confidence: Math.max(50, Math.min(99, parsed.confidence ?? 60)),
    reasons: Array.isArray(parsed.reasons) ? parsed.reasons.slice(0, 4) : ["Analysis complete"],
  };
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
    throw new Error(`AI or Not error [${res.status}]: ${t}`);
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
function computeConsensus(results: ModelResult[]) {
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
    if (r.edited) {
      editScore += (r.confidence / 100) * w;
    } else {
      editScore += ((100 - r.confidence) / 100) * w;
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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    const imageBytes = new Uint8Array(await imageFile.arrayBuffer());
    const mimeType = imageFile.type || "image/jpeg";

    const wantsStream = req.headers.get("x-stream") === "true";

    // Upload image to temp storage for Winston (needs a public URL)
    let tempImageUrl: string | null = null;
    let tempImagePath: string | null = null;
    if (WINSTON_API_KEY) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const sb = createClient(supabaseUrl, supabaseServiceKey);
      const ext = mimeType.split("/")[1] || "jpg";
      tempImagePath = `temp/${crypto.randomUUID()}.${ext}`;
      const { error: uploadErr } = await sb.storage
        .from("scan-images")
        .upload(tempImagePath, imageBytes, { contentType: mimeType, upsert: true });
      if (!uploadErr) {
        const { data: urlData } = sb.storage.from("scan-images").getPublicUrl(tempImagePath);
        tempImageUrl = urlData.publicUrl;
      } else {
        console.error("Temp upload for Winston failed:", uploadErr);
      }
    }

    // Build AI detection tasks
    type ModelTask = { run: () => Promise<ModelResult>; label: string };
    const tasks: ModelTask[] = [];

    if (WINSTON_API_KEY && tempImageUrl) {
      tasks.push({
        label: "Winston",
        run: () => analyzeWithWinston(tempImageUrl!, WINSTON_API_KEY),
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
    type EditTask = { run: () => Promise<{ edited: boolean; confidence: number; reasons: string[] }>; label: string };
    const editTasks: EditTask[] = [];

    if (SIGHTENGINE_API_USER && SIGHTENGINE_API_SECRET) {
      editTasks.push({
        label: "SightEngine Quality",
        run: () => checkSightEngineQuality(imageBytes, mimeType, SIGHTENGINE_API_USER, SIGHTENGINE_API_SECRET),
      });
    }
    if (LOVABLE_API_KEY) {
      editTasks.push({
        label: "AI Vision",
        run: () => analyzeEditWithAI(imageBytes, mimeType, LOVABLE_API_KEY),
      });
    }

    // Helper to clean up temp image
    const cleanupTemp = async () => {
      if (tempImagePath) {
        try {
          const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
          const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
          const sb = createClient(supabaseUrl, supabaseServiceKey);
          await sb.storage.from("scan-images").remove([tempImagePath]);
        } catch (e) { console.error("Temp cleanup failed:", e); }
      }
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

      const successfulEdits: { edited: boolean; confidence: number; reasons: string[] }[] = [];
      for (const r of editResults) {
        if (r.status === "fulfilled") successfulEdits.push(r.value);
        else console.error("Edit check failed:", r.reason);
      }

      if (successfulResults.length === 0) {
        return new Response(JSON.stringify({ error: "All detection services failed." }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const consensus = computeConsensus(successfulResults);
      const manipulation = computeManipulation(successfulEdits);

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
        const successfulEdits: { edited: boolean; confidence: number; reasons: string[] }[] = [];

        // Run edit detection in background
        const editPromise = Promise.allSettled(editTasks.map(async (task) => {
          try {
            const result = await task.run();
            successfulEdits.push(result);
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

            const interim = computeConsensus([...successfulResults]);
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
          const final = computeConsensus(successfulResults);
          const manipulation = computeManipulation(successfulEdits);
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
      JSON.stringify({ error: (error as Error).message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
