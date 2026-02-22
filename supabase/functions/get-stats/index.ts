import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    return new Response(
      JSON.stringify({
        totalScans: totalScans ?? 0,
        uniqueUsers,
        avgAccuracy,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Stats error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to fetch stats" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
