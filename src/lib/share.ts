export async function shareContent(
  text: string,
  title: string = "ImageTruth AI",
  url?: string,
  imageUrl?: string
): Promise<"shared" | "copied"> {
  const shareUrl = url || "https://imagetruthai.com";

  if (navigator.share) {
    try {
      const staticImageUrl =
        `${window.location.origin}/share-image.png`;

      let shareData: ShareData = {
        title,
        text,
        url: shareUrl,
      };

      // Try to include static branded image if supported
      try {
        const response = await fetch(staticImageUrl);
        const blob = await response.blob();
        const file = new File(
          [blob],
          "imagetruth-share.png",
          { type: "image/png" }
        );

        if (navigator.canShare &&
            navigator.canShare({ files: [file] })) {
          shareData = {
            title,
            text,
            url: shareUrl,
            files: [file],
          };
        }
      } catch {
        // Fall back to no image if fetch fails
      }

      await navigator.share(shareData);
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
