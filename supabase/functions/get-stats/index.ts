import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Simple in-memory cache (persists across warm invocations)
let cachedResponse: { data: string; timestamp: number } | null = null;
const CACHE_TTL_MS = 60_000; // 1 minute

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow GET
  if (req.method !== "GET" && req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Return cached response if fresh
    if (cachedResponse && Date.now() - cachedResponse.timestamp < CACHE_TTL_MS) {
      return new Response(cachedResponse.data, {
        headers: { ...corsHeaders, "Content-Type": "application/json", "X-Cache": "HIT" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Total scans
    const { count: totalScans } = await supabase
      .from("scan_history")
      .select("*", { count: "exact", head: true });

    // Unique users
    const { data: usersData } = await supabase
      .from("scan_history")
      .select("user_id");

    const uniqueUsers = new Set(usersData?.map((r: any) => r.user_id) || []).size;

    // Average confidence
    const { data: confData } = await supabase
      .from("scan_history")
      .select("confidence");

    let avgAccuracy = 0;
    if (confData && confData.length > 0) {
      const sum = confData.reduce((a: number, r: any) => a + Number(r.confidence), 0);
      avgAccuracy = Math.round(sum / confData.length);
    }

    const responseData = JSON.stringify({
      totalScans: totalScans ?? 0,
      uniqueUsers,
      avgAccuracy,
    });

    // Cache the result
    cachedResponse = { data: responseData, timestamp: Date.now() };

    return new Response(responseData, {
      headers: { ...corsHeaders, "Content-Type": "application/json", "X-Cache": "MISS" },
    });
  } catch (err) {
    console.error("Stats error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to fetch stats" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
