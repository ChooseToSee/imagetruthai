// Nightly backup of key tables -> JSON file uploaded to Google Drive
// Uses Drive `drive.file` scope (only sees files this app creates).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DRIVE_GATEWAY = "https://connector-gateway.lovable.dev/google_drive";
const FOLDER_NAME = "ImageTruth AI Backups";

// Tables to back up (whole-table snapshot, no PII filtering — your own data).
const TABLES = [
  "profiles",
  "scan_history",
  "shared_reports",
  "consent_logs",
  "contact_submissions",
  "feedback",
  "email_send_log",
  "suppressed_emails",
  "email_unsubscribe_tokens",
];

async function findOrCreateFolder(headers: HeadersInit): Promise<string> {
  const q = encodeURIComponent(
    `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
  );
  const search = await fetch(`${DRIVE_GATEWAY}/drive/v3/files?q=${q}&fields=files(id,name)`, { headers });
  const searchData = await search.json();
  if (search.ok && searchData.files?.length) return searchData.files[0].id;

  const create = await fetch(`${DRIVE_GATEWAY}/drive/v3/files?fields=id`, {
    method: "POST",
    headers: { ...headers as Record<string, string>, "Content-Type": "application/json" },
    body: JSON.stringify({ name: FOLDER_NAME, mimeType: "application/vnd.google-apps.folder" }),
  });
  const created = await create.json();
  if (!create.ok) throw new Error(`Folder create failed: ${JSON.stringify(created)}`);
  return created.id;
}

async function uploadJson(headers: HeadersInit, folderId: string, fileName: string, body: string) {
  const boundary = "lovable_boundary_" + crypto.randomUUID();
  const metadata = { name: fileName, parents: [folderId] };
  const multipart =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: application/json\r\n\r\n` +
    `${body}\r\n` +
    `--${boundary}--`;

  const res = await fetch(
    `${DRIVE_GATEWAY}/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink`,
    {
      method: "POST",
      headers: { ...headers as Record<string, string>, "Content-Type": `multipart/related; boundary=${boundary}` },
      body: multipart,
    },
  );
  const data = await res.json();
  if (!res.ok) throw new Error(`Upload failed: ${JSON.stringify(data)}`);
  return data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GOOGLE_DRIVE_API_KEY = Deno.env.get("GOOGLE_DRIVE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");
    if (!GOOGLE_DRIVE_API_KEY) throw new Error("GOOGLE_DRIVE_API_KEY not configured (link Google Drive connector)");
    if (!SUPABASE_URL || !SERVICE_KEY) throw new Error("Supabase service credentials missing");

    // Authorization: only the service role (cron / admin) may trigger a full backup.
    // The caller must present the service-role key as a Bearer token.
    const authHeader = req.headers.get("authorization") ?? req.headers.get("Authorization") ?? "";
    const presented = authHeader.toLowerCase().startsWith("bearer ")
      ? authHeader.slice(7).trim()
      : "";
    // Constant-time-ish length check first to avoid early-return shape leak
    if (!presented || presented.length !== SERVICE_KEY.length || presented !== SERVICE_KEY) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }


    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const snapshot: Record<string, unknown> = {
      generated_at: new Date().toISOString(),
      tables: {} as Record<string, unknown>,
    };

    for (const table of TABLES) {
      const { data, error } = await supabase.from(table).select("*");
      (snapshot.tables as Record<string, unknown>)[table] = error
        ? { error: error.message, rows: [] }
        : { count: data?.length ?? 0, rows: data ?? [] };
    }

    const driveHeaders = {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": GOOGLE_DRIVE_API_KEY,
    };

    const folderId = await findOrCreateFolder(driveHeaders);
    const date = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `imagetruth-backup-${date}.json`;
    const uploaded = await uploadJson(driveHeaders, folderId, fileName, JSON.stringify(snapshot, null, 2));

    return new Response(
      JSON.stringify({
        success: true,
        file: uploaded,
        tables: Object.fromEntries(
          Object.entries(snapshot.tables as Record<string, { count?: number; error?: string }>).map(
            ([k, v]) => [k, v.count ?? `error: ${v.error}`],
          ),
        ),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("backup-to-drive error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
