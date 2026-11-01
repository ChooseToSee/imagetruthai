const STORAGE_KEY = "imagetruth_anonymous_browser_id";
let fallbackId: string | undefined;

export function getAnonymousBrowserId(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(saved)) return saved;
    const id = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, id);
    return id;
  } catch {
    fallbackId ??= crypto.randomUUID();
    return fallbackId;
  }
}