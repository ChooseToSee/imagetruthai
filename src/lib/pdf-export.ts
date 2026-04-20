import { jsPDF } from "jspdf";
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
  imageUrl: string,
  shareUrl?: string
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
    `${result.confidence}% — ${isAI ? "AI Generation Indicators Detected" : "No AI Generation Indicators Detected"}`,
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
  pdf.text("What the Models Found", 15, y);
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

  // Model Breakdown
  if (result.modelBreakdown && result.modelBreakdown.length > 0) {
    if (y > 240) { pdf.addPage(); y = 15; }
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(40, 40, 40);
    pdf.text("Per-Model AI Detection Breakdown", 15, y);
    y += 6;
    result.modelBreakdown
      .filter(m => m.confidence > 0 || m.reasons.length > 0)
      .forEach((model) => {
        if (y > 260) { pdf.addPage(); y = 15; }
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(
          model.verdict === "ai" ? 200 : 50,
          model.verdict === "ai" ? 50 : 160,
          model.verdict === "ai" ? 50 : 80
        );
        pdf.text(`${model.model}: ${model.confidence}% — ${model.verdict === "ai" ? "AI indicators found" : "no AI indicators found"}`, 18, y);
        y += 5;
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        pdf.setTextColor(80, 80, 80);
        model.reasons.forEach((r) => {
          if (y > 270) { pdf.addPage(); y = 15; }
          const lines = pdf.splitTextToSize(`  • ${r}`, pageW - 35);
          pdf.text(lines, 22, y);
          y += lines.length * 4.5;
        });
        y += 3;
      });
    y += 4;
  }

  // Edit Detection
  if (result.manipulation) {
    if (y > 240) { pdf.addPage(); y = 15; }
    const m = result.manipulation;
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(40, 40, 40);
    pdf.text("Edit Detection", 15, y);
    y += 6;
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(m.edited ? 200 : 50, m.edited ? 130 : 160, m.edited ? 0 : 80);
    pdf.text(`${m.confidence}% — Manipulation Indicators ${m.edited ? "Detected" : "Not Detected"}`, 18, y);
    y += 6;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(80, 80, 80);
    m.reasons.forEach((r) => {
      if (y > 270) { pdf.addPage(); y = 15; }
      const lines = pdf.splitTextToSize(`• ${r}`, pageW - 30);
      pdf.text(lines, 18, y);
      y += lines.length * 4.5;
    });
    y += 4;
  }

  // Edit Detection — Per Model
  const editModels = result.modelBreakdown?.filter(m => m.manipulation) ?? [];
  if (editModels.length > 0) {
    if (y > 240) { pdf.addPage(); y = 15; }
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(40, 40, 40);
    pdf.text("Edit Detection — Per Model", 15, y);
    y += 6;
    editModels.forEach((model) => {
      if (y > 260) { pdf.addPage(); y = 15; }
      const manip = model.manipulation!;
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(manip.edited ? 200 : 50, manip.edited ? 130 : 160, manip.edited ? 0 : 80);
      pdf.text(`${model.model}: ${manip.confidence}% — ${manip.edited ? "manipulation indicators found" : "no manipulation indicators found"}`, 18, y);
      y += 5;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(80, 80, 80);
      manip.reasons.forEach((r) => {
        if (y > 270) { pdf.addPage(); y = 15; }
        const lines = pdf.splitTextToSize(`  • ${r}`, pageW - 35);
        pdf.text(lines, 22, y);
        y += lines.length * 4.5;
      });
      y += 3;
    });
    y += 4;
  }

  // About these results
  if (y > 230) { pdf.addPage(); y = 15; }
  pdf.setFontSize(11);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(40, 40, 40);
  pdf.text("About These Results", 15, y);
  y += 5;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(80, 80, 80);
  const aboutText = "These results represent what each AI model found based on its training. AI Detection models (Winston AI, SightEngine, AI or Not) look for patterns associated with AI generation tools. Edit Detection models (Gemini, Hive) look for post-processing manipulation indicators. Results are probabilistic and should not be used as sole evidence of any determination.";
  const aboutLines = pdf.splitTextToSize(aboutText, pageW - 30);
  pdf.text(aboutLines, 15, y);
  y += aboutLines.length * 4.5 + 4;

  // Tips & Recommendations
  if (result.tips && result.tips.length > 0) {
    if (y > 240) { pdf.addPage(); y = 15; }
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(40, 40, 40);
    pdf.text("How to Interpret These Results", 15, y);
    y += 6;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(80, 80, 80);
    result.tips.forEach((tip) => {
      if (y > 270) { pdf.addPage(); y = 15; }
      const lines = pdf.splitTextToSize(`• ${tip}`, pageW - 30);
      pdf.text(lines, 18, y);
      y += lines.length * 4.5;
    });
    y += 4;
  }

  // Share section
  if (y > 240) { pdf.addPage(); y = 15; }
  y += 4;
  pdf.setFontSize(11);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(40, 40, 40);
  pdf.text("Share This Report", 15, y);
  y += 6;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(80, 80, 80);

  if (shareUrl) {
    pdf.text("View this report online:", 15, y);
    y += 5;
    pdf.setTextColor(77, 124, 255);
    pdf.text(shareUrl, 15, y);
    pdf.link(15, y - 4, pageW - 30, 6, { url: shareUrl });
    y += 8;
    pdf.setTextColor(80, 80, 80);

    pdf.text("Share on social media:", 15, y);
    y += 5;
    const tweetText = `🔍 ImageTruth AI Analysis\n\n${shareUrl}\n\nvia @ImageTruthAI`;
    const xLink = `https://x.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    const fbLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    const liLink = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    const socialLinks: Array<{ label: string; url: string }> = [
      { label: "Share on X", url: xLink },
      { label: "Share on Facebook", url: fbLink },
      { label: "Share on LinkedIn", url: liLink },
    ];
    socialLinks.forEach(({ label, url }) => {
      if (y > 270) { pdf.addPage(); y = 15; }
      pdf.setTextColor(77, 124, 255);
      pdf.text(`• ${label}`, 18, y);
      pdf.link(18, y - 4, pageW - 36, 6, { url });
      y += 5;
    });
    pdf.setTextColor(80, 80, 80);
    y += 2;
    const note = "Visit the URL above to view the full interactive report online.";
    const noteLines = pdf.splitTextToSize(note, pageW - 30);
    pdf.text(noteLines, 15, y);
    y += noteLines.length * 4.5 + 4;
  } else {
    const noLinkNote = "Generate a public share link from the report page to include shareable URLs in this PDF.";
    const noLines = pdf.splitTextToSize(noLinkNote, pageW - 30);
    pdf.text(noLines, 15, y);
    y += noLines.length * 4.5 + 4;
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

  signals.forEach((s, index) => {
    if (y > 270) { pdf.addPage(); y = 15; }

    // Alternating row background
    if (index % 2 === 0) {
      pdf.setFillColor(245, 245, 245);
      pdf.rect(15, y - 3.5, pageW - 30, 7, 'F');
    }

    // Signal label on left
    pdf.setTextColor(40, 40, 40);
    pdf.text(s.label, 18, y);

    // Status on right with color
    if (s.detected) {
      pdf.setTextColor(200, 50, 50);
      pdf.text("Detected", pageW - 40, y);
    } else {
      pdf.setTextColor(50, 160, 80);
      pdf.text("Not detected", pageW - 48, y);
    }

    y += 7;
  });

  // Reset text color after table
  pdf.setTextColor(40, 40, 40);
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
  pdf.text("Generated by ImageTruth AI — https://imagetruthai.com", pageW / 2, y, { align: "center" });

  const pdfBlob = pdf.output("blob");
  const blobUrl = URL.createObjectURL(pdfBlob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = "imagetruth-report.pdf";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
}
