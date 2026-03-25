import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAIL = "jethrun@comcast.net";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify user is admin
    const userClient = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user || user.email !== ADMIN_EMAIL) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceKey);
    const url = new URL(req.url);
    const type = url.searchParams.get("type") || "all";

    const result: Record<string, unknown> = {};

    if (type === "all" || type === "contacts") {
      const { data: contacts, error: cErr } = await adminClient
        .from("contact_submissions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (cErr) throw cErr;
      result.contacts = contacts;
    }

    if (type === "all" || type === "emails") {
      const { data: emails, error: eErr } = await adminClient
        .from("email_send_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (eErr) throw eErr;
      result.emails = emails;
    }

    if (type === "all" || type === "feedback") {
      const { data: feedback, error: fErr } = await adminClient
        .from("feedback")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (fErr) throw fErr;
      result.feedback = feedback;
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
