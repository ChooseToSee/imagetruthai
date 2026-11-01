export const ANONYMOUS_WINDOW_HOURS = 24;
export const ANONYMOUS_CAPACITY = 150;

export function validateAnonymousUpload(form: FormData): string | null {
  const browserId = form.get("browser_id");
  if (typeof browserId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(browserId)) {
    return "anonymous_browser_id_required";
  }
  let fileCount = 0;
  for (const [, value] of form.entries()) {
    if (value instanceof File) fileCount++;
  }
  if (fileCount !== 1 || form.getAll("image").length !== 1 ||
      form.has("images") || form.has("images[]") || form.has("batch") || form.has("batch_id") ||
      (form.has("batch_size") && form.get("batch_size") !== "1")) {
    return "anonymous_single_image_only";
  }
  return null;
}

export async function hashAnonymousIp(ip: string, salt: string): Promise<string> {
  if (!ip || ip === "unknown" || !salt) throw new Error("Anonymous identifier unavailable");
  const bytes = new TextEncoder().encode(`${salt}:${ip.trim()}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}

export function anonymousError(error: string): Response {
  const messages: Record<string, string> = {
    anonymous_limit_reached: "You have used your one trial scan for the past 24 hours. Please sign up for a free account to continue.",
    anonymous_capacity_reached: "Free trial scans are at capacity today, please sign up for a free account to continue.",
    anonymous_browser_id_required: "A valid browser identifier is required for a trial scan.",
    anonymous_single_image_only: "Trial scans support one image at a time. Please sign up for a free account to continue.",
    anonymous_scan_unavailable: "Trial scans are temporarily unavailable. Please try again or sign up for a free account.",
  };
  const status = error === "anonymous_scan_unavailable" ? 503
    : error === "anonymous_limit_reached" || error === "anonymous_capacity_reached" ? 429 : 400;
  return new Response(JSON.stringify({ error, message: messages[error] ?? messages.anonymous_scan_unavailable }), { status });
}

type QuotaRpc = (commit: boolean) => Promise<{ data: unknown; error: unknown }>;
export async function enforceAnonymousQuota(rpc: QuotaRpc, commit: boolean): Promise<Response | null> {
  try {
    const { data, error } = await rpc(commit);
    if (error) return anonymousError("anonymous_scan_unavailable");
    if (data === "allowed") return null;
    if (data === "anonymous_limit_reached" || data === "anonymous_capacity_reached") return anonymousError(data);
  } catch {
    // Never fail open for anonymous usage or disclose database errors.
  }
  return anonymousError("anonymous_scan_unavailable");
}