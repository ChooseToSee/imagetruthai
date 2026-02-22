async function dataUrlToFile(dataUrl: string, fileName: string): Promise<File | null> {
  try {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], fileName, { type: blob.type || "image/png" });
  } catch {
    return null;
  }
}

export async function shareContent(
  text: string,
  title: string = "ImageTruth AI",
  url?: string,
  imageUrl?: string
): Promise<"shared" | "copied"> {
  if (navigator.share) {
    try {
      const shareData: ShareData = { title, text };
      if (url) shareData.url = url;

      // Try sharing with image file if supported
      if (imageUrl) {
        const file = await dataUrlToFile(imageUrl, "imagetruth-result.png");
        if (file && navigator.canShare?.({ files: [file] })) {
          shareData.files = [file];
        }
      }

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
