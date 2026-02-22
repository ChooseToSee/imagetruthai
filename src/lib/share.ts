export async function shareContent(
  text: string,
  title: string = "ImageTruth AI",
  url?: string
): Promise<"shared" | "copied"> {
  if (navigator.share) {
    try {
      const shareData: ShareData = { title, text };
      if (url) shareData.url = url;
      await navigator.share(shareData);
      return "shared";
    } catch {
      // User cancelled or error — fall back to clipboard
    }
  }
  const clipText = url ? `${text}\n${url}` : text;
  await navigator.clipboard.writeText(clipText);
  return "copied";
}
