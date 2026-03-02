import jsPDF from "jspdf";
import { EbookPageData, LayoutType, PageContent } from "@/components/content/ebookLayouts";
import { PDFStyleConfig } from "@/components/content/PDFStyleSettings";
import { THEME_BACKGROUNDS, ThemeBackgroundDesign, BackgroundElement } from "@/components/content/themeBackgrounds";

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

function parseCssValue(val: string, totalMm: number): number {
  if (val.endsWith("px")) return parseFloat(val) * PX_TO_MM;
  if (val.endsWith("%")) return (parseFloat(val) / 100) * totalMm;
  if (val.startsWith("calc(")) {
    const match = val.match(/calc\(\s*100%\s*-\s*(\d+)px\s*\)/);
    if (match) return totalMm - parseFloat(match[1]) * PX_TO_MM;
    return totalMm;
  }
  return parseFloat(val) * PX_TO_MM || 0;
}

function renderPageBackground(
  doc: jsPDF,
  themeName: string | undefined,
  wMm: number,
  hMm: number,
  bgColor?: string
) {
  // Fill background color
  if (bgColor && bgColor !== "#ffffff") {
    const [r, g, b] = hexToRgb(bgColor);
    doc.setFillColor(r, g, b);
    doc.rect(0, 0, wMm, hMm, "F");
  }

  if (!themeName) return;
  const theme = THEME_BACKGROUNDS[themeName];
  if (!theme) return;

  for (const el of theme.elements) {
    const [r, g, b] = hexToRgb(el.color);
    // Cap opacity for decorative elements to keep them subtle
    let effectiveOpacity = Math.min(el.opacity, 1);
    if (el.type === "line" || el.type === "stripe") {
      effectiveOpacity = Math.min(effectiveOpacity, 0.05);
    } else if (el.type === "rect") {
      effectiveOpacity = Math.min(effectiveOpacity, 0.08);
    }

    const x = el.position.left ? parseCssValue(el.position.left, wMm) : 
              el.position.right ? wMm - parseCssValue(el.position.right, wMm) - parseCssValue(el.size.width, wMm) : 0;
    const y = el.position.top ? parseCssValue(el.position.top, hMm) :
              el.position.bottom ? hMm - parseCssValue(el.position.bottom, hMm) - parseCssValue(el.size.height, hMm) : 0;
    const w = parseCssValue(el.size.width, wMm);
    const h = parseCssValue(el.size.height, hMm);

    const gState = new (doc as any).GState({ opacity: effectiveOpacity, "stroke-opacity": effectiveOpacity });

    switch (el.type) {
      case "circle": {
        doc.saveGraphicsState();
        doc.setGState(gState);
        doc.setFillColor(r, g, b);
        const radius = Math.min(w, h) / 2;
        doc.circle(x + w / 2, y + h / 2, radius, "F");
        doc.restoreGraphicsState();
        break;
      }

      case "rect":
      case "stripe": {
        doc.saveGraphicsState();
        doc.setGState(gState);
        doc.setFillColor(r, g, b);
        if (el.rotation) {
          const cx = x + w / 2;
          const cy = y + h / 2;
          const halfW = w / 2;
          const halfH = h / 2;
          const rad = (el.rotation * Math.PI) / 180;
          const cos = Math.cos(rad);
          const sin = Math.sin(rad);
          const corners = [
            [-halfW, -halfH], [halfW, -halfH], [halfW, halfH], [-halfW, halfH]
          ].map(([px, py]) => [cx + px * cos - py * sin, cy + px * sin + py * cos]);
          
          doc.triangle(
            corners[0][0], corners[0][1],
            corners[1][0], corners[1][1],
            corners[2][0], corners[2][1],
            "F"
          );
          doc.triangle(
            corners[0][0], corners[0][1],
            corners[2][0], corners[2][1],
            corners[3][0], corners[3][1],
            "F"
          );
        } else {
          doc.rect(x, y, w, h, "F");
        }
        doc.restoreGraphicsState();
        break;
      }

      case "line": {
        doc.saveGraphicsState();
        doc.setGState(gState);
        doc.setFillColor(r, g, b);
        doc.rect(x, y, w, h, "F");
        doc.restoreGraphicsState();
        break;
      }

      case "gradient": {
        doc.saveGraphicsState();
        const steps = 10;
        for (let i = 0; i < steps; i++) {
          const stepOpacity = effectiveOpacity * (1 - i / steps) * 0.5;
          const stepGState = new (doc as any).GState({ opacity: stepOpacity });
          doc.setGState(stepGState);
          doc.setFillColor(r, g, b);
          const stepH = h / steps;
          doc.rect(x, y + i * stepH, w, stepH, "F");
        }
        doc.restoreGraphicsState();
        break;
      }

      case "dots": {
        doc.saveGraphicsState();
        const dotGState = new (doc as any).GState({ opacity: effectiveOpacity });
        doc.setGState(dotGState);
        doc.setFillColor(r, g, b);
        const spacing = 12;
        const dotRadius = 0.5;
        for (let dx = spacing; dx < wMm - spacing; dx += spacing) {
          for (let dy = spacing; dy < hMm - spacing; dy += spacing) {
            doc.circle(dx, dy, dotRadius, "F");
          }
        }
        doc.restoreGraphicsState();
        break;
      }

      case "wave": {
        doc.saveGraphicsState();
        doc.setGState(gState);
        doc.setFillColor(r, g, b);
        const waveH = h;
        const segments = 20;
        const segW = wMm / segments;
        for (let i = 0; i < segments; i++) {
          const progress = i / segments;
          const waveOffset = Math.sin(progress * Math.PI * 2) * (waveH * 0.4);
          const segY = y + waveH * 0.5 - waveOffset;
          const segHeight = hMm - segY;
          if (segHeight > 0) {
            doc.rect(i * segW, segY, segW + 0.5, segHeight, "F");
          }
        }
        doc.restoreGraphicsState();
        break;
      }

      case "blob": {
        doc.saveGraphicsState();
        doc.setGState(gState);
        doc.setFillColor(r, g, b);
        const blobR = Math.min(w, h) / 2;
        doc.circle(x + w / 2, y + h / 2, blobR, "F");
        doc.restoreGraphicsState();
        break;
      }
    }
  }
}

function getThemeContentPadding(themeName?: string): { top: number; right: number; bottom: number; left: number } {
  if (!themeName) return { top: 0, right: 0, bottom: 0, left: 0 };
  const theme = THEME_BACKGROUNDS[themeName];
  if (!theme) return { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    top: theme.contentPadding.top * PX_TO_MM,
    right: theme.contentPadding.right * PX_TO_MM,
    bottom: theme.contentPadding.bottom * PX_TO_MM,
    left: theme.contentPadding.left * PX_TO_MM,
  };
}

async function loadImageAsBase64(url: string): Promise<string | null> {
  try {
    // Handle data URIs directly — no need to re-fetch
    if (url.startsWith("data:")) {
      return url;
    }
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

interface RenderResult {
  overflowText?: string;
}

function getMargins(wMm: number, hMm: number, config: PDFStyleConfig) {
  const themePad = getThemeContentPadding(config.themeName);
  const baseMargin = wMm * 0.08;
  return {
    top: baseMargin + themePad.top,
    right: baseMargin + themePad.right,
    bottom: baseMargin + themePad.bottom,
    left: baseMargin + themePad.left,
  };
}

async function renderPage(
  doc: jsPDF,
  page: EbookPageData,
  wMm: number,
  hMm: number,
  config: PDFStyleConfig
): Promise<RenderResult> {
  const c = page.content;
  const font = getFontFamily(config);
  const baseFontSize = getFontSize(config);
  const headingColor = hexToRgb(config.headingColor || "#1a1a2e");
  const bodyColor = hexToRgb(config.bodyColor || "#3c3c3c");
  const accentColor = hexToRgb(config.accentColor || "#6366f1");
  
  const margin = getMargins(wMm, hMm, config);
  const contentW = wMm - margin.left - margin.right;

  doc.setFont(font);

  const lineH = baseFontSize * 0.45;
  const paragraphGap = lineH * 0.8;

  const drawHeading = (text: string, x: number, y: number, size: number, maxW: number, align?: string): number => {
    // Try the requested size, shrink if it doesn't fit
    let currentSize = size;
    let lines: string[];
    const availH = hMm * 0.25; // max 25% of page for heading
    while (currentSize >= 10) {
      doc.setFontSize(currentSize);
      doc.setFont(font, "bold");
      lines = wrapText(doc, text, maxW);
      const totalH = lines.length * currentSize * 0.4;
      if (totalH <= availH) break;
      currentSize -= 1;
    }
    doc.setFontSize(currentSize);
    doc.setFont(font, "bold");
    doc.setTextColor(...headingColor);
    lines = wrapText(doc, text, maxW);
    if (align === "center") {
      doc.text(lines, x, y, { align: "center" });
    } else {
      doc.text(lines, x, y);
    }
    return y + lines.length * currentSize * 0.4;
  };

  /**
   * Draw body text and return { finalY, overflowText }.
   * If text doesn't fit, overflowText contains the remainder.
   */
  const drawBody = (text: string, x: number, y: number, maxW: number, maxH?: number): { finalY: number; overflowText?: string } => {
    doc.setFontSize(baseFontSize);
    doc.setFont(font, "normal");
    doc.setTextColor(...bodyColor);
    
    // Split by double newlines into paragraphs, then by single newlines for line breaks/lists
    const paragraphs = text.split(/\n\n+/);
    let currentY = y;
    const bottomLimit = maxH ? y + maxH : hMm - margin.bottom;
    
    for (let pi = 0; pi < paragraphs.length; pi++) {
      const para = paragraphs[pi].trim();
      if (!para) continue;
      if (currentY >= bottomLimit) {
        const remaining = paragraphs.slice(pi).join("\n\n");
        return { finalY: currentY, overflowText: remaining };
      }
      
      // Split paragraph by single newlines to handle lists and line breaks
      const subLines = para.split(/\n/);
      
      for (let si = 0; si < subLines.length; si++) {
        const subLine = subLines[si].trim();
        if (!subLine) { currentY += lineH * 0.5; continue; }
        
        // Detect list items for slight indent and spacing
        const isListItem = /^\s*(?:\d+[\.\)]\s+|[-*•]\s+)/.test(subLine);
        const indentX = isListItem ? x + 4 : x;
        const lineMaxW = isListItem ? maxW - 4 : maxW;
        
        const wrappedLines = wrapText(doc, subLine, lineMaxW);
        for (let li = 0; li < wrappedLines.length; li++) {
          if (currentY >= bottomLimit) {
            // Build overflow from remaining content
            const remainingSubLines = wrappedLines.slice(li).join(" ");
            const restOfPara = subLines.slice(si + 1).join("\n");
            const restOfParas = paragraphs.slice(pi + 1).join("\n\n");
            let overflow = remainingSubLines;
            if (restOfPara) overflow += "\n" + restOfPara;
            if (restOfParas) overflow += "\n\n" + restOfParas;
            return { finalY: currentY, overflowText: overflow };
          }
          doc.text(wrappedLines[li], indentX, currentY);
          currentY += lineH;
        }
        // Add small gap after list items
        if (isListItem) currentY += lineH * 0.3;
      }
      currentY += paragraphGap;
    }
    return { finalY: currentY };
  };

  const drawImage = async (url: string, x: number, y: number, maxW: number, maxH: number) => {
    const base64 = await loadImageAsBase64(url);
    if (base64) {
      try {
        // Proportional sizing: fit within maxW × maxH, keeping aspect ratio
        // Default to 4:3 if we can't detect dimensions
        let imgW = maxW;
        let imgH = Math.min(maxH, maxW * 0.75); // default 4:3
        
        // Limit to 60% of page height for side layouts
        if (imgH > hMm * 0.6) {
          imgH = hMm * 0.6;
          imgW = imgH * (4 / 3);
          if (imgW > maxW) imgW = maxW;
        }
        
        doc.addImage(base64, "JPEG", x, y, imgW, imgH);
      } catch {
        doc.setDrawColor(200, 200, 200);
        doc.rect(x, y, maxW, Math.min(maxH, maxW * 0.75));
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text("Image", x + maxW / 2, y + Math.min(maxH, maxW * 0.75) / 2, { align: "center" });
      }
    }
  };

  let result: RenderResult = {};

  switch (page.layout) {
    case "title": {
      const centerY = hMm * 0.4;
      if (c.heading) {
        drawHeading(c.heading, wMm / 2, centerY, 24, contentW * 0.8, "center");
        let y2 = centerY + 20;
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
        const headEndY = drawHeading(c.heading, wMm / 2, centerY + 10, 20, contentW * 0.8, "center");
        doc.setDrawColor(200, 200, 200);
        doc.line(wMm / 2 - 15, headEndY + 4, wMm / 2 + 15, headEndY + 4);
        
        if (c.body) {
          const bodyResult = drawBody(c.body, margin.left + contentW * 0.15, headEndY + 10, contentW * 0.7, hMm - headEndY - 10 - margin.bottom);
          result.overflowText = bodyResult.overflowText;
        }
      } else if (c.body) {
        const bodyResult = drawBody(c.body, margin.left + contentW * 0.15, centerY + 30, contentW * 0.7, hMm - centerY - 30 - margin.bottom);
        result.overflowText = bodyResult.overflowText;
      }
      break;
    }
    case "full-text": {
      let y = margin.top;
      if (c.heading) y = drawHeading(c.heading, margin.left, y + 5, 16, contentW) + 4;
      if (c.body) {
        const bodyResult = drawBody(c.body, margin.left, y, contentW, hMm - y - margin.bottom);
        result.overflowText = bodyResult.overflowText;
      }
      break;
    }
    case "text-image": {
      const textW = contentW * 0.55;
      const imgW = contentW * 0.4;
      let y = margin.top;
      if (c.heading) y = drawHeading(c.heading, margin.left, y + 5, 14, textW) + 4;
      if (c.body) {
        const bodyResult = drawBody(c.body, margin.left, y, textW, hMm - y - margin.bottom);
        result.overflowText = bodyResult.overflowText;
      }
      if (c.image) {
        const imgMaxH = hMm * 0.6;
        await drawImage(c.image, margin.left + textW + contentW * 0.05, margin.top + 5, imgW, imgMaxH);
      }
      break;
    }
    case "image-text": {
      const imgW = contentW * 0.4;
      const textX = margin.left + imgW + contentW * 0.05;
      const textW = contentW * 0.55;
      let y = margin.top;
      if (c.image) {
        const imgMaxH = hMm * 0.6;
        await drawImage(c.image, margin.left, margin.top + 5, imgW, imgMaxH);
      }
      if (c.heading) y = drawHeading(c.heading, textX, y + 5, 14, textW) + 4;
      if (c.body) {
        const bodyResult = drawBody(c.body, textX, y, textW, hMm - y - margin.bottom);
        result.overflowText = bodyResult.overflowText;
      }
      break;
    }
    case "full-image": {
      if (c.image) await drawImage(c.image, margin.left, margin.top, contentW, hMm - margin.top - margin.bottom - (c.heading ? 10 : 0));
      if (c.heading) {
        doc.setFontSize(8);
        doc.setFont(font, "italic");
        doc.setTextColor(150, 150, 150);
        doc.text(c.heading, wMm / 2, hMm - 4, { align: "center" });
      }
      break;
    }
    case "two-column": {
      let y = margin.top;
      if (c.heading) y = drawHeading(c.heading, margin.left, y + 5, 14, contentW) + 6;
      if (c.body) {
        const colW = (contentW - 8) / 2;
        const lines = wrapText(doc, c.body, colW);
        const maxLines = Math.floor((hMm - y - margin.bottom) / lineH);
        const mid = Math.ceil(Math.min(lines.length, maxLines) / 2);
        doc.setFontSize(baseFontSize);
        doc.setFont(font, "normal");
        doc.setTextColor(...bodyColor);
        doc.text(lines.slice(0, mid), margin.left, y);
        doc.text(lines.slice(mid, maxLines), margin.left + colW + 8, y);
        if (lines.length > maxLines) {
          // Overflow for two-column
          const overflowLines = lines.slice(maxLines);
          result.overflowText = overflowLines.join(" ");
        }
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
      let y = margin.top;
      if (c.heading) y = drawHeading(c.heading, margin.left, y + 5, 14, contentW) + 6;
      doc.setFontSize(baseFontSize);
      doc.setFont(font, "normal");
      doc.setTextColor(...bodyColor);
      for (const item of (c.items || [])) {
        if (y > hMm - margin.bottom) break;
        doc.setDrawColor(...accentColor);
        doc.rect(margin.left, y - 2.5, 3.5, 3.5);
        const lines = wrapText(doc, item, contentW - 8);
        doc.text(lines, margin.left + 6, y);
        y += lines.length * baseFontSize * 0.45 + 3;
      }
      break;
    }
    case "key-takeaways": {
      let y = margin.top;
      if (c.heading) y = drawHeading(c.heading, margin.left, y + 5, 14, contentW) + 6;
      doc.setFontSize(baseFontSize);
      let idx = 1;
      for (const item of (c.items || [])) {
        if (y > hMm - margin.bottom) break;
        doc.setFont(font, "bold");
        doc.setTextColor(...accentColor);
        doc.text(`${idx}.`, margin.left, y);
        doc.setFont(font, "normal");
        doc.setTextColor(...bodyColor);
        const lines = wrapText(doc, item, contentW - 10);
        doc.text(lines, margin.left + 8, y);
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
        doc.setFontSize(10);
        doc.setFont(font, "bold");
        const textW = doc.getTextWidth(c.subheading);
        const btnPadding = 20;
        const btnW = Math.max(40, Math.min(textW + btnPadding, contentW * 0.8));
        const btnH = 10;
        doc.setFillColor(...accentColor);
        doc.roundedRect(wMm / 2 - btnW / 2, btnY, btnW, btnH, 2, 2, "F");
        doc.setTextColor(255, 255, 255);
        doc.text(c.subheading, wMm / 2, btnY + 6.5, { align: "center" });
      }
      break;
    }
    default: {
      let y = margin.top;
      if (c.heading) y = drawHeading(c.heading, margin.left, y + 5, 16, contentW) + 4;
      if (c.body) {
        const bodyResult = drawBody(c.body, margin.left, y, contentW, hMm - y - margin.bottom);
        result.overflowText = bodyResult.overflowText;
      }
      break;
    }
  }

  return result;
}

/**
 * Render a cover page.
 */
function renderCoverPage(
  doc: jsPDF,
  title: string,
  subtitle: string | undefined,
  wMm: number,
  hMm: number,
  config: PDFStyleConfig
) {
  const font = getFontFamily(config);
  const headingColor = hexToRgb(config.headingColor || "#1a1a2e");
  const accentColor = hexToRgb(config.accentColor || "#6366f1");

  // Accent bar at top
  const [ar, ag, ab] = accentColor;
  doc.setFillColor(ar, ag, ab);
  doc.rect(0, 0, wMm, hMm * 0.03, "F");

  // Title
  const centerY = hMm * 0.38;
  doc.setFontSize(28);
  doc.setFont(font, "bold");
  doc.setTextColor(...headingColor);
  const titleLines = wrapText(doc, title, wMm * 0.7);
  doc.text(titleLines, wMm / 2, centerY, { align: "center" });

  // Decorative line
  const lineY = centerY + titleLines.length * 12 + 6;
  doc.setDrawColor(ar, ag, ab);
  doc.setLineWidth(0.5);
  doc.line(wMm / 2 - 20, lineY, wMm / 2 + 20, lineY);

  if (subtitle) {
    doc.setFontSize(13);
    doc.setFont(font, "normal");
    doc.setTextColor(100, 100, 100);
    const subLines = wrapText(doc, subtitle, wMm * 0.6);
    doc.text(subLines, wMm / 2, lineY + 10, { align: "center" });
  }
}

/**
 * Render a table of contents page. Returns actual page-number mapping.
 */
function renderTocPage(
  doc: jsPDF,
  tocEntries: { title: string; pageNum: number }[],
  wMm: number,
  hMm: number,
  config: PDFStyleConfig
) {
  const font = getFontFamily(config);
  const headingColor = hexToRgb(config.headingColor || "#1a1a2e");
  const bodyColor = hexToRgb(config.bodyColor || "#3c3c3c");
  const margin = getMargins(wMm, hMm, config);

  let y = margin.top + 5;
  doc.setFontSize(20);
  doc.setFont(font, "bold");
  doc.setTextColor(...headingColor);
  doc.text("Table of Contents", wMm / 2, y, { align: "center" });
  y += 14;

  doc.setFontSize(11);
  doc.setFont(font, "normal");
  const contentW = wMm - margin.left - margin.right;
  
  for (const entry of tocEntries) {
    if (y > hMm - margin.bottom) break;
    doc.setTextColor(...bodyColor);
    const titleLines = wrapText(doc, entry.title, contentW - 20);
    doc.text(titleLines[0], margin.left, y);
    doc.setTextColor(150, 150, 150);
    doc.text(String(entry.pageNum), wMm - margin.right, y, { align: "right" });
    
    // Dot leader
    const titleWidth = doc.getTextWidth(titleLines[0]);
    const numWidth = doc.getTextWidth(String(entry.pageNum));
    const dotStart = margin.left + titleWidth + 2;
    const dotEnd = wMm - margin.right - numWidth - 2;
    if (dotEnd > dotStart + 5) {
      doc.setTextColor(200, 200, 200);
      let dx = dotStart;
      while (dx < dotEnd) {
        doc.text(".", dx, y);
        dx += 2;
      }
    }
    
    y += titleLines.length * 6 + 3;
  }
}

/**
 * Add page numbers to all pages (skip first page if it's a cover).
 */
function addPageNumbers(doc: jsPDF, totalPages: number, skipFirst: boolean, wMm: number, hMm: number) {
  const font = doc.getFont().fontName || "helvetica";
  for (let i = 0; i < totalPages; i++) {
    if (skipFirst && i === 0) continue;
    doc.setPage(i + 1);
    doc.setFontSize(9);
    doc.setFont(font, "normal");
    doc.setTextColor(150, 150, 150);
    const pageLabel = skipFirst ? String(i) : String(i + 1);
    doc.text(pageLabel, wMm / 2, hMm - 5, { align: "center" });
  }
}

export async function generatePDFFromPages(
  pages: EbookPageData[],
  pdfStyle: PDFStyleConfig,
  title: string,
  canvasDataURLs?: Record<string, string>,
  options?: {
    includeCoverPage?: boolean;
    includeToc?: boolean;
    sectionTitles?: string[];
  }
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

  let currentPdfPage = 0;
  const hasCover = options?.includeCoverPage !== false;
  const hasToc = options?.includeToc !== false && (options?.sectionTitles?.length ?? 0) > 0;

  // 1. Cover page
  if (hasCover) {
    renderPageBackground(doc, pdfStyle.themeName, wMm, hMm, pdfStyle.backgroundColor);
    renderCoverPage(doc, title, undefined, wMm, hMm, pdfStyle);
    currentPdfPage++;
  }

  // 2. TOC page (placeholder — we'll update page numbers after rendering content)
  const tocPageIndex = currentPdfPage;
  if (hasToc) {
    doc.addPage([wMm, hMm]);
    renderPageBackground(doc, pdfStyle.themeName, wMm, hMm, pdfStyle.backgroundColor);
    currentPdfPage++;
  }

  // Track which PDF page each chapter-opener lands on
  const chapterPageMap: { title: string; pageNum: number }[] = [];

  // 3. Render content pages with overflow handling
  for (let i = 0; i < pages.length; i++) {
    if (currentPdfPage > 0) {
      doc.addPage([wMm, hMm]);
    }
    currentPdfPage++;

    const page = pages[i];
    const dataURL = canvasDataURLs?.[page.id];

    // Track chapter openers for TOC
    if (page.layout === "chapter-opener" && page.content.heading) {
      chapterPageMap.push({ title: page.content.heading, pageNum: currentPdfPage });
    }

    if (dataURL) {
      try {
        doc.addImage(dataURL, "PNG", 0, 0, wMm, hMm);
        continue;
      } catch (err) {
        console.warn("Failed to add canvas image, falling back:", err);
      }
    }

    // Render with jsPDF
    renderPageBackground(doc, pdfStyle.themeName, wMm, hMm, pdfStyle.backgroundColor);
    const renderResult = await renderPage(doc, page, wMm, hMm, pdfStyle);

    // Handle overflow: create continuation pages for remaining text
    let overflowText = renderResult.overflowText;
    while (overflowText && overflowText.trim()) {
      doc.addPage([wMm, hMm]);
      currentPdfPage++;
      renderPageBackground(doc, pdfStyle.themeName, wMm, hMm, pdfStyle.backgroundColor);

      const continuationPage: EbookPageData = {
        id: crypto.randomUUID(),
        layout: "full-text",
        content: { body: overflowText },
        order: 0,
      };
      const contResult = await renderPage(doc, continuationPage, wMm, hMm, pdfStyle);
      overflowText = contResult.overflowText;
    }
  }

  // 4. Render TOC with actual page numbers
  if (hasToc && chapterPageMap.length > 0) {
    doc.setPage(tocPageIndex + 1);
    // Clear the page by redrawing background
    renderPageBackground(doc, pdfStyle.themeName, wMm, hMm, pdfStyle.backgroundColor);
    renderTocPage(doc, chapterPageMap, wMm, hMm, pdfStyle);
  }

  // 5. Add page numbers
  addPageNumbers(doc, currentPdfPage, hasCover, wMm, hMm);

  return doc.output("blob");
}

/**
 * Generate PDF from raw markdown (fallback when no page layouts exist).
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
  const bodyColor = hexToRgb(pdfStyle.bodyColor || "#3c3c3c");
  const margin = wMm * 0.1;
  const contentW = wMm - margin * 2;

  const doc = new jsPDF({
    orientation: wMm > hMm ? "landscape" : "portrait",
    unit: "mm",
    format: [wMm, hMm],
  });

  renderPageBackground(doc, pdfStyle.themeName, wMm, hMm, pdfStyle.backgroundColor);

  doc.setFont(font);
  let y = margin;
  const lineH = baseFontSize * 0.45;

  const addNewPage = () => {
    doc.addPage([wMm, hMm]);
    renderPageBackground(doc, pdfStyle.themeName, wMm, hMm, pdfStyle.backgroundColor);
    y = margin;
  };

  const lines = markdown.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      y += lineH;
      if (y > hMm - margin) addNewPage();
      continue;
    }

    if (trimmed.startsWith("# ")) {
      doc.setFontSize(20);
      doc.setFont(font, "bold");
      doc.setTextColor(...headingColor);
      const wrapped = wrapText(doc, trimmed.slice(2), contentW);
      if (y + wrapped.length * 8 > hMm - margin) addNewPage();
      doc.text(wrapped, margin, y);
      y += wrapped.length * 8 + 4;
    } else if (trimmed.startsWith("## ")) {
      doc.setFontSize(16);
      doc.setFont(font, "bold");
      doc.setTextColor(...headingColor);
      if (y > margin + 20) addNewPage();
      const wrapped = wrapText(doc, trimmed.slice(3), contentW);
      doc.text(wrapped, margin, y);
      y += wrapped.length * 7 + 4;
    } else if (trimmed.startsWith("### ")) {
      doc.setFontSize(13);
      doc.setFont(font, "bold");
      doc.setTextColor(...headingColor);
      if (y + 10 > hMm - margin) addNewPage();
      const wrapped = wrapText(doc, trimmed.slice(4), contentW);
      doc.text(wrapped, margin, y);
      y += wrapped.length * 6 + 3;
    } else if (trimmed.startsWith("---")) {
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y, wMm - margin, y);
      y += 4;
    } else if (trimmed.startsWith("![")) {
      continue;
    } else {
      doc.setFontSize(baseFontSize);
      doc.setFont(font, "normal");
      doc.setTextColor(...bodyColor);
      const clean = trimmed.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1");
      const wrapped = wrapText(doc, clean, contentW);
      if (y + wrapped.length * lineH > hMm - margin) addNewPage();
      doc.text(wrapped, margin, y);
      y += wrapped.length * lineH + 2;
    }
  }

  // Add page numbers
  const totalPages = doc.getNumberOfPages();
  addPageNumbers(doc, totalPages, false, wMm, hMm);

  return doc.output("blob");
}
