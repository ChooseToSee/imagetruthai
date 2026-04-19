// reCAPTCHA v3 (invisible) — site key is publishable, safe to ship in client.
export const RECAPTCHA_SITE_KEY = "6LeIyL4sAAAAAHDasRyV7fdF1vt8xBLkYt2hae4D";

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, opts: { action: string }) => Promise<string>;
    };
  }
}

/**
 * Generate an invisible reCAPTCHA v3 token for a given action.
 * Returns null if the script hasn't loaded or generation fails — caller should
 * proceed without a token (server fails open if no token is provided).
 */
export async function getRecaptchaToken(action: string): Promise<string | null> {
  try {
    if (!window.grecaptcha) {
      console.warn("[reCAPTCHA] grecaptcha not loaded yet");
      return null;
    }
    return await new Promise<string>((resolve, reject) => {
      window.grecaptcha!.ready(async () => {
        try {
          const token = await window.grecaptcha!.execute(RECAPTCHA_SITE_KEY, { action });
          resolve(token);
        } catch (e) {
          reject(e);
        }
      });
    });
  } catch (err) {
    console.error("[reCAPTCHA] Token generation failed:", err);
    return null;
  }
}
