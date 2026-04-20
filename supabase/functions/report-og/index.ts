import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://imagetruthai.com";
const DEFAULT_OG_IMAGE = `${SITE_URL}/share-image.png`;

const CRAWLER_PATTERNS = [
  "twitterbot",
  "facebookexternalhit",
  "facebot",
  "linkedinbot",
  "slackbot",
  "discordbot",
  "whatsapp",
  "telegrambot",
  "pinterest",
  "redditbot",
  "applebot",
  "googlebot",
  "bingbot",
  "embedly",
  "skypeuripreview",
  "vkshare",
  "quora link preview",
  "showyoubot",
  "outbrain",
  "tumblr",
  "bitlybot",
  "snapchat",
  "tiktokbot",
  "yandex",
  "baiduspider",
  "duckduckbot",
  "ia_archiver",
  "metaexternalagent",
];

function isCrawler(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return CRAWLER_PATTERNS.some((p) => ua.includes(p));
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    const userAgent = req.headers.get("user-agent") || "";

    if (!token) {
      return new Response("Missing token", { status: 400, headers: corsHeaders });
    }

    const reportUrl = `${SITE_URL}/report/${token}`;

    // For human visitors, redirect immediately
    if (!isCrawler(userAgent)) {
      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, Location: reportUrl },
      });
    }

    // For crawlers, fetch report data and serve OG meta tags
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: report } = await supabase
      .from("shared_reports")
      .select("verdict, confidence, image_url, file_name, is_public")
      .eq("share_token", token)
      .eq("is_public", true)
      .maybeSingle();

    const verdict = report?.verdict ?? "ai";
    const confidence = report?.confidence ?? 0;
    const imageUrl = report?.image_url || DEFAULT_OG_IMAGE;
    const fileName = report?.file_name || "image";

    const isAI = verdict.toLowerCase() === "ai";
    const title = `ImageTruth AI Analysis: ${isAI ? "AI-Generated" : "Likely Authentic"} (${Math.round(Number(confidence))}%)`;
    const description = `${isAI ? "AI generation indicators detected" : "Likely authentic image"} in "${fileName}". Verified by 5 independent AI detection models.`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="refresh" content="0; url=${escapeHtml(reportUrl)}" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${escapeHtml(reportUrl)}" />

  <!-- Open Graph -->
  <meta property="og:type" content="article" />
  <meta property="og:url" content="${escapeHtml(reportUrl)}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${escapeHtml(imageUrl)}" />
  <meta property="og:image:secure_url" content="${escapeHtml(imageUrl)}" />
  <meta property="og:image:alt" content="${escapeHtml(fileName)}" />
  <meta property="og:site_name" content="ImageTruth AI" />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(imageUrl)}" />
  <meta name="twitter:image:alt" content="${escapeHtml(fileName)}" />
</head>
<body>
  <p>Redirecting to <a href="${escapeHtml(reportUrl)}">${escapeHtml(reportUrl)}</a>...</p>
  <script>window.location.replace(${JSON.stringify(reportUrl)});</script>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (err) {
    console.error("report-og error:", err);
    return new Response("Internal error", { status: 500, headers: corsHeaders });
  }
});
