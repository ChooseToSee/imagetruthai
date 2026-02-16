import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const imageFile = formData.get("image") as File;

    if (!imageFile) {
      return new Response(
        JSON.stringify({ error: "No image provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Reject files > 2 MB to stay within memory limits
    if (imageFile.size > 2 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: "Image too large. Please upload an image under 2 MB." }),
        { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Convert image to base64 using Deno std (more memory-efficient than manual btoa)
    const imageBytes = new Uint8Array(await imageFile.arrayBuffer());
    const base64Image = base64Encode(imageBytes);
    const mimeType = imageFile.type || "image/jpeg";
    const dataUrl = `data:${mimeType};base64,${base64Image}`;

    // Free the raw bytes
    // @ts-ignore - help GC
    const _ = imageBytes;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert forensic image analyst specializing in detecting AI-generated images. Analyze the provided image and determine whether it was created by AI or captured by a real camera/human.

You MUST respond with a JSON object using this exact tool call.`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this image. Is it AI-generated or a real photograph? Provide your verdict, confidence score, detailed forensic reasons, and verification tips.",
              },
              {
                type: "image_url",
                image_url: { url: dataUrl },
              },
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
                  verdict: {
                    type: "string",
                    enum: ["ai", "human"],
                    description: "Whether the image is AI-generated or human-made",
                  },
                  confidence: {
                    type: "number",
                    description: "Confidence score from 50 to 99",
                  },
                  reasons: {
                    type: "array",
                    items: { type: "string" },
                    description: "3-5 specific forensic reasons supporting the verdict",
                  },
                  tips: {
                    type: "array",
                    items: { type: "string" },
                    description: "3-4 actionable tips for the user to manually verify",
                  },
                },
                required: ["verdict", "confidence", "reasons", "tips"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "report_analysis" } },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error(`AI gateway error [${aiResponse.status}]: ${errText}`);

      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again shortly" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "AI analysis failed" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();

    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      console.error("No tool call in AI response:", JSON.stringify(aiData));
      return new Response(
        JSON.stringify({ error: "Could not parse AI analysis" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = JSON.parse(toolCall.function.arguments);
    result.confidence = Math.max(50, Math.min(99, Math.round(result.confidence)));

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("analyze-image error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
