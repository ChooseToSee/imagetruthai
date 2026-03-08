import { supabase } from "@/integrations/supabase/client";

// Bump this when Terms of Service are updated
export const CURRENT_TERMS_VERSION = "2026-03-08";

const SESSION_KEY = "imagetruth_consent_given";

export function getSessionConsent(): boolean {
  return sessionStorage.getItem(SESSION_KEY) === CURRENT_TERMS_VERSION;
}

export function setSessionConsent(): void {
  sessionStorage.setItem(SESSION_KEY, CURRENT_TERMS_VERSION);
}

export function clearSessionConsent(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

/** Check if the logged-in user already consented to the current Terms version */
export async function checkExistingConsent(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("consent_logs")
    .select("id")
    .eq("user_id", userId)
    .eq("terms_version", CURRENT_TERMS_VERSION)
    .limit(1);
  return !!(data && data.length > 0);
}

/** Log consent via edge function (captures IP server-side) */
export async function logConsent(): Promise<void> {
  await supabase.functions.invoke("log-consent", {
    body: { terms_version: CURRENT_TERMS_VERSION },
  });
}
