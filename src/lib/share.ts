export async function shareContent(
  text: string,
  title: string = "ImageTruth AI",
  url: string = window.location.href
): Promise<"shared" | "copied"> {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return "shared";
    } catch {
      // User cancelled or error — fall back to clipboard
    }
  }
  await navigator.clipboard.writeText(`${text}\n${url}`);
  return "copied";
}
