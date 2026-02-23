import { EbookPageData, PageContent, LayoutType, PAGE_SIZES, PageSizeKey } from "@/components/content/ebookLayouts";
import { PDFStyleConfig } from "@/components/content/PDFStyleSettings";
import { THEME_BACKGROUNDS } from "@/components/content/themeBackgrounds";

/**
 * Converts EbookPageData content into Fabric.js canvas JSON objects.
 * Each content field becomes a Fabric object (Textbox, Image, Rect, etc.)
 */

interface FabricObjectJSON {
  type: string;
  left: number;
  top: number;
  width?: number;
  height?: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  fill?: string;
  textAlign?: string;
  src?: string;
  scaleX?: number;
  scaleY?: number;
  selectable?: boolean;
  evented?: boolean;
  opacity?: number;
  rx?: number;
  ry?: number;
  radius?: number;
  angle?: number;
  [key: string]: unknown;
}

interface FabricCanvasJSON {
  version: string;
  objects: FabricObjectJSON[];
  background?: string;
}

export function pageDataToFabricJSON(
  page: EbookPageData,
  pageSize: PageSizeKey,
  pdfStyle: PDFStyleConfig
): FabricCanvasJSON {
  const dims = PAGE_SIZES[pageSize];
  const { content, layout } = page;
  const objects: FabricObjectJSON[] = [];

  const fontFamily = pdfStyle.fontFamily === "serif" ? "Georgia, serif"
    : pdfStyle.fontFamily === "mono" ? "'Courier New', monospace"
    : "system-ui, -apple-system, sans-serif";

  const baseFontSize = pdfStyle.fontSize === "small" ? 14 : pdfStyle.fontSize === "large" ? 18 : 16;
  const headingColor = pdfStyle.headingColor || "#1a1a2e";
  const bodyColor = pdfStyle.bodyColor || "#334155";
  const accentColor = pdfStyle.accentColor || "#6366f1";

  // Get content padding from theme
  const themePad = pdfStyle.themeName && THEME_BACKGROUNDS[pdfStyle.themeName]
    ? THEME_BACKGROUNDS[pdfStyle.themeName].contentPadding
    : { top: 40, right: 40, bottom: 40, left: 40 };

  const contentLeft = themePad.left;
  const contentTop = themePad.top;
  const contentWidth = dims.width - themePad.left - themePad.right;
  const contentHeight = dims.height - themePad.top - themePad.bottom;

  // Add theme background decorations as non-selectable objects
  if (pdfStyle.themeName && THEME_BACKGROUNDS[pdfStyle.themeName]) {
    const theme = THEME_BACKGROUNDS[pdfStyle.themeName];
    for (const el of theme.elements) {
      const bgObj = backgroundElementToFabric(el, dims.width, dims.height);
      if (bgObj) {
        objects.push({ ...bgObj, selectable: false, evented: false });
      }
    }
  }

  // Layout-specific content placement
  switch (layout) {
    case "title":
      layoutTitle(objects, content, contentLeft, contentTop, contentWidth, contentHeight, fontFamily, baseFontSize, headingColor, bodyColor);
      break;
    case "chapter-opener":
      layoutChapterOpener(objects, content, contentLeft, contentTop, contentWidth, contentHeight, fontFamily, baseFontSize, headingColor, bodyColor);
      break;
    case "full-text":
      layoutFullText(objects, content, contentLeft, contentTop, contentWidth, contentHeight, fontFamily, baseFontSize, headingColor, bodyColor);
      break;
    case "text-image":
      layoutTextImage(objects, content, contentLeft, contentTop, contentWidth, contentHeight, fontFamily, baseFontSize, headingColor, bodyColor, false);
      break;
    case "image-text":
      layoutTextImage(objects, content, contentLeft, contentTop, contentWidth, contentHeight, fontFamily, baseFontSize, headingColor, bodyColor, true);
      break;
    case "full-image":
      layoutFullImage(objects, content, dims.width, dims.height, fontFamily, bodyColor);
      break;
    case "quote":
      layoutQuote(objects, content, contentLeft, contentTop, contentWidth, contentHeight, fontFamily, baseFontSize, headingColor);
      break;
    case "checklist":
    case "key-takeaways":
      layoutList(objects, content, contentLeft, contentTop, contentWidth, contentHeight, fontFamily, baseFontSize, headingColor, bodyColor, accentColor);
      break;
    case "call-to-action":
      layoutCTA(objects, content, contentLeft, contentTop, contentWidth, contentHeight, fontFamily, baseFontSize, headingColor, bodyColor, accentColor);
      break;
    default:
      layoutFullText(objects, content, contentLeft, contentTop, contentWidth, contentHeight, fontFamily, baseFontSize, headingColor, bodyColor);
      break;
  }

  return {
    version: "6.0.0",
    objects,
    background: pdfStyle.backgroundColor || "#ffffff",
  };
}

function backgroundElementToFabric(el: any, pageW: number, pageH: number): FabricObjectJSON | null {
  const parsePos = (val: string | undefined, total: number): number | null => {
    if (!val) return null;
    if (val.endsWith("px")) return parseFloat(val);
    if (val.endsWith("%")) return (parseFloat(val) / 100) * total;
    if (val.startsWith("calc(")) {
      const match = val.match(/calc\(\s*100%\s*-\s*(\d+)px\s*\)/);
      if (match) return total - parseFloat(match[1]);
      return total;
    }
    return parseFloat(val) || null;
  };

  const parseSize = (val: string, total: number): number => {
    if (val.endsWith("px")) return parseFloat(val);
    if (val.endsWith("%")) return (parseFloat(val) / 100) * total;
    if (val.startsWith("calc(")) {
      const match = val.match(/calc\(\s*100%\s*-\s*(\d+)px\s*\)/);
      if (match) return total - parseFloat(match[1]);
      return total;
    }
    return parseFloat(val) || 0;
  };

  const w = parseSize(el.size.width, pageW);
  const h = parseSize(el.size.height, pageH);

  let left = el.position.left ? (parsePos(el.position.left, pageW) ?? 0) : 0;
  let top = el.position.top ? (parsePos(el.position.top, pageH) ?? 0) : 0;

  if (el.position.right && !el.position.left) {
    left = pageW - (parsePos(el.position.right, pageW) ?? 0) - w;
  }
  if (el.position.bottom && !el.position.top) {
    top = pageH - (parsePos(el.position.bottom, pageH) ?? 0) - h;
  }

  switch (el.type) {
    case "circle":
      return {
        type: "Circle",
        left,
        top,
        radius: Math.min(w, h) / 2,
        fill: el.color,
        opacity: el.opacity,
      };
    case "rect":
    case "stripe":
    case "line":
      return {
        type: "Rect",
        left,
        top,
        width: w,
        height: h,
        fill: el.color,
        opacity: el.opacity,
        angle: el.rotation || 0,
        rx: el.borderRadius ? parseFloat(el.borderRadius) : 0,
        ry: el.borderRadius ? parseFloat(el.borderRadius) : 0,
      };
    case "gradient":
      return {
        type: "Rect",
        left,
        top,
        width: w,
        height: h,
        fill: el.color,
        opacity: el.opacity * 0.3,
      };
    default:
      return null;
  }
}

// Layout helpers

function layoutTitle(
  objects: FabricObjectJSON[], c: PageContent,
  l: number, t: number, w: number, h: number,
  font: string, baseSize: number, headColor: string, bodyColor: string
) {
  const centerX = l + w / 2;
  const centerY = t + h * 0.4;

  if (c.heading) {
    objects.push({
      type: "Textbox",
      left: l + w * 0.1,
      top: centerY - 30,
      width: w * 0.8,
      text: c.heading,
      fontSize: baseSize * 2,
      fontFamily: font,
      fontWeight: "bold",
      fill: headColor,
      textAlign: "center",
    });
  }
  if (c.subheading) {
    objects.push({
      type: "Textbox",
      left: l + w * 0.15,
      top: centerY + 30,
      width: w * 0.7,
      text: c.subheading,
      fontSize: baseSize * 1.1,
      fontFamily: font,
      fill: bodyColor,
      textAlign: "center",
    });
  }
  if (c.attribution) {
    objects.push({
      type: "Textbox",
      left: l + w * 0.2,
      top: centerY + 80,
      width: w * 0.6,
      text: c.attribution,
      fontSize: baseSize * 0.85,
      fontFamily: font,
      fill: "#999999",
      textAlign: "center",
    });
  }
}

function layoutChapterOpener(
  objects: FabricObjectJSON[], c: PageContent,
  l: number, t: number, w: number, h: number,
  font: string, baseSize: number, headColor: string, bodyColor: string
) {
  const centerY = t + h * 0.35;

  if (c.subheading) {
    objects.push({
      type: "Textbox",
      left: l + w * 0.1,
      top: centerY - 20,
      width: w * 0.8,
      text: c.subheading.toUpperCase(),
      fontSize: baseSize * 0.7,
      fontFamily: font,
      fill: "#999999",
      textAlign: "center",
      charSpacing: 300,
    });
  }
  if (c.heading) {
    objects.push({
      type: "Textbox",
      left: l + w * 0.1,
      top: centerY,
      width: w * 0.8,
      text: c.heading,
      fontSize: baseSize * 1.5,
      fontFamily: font,
      fontWeight: "bold",
      fill: headColor,
      textAlign: "center",
    });
  }
  // Divider line
  objects.push({
    type: "Rect",
    left: l + w * 0.35,
    top: centerY + 40,
    width: w * 0.3,
    height: 1,
    fill: "#cccccc",
    selectable: true,
    evented: true,
  });
  if (c.body) {
    objects.push({
      type: "Textbox",
      left: l + w * 0.1,
      top: centerY + 55,
      width: w * 0.8,
      text: c.body,
      fontSize: baseSize * 0.9,
      fontFamily: font,
      fill: bodyColor,
      textAlign: "center",
    });
  }
}

function layoutFullText(
  objects: FabricObjectJSON[], c: PageContent,
  l: number, t: number, w: number, h: number,
  font: string, baseSize: number, headColor: string, bodyColor: string
) {
  let y = t + 10;
  if (c.heading) {
    objects.push({
      type: "Textbox",
      left: l,
      top: y,
      width: w,
      text: c.heading,
      fontSize: baseSize * 1.3,
      fontFamily: font,
      fontWeight: "bold",
      fill: headColor,
    });
    y += 40;
  }
  if (c.body) {
    objects.push({
      type: "Textbox",
      left: l,
      top: y,
      width: w,
      text: c.body,
      fontSize: baseSize,
      fontFamily: font,
      fill: bodyColor,
      lineHeight: 1.5,
    });
  }
}

function layoutTextImage(
  objects: FabricObjectJSON[], c: PageContent,
  l: number, t: number, w: number, h: number,
  font: string, baseSize: number, headColor: string, bodyColor: string,
  imageFirst: boolean
) {
  const gap = 20;
  const imgW = w * 0.4;
  const textW = w - imgW - gap;
  const textX = imageFirst ? l + imgW + gap : l;
  const imgX = imageFirst ? l : l + textW + gap;

  let y = t + 10;
  if (c.heading) {
    objects.push({
      type: "Textbox",
      left: textX,
      top: y,
      width: textW,
      text: c.heading,
      fontSize: baseSize * 1.15,
      fontFamily: font,
      fontWeight: "bold",
      fill: headColor,
    });
    y += 35;
  }
  if (c.body) {
    objects.push({
      type: "Textbox",
      left: textX,
      top: y,
      width: textW,
      text: c.body,
      fontSize: baseSize,
      fontFamily: font,
      fill: bodyColor,
      lineHeight: 1.5,
    });
  }
  // Image placeholder
  if (c.image) {
    objects.push({
      type: "Image",
      left: imgX,
      top: t,
      width: imgW,
      height: h,
      src: c.image,
    });
  } else {
    objects.push({
      type: "Rect",
      left: imgX,
      top: t,
      width: imgW,
      height: h * 0.6,
      fill: "#f1f5f9",
      rx: 4,
      ry: 4,
    });
  }
}

function layoutFullImage(
  objects: FabricObjectJSON[], c: PageContent,
  pageW: number, pageH: number, font: string, bodyColor: string
) {
  if (c.image) {
    objects.push({
      type: "Image",
      left: 0,
      top: 0,
      width: pageW,
      height: pageH - 30,
      src: c.image,
    });
  } else {
    objects.push({
      type: "Rect",
      left: 10,
      top: 10,
      width: pageW - 20,
      height: pageH - 40,
      fill: "#f1f5f9",
      rx: 4,
      ry: 4,
    });
  }
  if (c.heading) {
    objects.push({
      type: "Textbox",
      left: 10,
      top: pageH - 28,
      width: pageW - 20,
      text: c.heading,
      fontSize: 10,
      fontFamily: font,
      fontStyle: "italic",
      fill: bodyColor,
      textAlign: "center",
    });
  }
}

function layoutQuote(
  objects: FabricObjectJSON[], c: PageContent,
  l: number, t: number, w: number, h: number,
  font: string, baseSize: number, headColor: string
) {
  const centerY = t + h * 0.3;

  objects.push({
    type: "Textbox",
    left: l + w * 0.4,
    top: centerY - 30,
    width: w * 0.2,
    text: '"',
    fontSize: 48,
    fontFamily: font,
    fill: "#cccccc",
    textAlign: "center",
  });

  const quoteText = c.quote || c.body || "Quote text";
  objects.push({
    type: "Textbox",
    left: l + w * 0.1,
    top: centerY + 10,
    width: w * 0.8,
    text: quoteText,
    fontSize: baseSize * 1.1,
    fontFamily: font,
    fontStyle: "italic",
    fill: headColor,
    textAlign: "center",
    lineHeight: 1.5,
  });

  if (c.attribution) {
    objects.push({
      type: "Textbox",
      left: l + w * 0.2,
      top: centerY + 80,
      width: w * 0.6,
      text: `— ${c.attribution}`,
      fontSize: baseSize * 0.85,
      fontFamily: font,
      fill: "#999999",
      textAlign: "center",
    });
  }
}

function layoutList(
  objects: FabricObjectJSON[], c: PageContent,
  l: number, t: number, w: number, h: number,
  font: string, baseSize: number, headColor: string, bodyColor: string, accentColor: string
) {
  let y = t + 10;
  if (c.heading) {
    objects.push({
      type: "Textbox",
      left: l,
      top: y,
      width: w,
      text: c.heading,
      fontSize: baseSize * 1.2,
      fontFamily: font,
      fontWeight: "bold",
      fill: headColor,
    });
    y += 40;
  }
  const items = c.items || [];
  for (let i = 0; i < items.length; i++) {
    objects.push({
      type: "Textbox",
      left: l + 30,
      top: y,
      width: w - 30,
      text: `${i + 1}. ${items[i]}`,
      fontSize: baseSize,
      fontFamily: font,
      fill: bodyColor,
      lineHeight: 1.4,
    });
    y += 30;
  }
}

function layoutCTA(
  objects: FabricObjectJSON[], c: PageContent,
  l: number, t: number, w: number, h: number,
  font: string, baseSize: number, headColor: string, bodyColor: string, accentColor: string
) {
  const centerY = t + h * 0.3;

  if (c.heading) {
    objects.push({
      type: "Textbox",
      left: l + w * 0.1,
      top: centerY,
      width: w * 0.8,
      text: c.heading,
      fontSize: baseSize * 1.6,
      fontFamily: font,
      fontWeight: "bold",
      fill: headColor,
      textAlign: "center",
    });
  }
  if (c.body) {
    objects.push({
      type: "Textbox",
      left: l + w * 0.12,
      top: centerY + 50,
      width: w * 0.76,
      text: c.body,
      fontSize: baseSize,
      fontFamily: font,
      fill: bodyColor,
      textAlign: "center",
    });
  }
  if (c.subheading) {
    // Button rectangle
    const btnW = 150;
    const btnH = 36;
    objects.push({
      type: "Rect",
      left: l + (w - btnW) / 2,
      top: centerY + 100,
      width: btnW,
      height: btnH,
      fill: accentColor,
      rx: 6,
      ry: 6,
    });
    objects.push({
      type: "Textbox",
      left: l + (w - btnW) / 2,
      top: centerY + 108,
      width: btnW,
      text: c.subheading,
      fontSize: baseSize * 0.85,
      fontFamily: font,
      fontWeight: "bold",
      fill: "#ffffff",
      textAlign: "center",
    });
  }
}

/**
 * Convert Fabric canvas JSON back to EbookPageData content for backward compatibility.
 */
export function fabricJSONToPageData(
  json: FabricCanvasJSON,
  existingPage: EbookPageData
): EbookPageData {
  const content: PageContent = {};
  const textObjects = json.objects.filter(o => o.type === "Textbox" && o.selectable !== false);

  // Attempt to reconstruct from text objects
  if (textObjects.length > 0) {
    // First large/bold text is heading
    const sorted = [...textObjects].sort((a, b) => (a.top ?? 0) - (b.top ?? 0));
    for (let i = 0; i < sorted.length; i++) {
      const obj = sorted[i];
      if (i === 0 && (obj.fontWeight === "bold" || (obj.fontSize && obj.fontSize > 18))) {
        content.heading = obj.text;
      } else if (obj.fontStyle === "italic" && !content.quote) {
        content.quote = obj.text;
      } else if (!content.body) {
        content.body = obj.text;
      }
    }
  }

  // Find images
  const imageObj = json.objects.find(o => o.type === "Image" && o.src);
  if (imageObj?.src) {
    content.image = imageObj.src;
  }

  return {
    ...existingPage,
    content: { ...existingPage.content, ...content },
    fabricJSON: json,
  };
}
