import jsPDF from "jspdf";
import type { AnalysisResult } from "@/components/ResultsDisplay";

const SIGNAL_KEYWORDS = [
  { label: "Lighting Inconsistencies", keywords: ["lighting", "shadow", "illumination"] },
  { label: "Compression Artifacts", keywords: ["compression", "jpeg", "artifact", "quality"] },
  { label: "Edge Irregularities", keywords: ["edge", "boundary", "outline", "halo"] },
  { label: "Metadata Anomalies", keywords: ["metadata", "exif", "camera", "gps"] },
  { label: "Texture Inconsistencies", keywords: ["texture", "noise", "grain", "smoothing", "skin"] },
  { label: "Pattern Anomalies", keywords: ["pattern", "repeating", "clone", "uniform"] },
];

export async function exportReportPdf(
  result: AnalysisResult,
  imageUrl: string
): Promise<void> {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  let y = 15;

  // Title
  pdf.setFontSize(20);
  pdf.setFont("helvetica", "bold");
  pdf.text("ImageTruth AI — Analysis Report", pageW / 2, y, { align: "center" });
  y += 10;

  pdf.setDrawColor(100, 100, 100);
  pdf.line(15, y, pageW - 15, y);
  y += 8;

  // Try to add image
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject();
      img.src = imageUrl;
    });

    const canvas = document.createElement("canvas");
    const maxW = 160;
    const aspect = img.naturalHeight / img.naturalWidth;
    const drawW = Math.min(maxW, img.naturalWidth * 0.5);
    const drawH = drawW * aspect;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(img, 0, 0);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
      const imgH = Math.min(drawH, 80);
      const imgW = imgH / aspect;
      pdf.addImage(dataUrl, "JPEG", (pageW - imgW) / 2, y, imgW, imgH);
      y += imgH + 8;
    }
  } catch {
    // Skip image if cross-origin fails
  }

  // Verdict
  const isAI = result.verdict === "ai";
  const confidenceLabel = result.confidence >= 85 ? "High" : result.confidence >= 60 ? "Moderate" : "Low";

  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(isAI ? 200 : 50, isAI ? 50 : 160, isAI ? 50 : 80);
  pdf.text(
    `${result.confidence}% Likely ${isAI ? "AI-Generated" : "Human-Created"}`,
    pageW / 2,
    y,
    { align: "center" }
  );
  y += 6;
  pdf.setFontSize(10);
  pdf.setTextColor(120, 120, 120);
  pdf.text(`Confidence Level: ${confidenceLabel}`, pageW / 2, y, { align: "center" });
  y += 10;

  // Reasons
  pdf.setTextColor(40, 40, 40);
  pdf.setFontSize(12);
  pdf.setFont("helvetica", "bold");
  pdf.text("Analysis Details", 15, y);
  y += 6;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  result.reasons.forEach((r) => {
    if (y > 270) { pdf.addPage(); y = 15; }
    const lines = pdf.splitTextToSize(`• ${r}`, pageW - 30);
    pdf.text(lines, 18, y);
    y += lines.length * 4.5;
  });
  y += 4;

  // Manipulation
  if (result.manipulation) {
    const m = result.manipulation;
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.text("Edit Detection", 15, y);
    y += 6;
    pdf.setFontSize(10);
    pdf.setTextColor(m.edited ? 200 : 50, m.edited ? 130 : 160, m.edited ? 0 : 80);
    pdf.text(`${m.confidence}% Likely ${m.edited ? "Edited" : "Unmodified"}`, 18, y);
    y += 6;
    pdf.setTextColor(40, 40, 40);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    m.reasons.forEach((r) => {
      if (y > 270) { pdf.addPage(); y = 15; }
      const lines = pdf.splitTextToSize(`• ${r}`, pageW - 30);
      pdf.text(lines, 18, y);
      y += lines.length * 4.5;
    });
    y += 4;
  }

  // Signals table
  const allReasons = [...result.reasons, ...(result.manipulation?.reasons ?? [])].map((r) => r.toLowerCase());
  const signals = SIGNAL_KEYWORDS.map((s) => ({
    label: s.label,
    detected: s.keywords.some((kw) => allReasons.some((r) => r.includes(kw))),
  }));

  if (y > 240) { pdf.addPage(); y = 15; }
  pdf.setFontSize(12);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(40, 40, 40);
  pdf.text("Detected Signals", 15, y);
  y += 6;

  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  signals.forEach((s) => {
    if (y > 270) { pdf.addPage(); y = 15; }
    const status = s.detected ? "✓ Detected" : "✗ Not detected";
    pdf.text(`${s.label}: ${status}`, 18, y);
    y += 5;
  });
  y += 6;

  // Disclaimer
  if (y > 260) { pdf.addPage(); y = 15; }
  pdf.setDrawColor(100, 100, 100);
  pdf.line(15, y, pageW - 15, y);
  y += 6;
  pdf.setFontSize(8);
  pdf.setTextColor(130, 130, 130);
  const disclaimer = "AI-generated analysis may be inaccurate. Results are informational only and should be independently verified.";
  const dLines = pdf.splitTextToSize(disclaimer, pageW - 30);
  pdf.text(dLines, pageW / 2, y, { align: "center" });
  y += dLines.length * 4 + 4;
  pdf.setFontSize(8);
  pdf.text("Generated by ImageTruth AI — https://imagetruthai.lovable.app", pageW / 2, y, { align: "center" });

  pdf.save("imagetruth-report.pdf");
}
