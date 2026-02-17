import jsPDF from "jspdf";
import { EbookPageData, LayoutType, PageContent } from "@/components/content/ebookLayouts";
import { PDFStyleConfig } from "@/components/content/PDFStyleSettings";

const PAGE_SIZES: Record<string, { width: number; height: number }> = {
  "6x9": { width: 432, height: 648 },
  "5.5x8.5": { width: 396, height: 612 },
  "8.5x11": { width: 612, height: 792 },
  "8x8": { width: 576, height: 576 },
  "a4": { width: 595, height: 842 },
  "a4-landscape": { width: 842, height: 595 },
  "a5": { width: 420, height: 595 },
  "letter-landscape": { width: 792, height: 612 },
  "16x9": { width: 960, height: 540 },
};

// px to mm at 72 DPI
const PX_TO_MM = 0.3528;

function getFontFamily(config: PDFStyleConfig): string {
  switch (config.fontFamily) {
    case "serif": return "times";
    case "mono": return "courier";
    default: return "helvetica";
  }
}

function getFontSize(config: PDFStyleConfig): number {
  switch (config.fontSize) {
    case "small": return 10;
    case "large": return 14;
    default: return 12;
  }
}

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [26, 26, 46];
}

async function loadImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function wrapText(doc: jsPDF, text: string, maxWidth: number): string[] {
  return doc.splitTextToSize(text, maxWidth);
}

async function renderPage(
  doc: jsPDF,
  page: EbookPageData,
  wMm: number,
  hMm: number,
  config: PDFStyleConfig
) {
  const c = page.content;
  const font = getFontFamily(config);
  const baseFontSize = getFontSize(config);
  const headingColor = hexToRgb(config.headingColor || "#1a1a2e");
  const margin = wMm * 0.08;
  const contentW = wMm - margin * 2;

  doc.setFont(font);

  const drawHeading = (text: string, x: number, y: number, size: number, maxW: number): number => {
    doc.setFontSize(size);
    doc.setFont(font, "bold");
    doc.setTextColor(...headingColor);
    const lines = wrapText(doc, text, maxW);
    doc.text(lines, x, y);
    return y + lines.length * size * 0.4;
  };

  const drawBody = (text: string, x: number, y: number, maxW: number, maxH?: number): number => {
    doc.setFontSize(baseFontSize);
    doc.setFont(font, "normal");
    doc.setTextColor(60, 60, 60);
    const lines = wrapText(doc, text, maxW);
    const lineH = baseFontSize * 0.45;
    const maxLines = maxH ? Math.floor(maxH / lineH) : lines.length;
    const drawnLines = lines.slice(0, maxLines);
    doc.text(drawnLines, x, y);
    return y + drawnLines.length * lineH;
  };

  const drawImage = async (url: string, x: number, y: number, w: number, h: number) => {
    const base64 = await loadImageAsBase64(url);
    if (base64) {
      try {
        doc.addImage(base64, "JPEG", x, y, w, h);
      } catch {
        // If image fails, draw placeholder
        doc.setDrawColor(200, 200, 200);
        doc.rect(x, y, w, h);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text("Image", x + w / 2, y + h / 2, { align: "center" });
      }
    }
  };

  switch (page.layout) {
    case "title": {
      const centerY = hMm * 0.4;
      if (c.heading) {
        doc.setFontSize(24);
        doc.setFont(font, "bold");
        doc.setTextColor(...headingColor);
        const lines = wrapText(doc, c.heading, contentW * 0.8);
        doc.text(lines, wMm / 2, centerY, { align: "center" });
        let y2 = centerY + lines.length * 10;
        if (c.subheading) {
          doc.setFontSize(14);
          doc.setFont(font, "normal");
          doc.setTextColor(100, 100, 100);
          doc.text(wrapText(doc, c.subheading, contentW * 0.7), wMm / 2, y2 + 5, { align: "center" });
          y2 += 15;
        }
        if (c.attribution) {
          doc.setFontSize(10);
          doc.setTextColor(150, 150, 150);
          doc.text(c.attribution, wMm / 2, y2 + 15, { align: "center" });
        }
      }
      break;
    }
    case "chapter-opener": {
      const centerY = hMm * 0.35;
      if (c.subheading) {
        doc.setFontSize(8);
        doc.setFont(font, "normal");
        doc.setTextColor(150, 150, 150);
        doc.text(c.subheading.toUpperCase(), wMm / 2, centerY, { align: "center" });
      }
      if (c.heading) {
        drawHeading(c.heading, wMm / 2, centerY + 10, 20, contentW * 0.8);
        doc.text("", 0, 0); // reset
        // divider
        doc.setDrawColor(200, 200, 200);
        doc.line(wMm / 2 - 15, centerY + 22, wMm / 2 + 15, centerY + 22);
      }
      if (c.body) {
        drawBody(c.body, wMm / 2, centerY + 30, contentW * 0.7);
      }
      break;
    }
    case "full-text": {
      let y = margin;
      if (c.heading) y = drawHeading(c.heading, margin, y + 5, 16, contentW) + 4;
      if (c.body) drawBody(c.body, margin, y, contentW, hMm - y - margin);
      break;
    }
    case "text-image": {
      const textW = contentW * 0.55;
      const imgW = contentW * 0.4;
      let y = margin;
      if (c.heading) y = drawHeading(c.heading, margin, y + 5, 14, textW) + 4;
      if (c.body) drawBody(c.body, margin, y, textW, hMm - y - margin);
      if (c.image) await drawImage(c.image, margin + textW + contentW * 0.05, margin, imgW, hMm - margin * 2);
      break;
    }
    case "image-text": {
      const imgW = contentW * 0.4;
      const textX = margin + imgW + contentW * 0.05;
      const textW = contentW * 0.55;
      let y = margin;
      if (c.image) await drawImage(c.image, margin, margin, imgW, hMm - margin * 2);
      if (c.heading) y = drawHeading(c.heading, textX, y + 5, 14, textW) + 4;
      if (c.body) drawBody(c.body, textX, y, textW, hMm - y - margin);
      break;
    }
    case "full-image": {
      if (c.image) await drawImage(c.image, 0, 0, wMm, hMm - (c.heading ? 10 : 0));
      if (c.heading) {
        doc.setFontSize(8);
        doc.setFont(font, "italic");
        doc.setTextColor(150, 150, 150);
        doc.text(c.heading, wMm / 2, hMm - 4, { align: "center" });
      }
      break;
    }
    case "two-column": {
      let y = margin;
      if (c.heading) y = drawHeading(c.heading, margin, y + 5, 14, contentW) + 6;
      if (c.body) {
        const colW = (contentW - 8) / 2;
        const lines = wrapText(doc, c.body, colW);
        const lineH = baseFontSize * 0.45;
        const maxLines = Math.floor((hMm - y - margin) / lineH);
        const mid = Math.ceil(Math.min(lines.length, maxLines) / 2);
        doc.setFontSize(baseFontSize);
        doc.setFont(font, "normal");
        doc.setTextColor(60, 60, 60);
        doc.text(lines.slice(0, mid), margin, y);
        doc.text(lines.slice(mid, maxLines), margin + colW + 8, y);
      }
      break;
    }
    case "quote": {
      const centerY = hMm * 0.35;
      doc.setFontSize(36);
      doc.setTextColor(200, 200, 200);
      doc.text('"', wMm / 2, centerY, { align: "center" });
      if (c.quote || c.body) {
        doc.setFontSize(14);
        doc.setFont(font, "italic");
        doc.setTextColor(...headingColor);
        const lines = wrapText(doc, c.quote || c.body || "", contentW * 0.75);
        doc.text(lines, wMm / 2, centerY + 12, { align: "center" });
        if (c.attribution) {
          doc.setFontSize(10);
          doc.setFont(font, "normal");
          doc.setTextColor(150, 150, 150);
          doc.text(`— ${c.attribution}`, wMm / 2, centerY + 12 + lines.length * 6 + 6, { align: "center" });
        }
      }
      break;
    }
    case "checklist": {
      let y = margin;
      if (c.heading) y = drawHeading(c.heading, margin, y + 5, 14, contentW) + 6;
      doc.setFontSize(baseFontSize);
      doc.setFont(font, "normal");
      doc.setTextColor(60, 60, 60);
      for (const item of (c.items || [])) {
        if (y > hMm - margin) break;
        doc.setDrawColor(180, 180, 180);
        doc.rect(margin, y - 2.5, 3.5, 3.5);
        const lines = wrapText(doc, item, contentW - 8);
        doc.text(lines, margin + 6, y);
        y += lines.length * baseFontSize * 0.45 + 3;
      }
      break;
    }
    case "key-takeaways": {
      let y = margin;
      if (c.heading) y = drawHeading(c.heading, margin, y + 5, 14, contentW) + 6;
      doc.setFontSize(baseFontSize);
      let idx = 1;
      for (const item of (c.items || [])) {
        if (y > hMm - margin) break;
        doc.setFont(font, "bold");
        doc.setTextColor(...headingColor);
        doc.text(`${idx}.`, margin, y);
        doc.setFont(font, "normal");
        doc.setTextColor(60, 60, 60);
        const lines = wrapText(doc, item, contentW - 10);
        doc.text(lines, margin + 8, y);
        y += lines.length * baseFontSize * 0.45 + 4;
        idx++;
      }
      break;
    }
    case "call-to-action": {
      const centerY = hMm * 0.35;
      if (c.heading) {
        doc.setFontSize(18);
        doc.setFont(font, "bold");
        doc.setTextColor(...headingColor);
        const lines = wrapText(doc, c.heading, contentW * 0.8);
        doc.text(lines, wMm / 2, centerY, { align: "center" });
      }
      if (c.body) {
        doc.setFontSize(baseFontSize);
        doc.setFont(font, "normal");
        doc.setTextColor(100, 100, 100);
        const lines = wrapText(doc, c.body, contentW * 0.75);
        doc.text(lines, wMm / 2, centerY + 16, { align: "center" });
      }
      if (c.subheading) {
        const btnY = centerY + 35;
        const btnW = 50;
        const btnH = 10;
        doc.setFillColor(...headingColor);
        doc.roundedRect(wMm / 2 - btnW / 2, btnY, btnW, btnH, 2, 2, "F");
        doc.setFontSize(10);
        doc.setFont(font, "bold");
        doc.setTextColor(255, 255, 255);
        doc.text(c.subheading, wMm / 2, btnY + 6.5, { align: "center" });
      }
      break;
    }
    default: {
      // blank / fallback
      let y = margin;
      if (c.heading) y = drawHeading(c.heading, margin, y + 5, 16, contentW) + 4;
      if (c.body) drawBody(c.body, margin, y, contentW, hMm - y - margin);
      break;
    }
  }
}

export async function generatePDFFromPages(
  pages: EbookPageData[],
  pdfStyle: PDFStyleConfig,
  title: string
): Promise<Blob> {
  const sizeKey = pdfStyle.pageSize || "6x9";
  const dims = PAGE_SIZES[sizeKey] || PAGE_SIZES["6x9"];
  const wMm = dims.width * PX_TO_MM;
  const hMm = dims.height * PX_TO_MM;

  const doc = new jsPDF({
    orientation: wMm > hMm ? "landscape" : "portrait",
    unit: "mm",
    format: [wMm, hMm],
  });

  for (let i = 0; i < pages.length; i++) {
    if (i > 0) doc.addPage([wMm, hMm]);
    await renderPage(doc, pages[i], wMm, hMm, pdfStyle);
  }

  return doc.output("blob");
}

/**
 * Generate PDF from raw markdown (fallback when no page layouts exist).
 * Creates a simple text-based PDF.
 */
export async function generatePDFFromMarkdown(
  markdown: string,
  pdfStyle: PDFStyleConfig,
  title: string
): Promise<Blob> {
  const sizeKey = pdfStyle.pageSize || "6x9";
  const dims = PAGE_SIZES[sizeKey] || PAGE_SIZES["6x9"];
  const wMm = dims.width * PX_TO_MM;
  const hMm = dims.height * PX_TO_MM;
  const font = getFontFamily(pdfStyle);
  const baseFontSize = getFontSize(pdfStyle);
  const headingColor = hexToRgb(pdfStyle.headingColor || "#1a1a2e");
  const margin = wMm * 0.1;
  const contentW = wMm - margin * 2;

  const doc = new jsPDF({
    orientation: wMm > hMm ? "landscape" : "portrait",
    unit: "mm",
    format: [wMm, hMm],
  });

  doc.setFont(font);
  let y = margin;
  const lineH = baseFontSize * 0.45;

  const lines = markdown.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      y += lineH;
      if (y > hMm - margin) { doc.addPage([wMm, hMm]); y = margin; }
      continue;
    }

    if (trimmed.startsWith("# ")) {
      doc.setFontSize(20);
      doc.setFont(font, "bold");
      doc.setTextColor(...headingColor);
      const wrapped = wrapText(doc, trimmed.slice(2), contentW);
      if (y + wrapped.length * 8 > hMm - margin) { doc.addPage([wMm, hMm]); y = margin; }
      doc.text(wrapped, margin, y);
      y += wrapped.length * 8 + 4;
    } else if (trimmed.startsWith("## ")) {
      doc.setFontSize(16);
      doc.setFont(font, "bold");
      doc.setTextColor(...headingColor);
      if (y > margin + 20) { doc.addPage([wMm, hMm]); y = margin; }
      const wrapped = wrapText(doc, trimmed.slice(3), contentW);
      doc.text(wrapped, margin, y);
      y += wrapped.length * 7 + 4;
    } else if (trimmed.startsWith("### ")) {
      doc.setFontSize(13);
      doc.setFont(font, "bold");
      doc.setTextColor(...headingColor);
      if (y + 10 > hMm - margin) { doc.addPage([wMm, hMm]); y = margin; }
      const wrapped = wrapText(doc, trimmed.slice(4), contentW);
      doc.text(wrapped, margin, y);
      y += wrapped.length * 6 + 3;
    } else if (trimmed.startsWith("---")) {
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y, wMm - margin, y);
      y += 4;
    } else if (trimmed.startsWith("![")) {
      // skip images in markdown fallback
      continue;
    } else {
      doc.setFontSize(baseFontSize);
      doc.setFont(font, "normal");
      doc.setTextColor(60, 60, 60);
      const clean = trimmed.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1");
      const wrapped = wrapText(doc, clean, contentW);
      if (y + wrapped.length * lineH > hMm - margin) { doc.addPage([wMm, hMm]); y = margin; }
      doc.text(wrapped, margin, y);
      y += wrapped.length * lineH + 2;
    }
  }

  return doc.output("blob");
}
