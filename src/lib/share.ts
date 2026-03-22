export async function shareContent(
  text: string,
  title: string = "ImageTruth AI",
  url?: string,
  imageUrl?: string
): Promise<"shared" | "copied"> {
  const shareUrl = url || "https://imagetruthai.com";

  if (navigator.share) {
    try {
      await navigator.share({
        title,
        text,
        url: shareUrl,
      });
      return "shared";
    } catch (e) {
      if ((e as Error).name === "AbortError") return "copied";
    }
  }

  // Fallback: copy to clipboard
  const clipboardText = `${text}\n${shareUrl}`;
  await navigator.clipboard.writeText(clipboardText);
  return "copied";
}
