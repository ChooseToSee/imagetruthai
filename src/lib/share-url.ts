/**
 * Builds a crawler-friendly share URL that routes through the `report-og` edge function.
 * Crawlers (Twitter/Facebook/LinkedIn bots) get OG meta tags pointing at the analyzed
 * image; humans are immediately redirected to the standard /report/{token} page.
 */
export function buildOgShareUrl(reportPageUrl: string): string {
  try {
    const url = new URL(reportPageUrl);
    const match = url.pathname.match(/\/report\/([^/?#]+)/);
    if (!match) return reportPageUrl;
    const token = match[1];
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const base = supabaseUrl || (projectId ? `https://${projectId}.supabase.co` : null);
    if (!base) return reportPageUrl;
    return `${base}/functions/v1/report-og?token=${encodeURIComponent(token)}`;
  } catch {
    return reportPageUrl;
  }
}
