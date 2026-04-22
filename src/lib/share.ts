/**
 * Shares text + URL via the Web Share API, optionally attaching an image file.
 *
 * @param text       Body text for the share sheet.
 * @param title      Share dialog title.
 * @param url        Canonical URL to share.
 * @param imageUrl   Optional image to attach. Pass the **analyzed image URL**
 *                   when sharing a specific scan/report so the thumbnail on
 *                   X / Facebook / iMessage / etc. shows the actual analyzed
 *                   image instead of the generic branded card.
 *                   Omit this for generic "share the app" buttons — the
 *                   caller should NOT pass the static brand image here; the
 *                   recipient platforms already pull it from OG meta tags.
 */
export async function shareContent(
  text: string,
  title: string = "ImageTruth AI",
  url?: string,
  imageUrl?: string
): Promise<"shared" | "copied"> {
  const shareUrl = url || "https://imagetruthai.com";

  if (navigator.share) {
    try {
      let shareData: ShareData = {
        title,
        text,
        url: shareUrl,
      };

      // Only attach a file when an analyzed image URL was explicitly provided.
      // For generic app shares (no imageUrl), let the receiving platform
      // resolve the preview thumbnail from the page's OG meta tags — that
      // way the static branded share-image.png is used only as the *page*
      // preview, never overriding analyzed image thumbnails.
      if (imageUrl) {
        try {
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          // Pick a sensible filename + mime type from the blob.
          const ext = blob.type.split("/")[1]?.split("+")[0] || "png";
          const file = new File(
            [blob],
            `imagetruth-analyzed.${ext}`,
            { type: blob.type || "image/png" }
          );

          if (
            navigator.canShare &&
            navigator.canShare({ files: [file] })
          ) {
            shareData = {
              title,
              text,
              url: shareUrl,
              files: [file],
            };
          }
        } catch {
          // If the analyzed image can't be fetched (CORS, network, etc.),
          // fall back to a text+URL share rather than substituting the
          // generic brand image.
        }
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
