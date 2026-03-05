/**
 * DOCX exporter using the `docx` npm package.
 * Converts EbookPageData[] into a styled .docx blob.
 */
import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  ImageRun,
  PageBreak,
  Packer,
  TableOfContents,
  BorderStyle,
} from "docx";
import { EbookPageData } from "@/components/content/ebookLayouts";
import { resolveTemplate, EbookTemplate } from "@/components/pdf/ebookTemplates";

interface DocxOptions {
  title: string;
  themeName?: string;
  includeToc?: boolean;
  includeCover?: boolean;
  sectionTitles?: string[];
}

function hexToRgb(hex: string): string {
  return hex.replace("#", "");
}

/**
 * Fetch an image URL and return it as a Buffer-like Uint8Array for docx ImageRun.
 */
async function fetchImageAsBuffer(url: string): Promise<{ buffer: Uint8Array; width: number; height: number } | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();

    // Try to get dimensions from a temporary image element
    const imgUrl = URL.createObjectURL(blob);
    const dims = await new Promise<{ width: number; height: number }>((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
        URL.revokeObjectURL(imgUrl);
      };
      img.onerror = () => {
        resolve({ width: 400, height: 300 });
        URL.revokeObjectURL(imgUrl);
      };
      img.src = imgUrl;
    });

    return { buffer: new Uint8Array(arrayBuffer), ...dims };
  } catch {
    return null;
  }
}

function createBodyParagraphs(text: string, template: EbookTemplate): Paragraph[] {
  if (!text) return [];

  // Split by newlines, each becomes a paragraph
  return text.split("\n").filter(Boolean).map(
    (line) =>
      new Paragraph({
        children: [
          new TextRun({
            text: line,
            size: 22, // 11pt
            color: hexToRgb(template.colors.text),
            font: template.fonts.body === "Times-Roman" ? "Times New Roman" : "Calibri",
          }),
        ],
        spacing: { after: 120, line: 276 },
      })
  );
}

function createItemsParagraphs(items: string[], template: EbookTemplate): Paragraph[] {
  return items.map(
    (item) =>
      new Paragraph({
        children: [
          new TextRun({
            text: `• ${item}`,
            size: 22,
            color: hexToRgb(template.colors.text),
            font: template.fonts.body === "Times-Roman" ? "Times New Roman" : "Calibri",
          }),
        ],
        spacing: { after: 80 },
        indent: { left: 360 },
      })
  );
}

export async function generateDOCX(
  pages: EbookPageData[],
  options: DocxOptions
): Promise<Blob> {
  const template = resolveTemplate(options.themeName);
  const headingFont = template.fonts.heading === "Times-Roman" ? "Times New Roman" : "Calibri";
  const bodyFont = template.fonts.body === "Times-Roman" ? "Times New Roman" : "Calibri";
  const accentColor = hexToRgb(template.colors.accent);
  const headingColor = hexToRgb(template.colors.heading);

  const children: Paragraph[] = [];

  // Cover page
  if (options.includeCover !== false) {
    children.push(
      new Paragraph({ spacing: { before: 3000 } }),
      new Paragraph({
        children: [
          new TextRun({
            text: options.title,
            bold: true,
            size: 56,
            color: headingColor,
            font: headingFont,
          }),
        ],
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({
        children: [new TextRun({ text: "", break: 1 })],
        pageBreakBefore: false,
      }),
      // Accent bar
      new Paragraph({
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 6, color: accentColor },
        },
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: "",
            break: 1,
          }),
        ],
      })
    );
    // Page break after cover
    children.push(
      new Paragraph({
        children: [new PageBreak()],
      })
    );
  }

  // TOC placeholder
  if (options.includeToc !== false && options.sectionTitles && options.sectionTitles.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Table of Contents",
            bold: true,
            size: 36,
            color: headingColor,
            font: headingFont,
          }),
        ],
        spacing: { after: 300 },
      })
    );

    for (const [i, title] of options.sectionTitles.entries()) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${i + 1}. ${title}`,
              size: 24,
              color: hexToRgb(template.colors.text),
              font: bodyFont,
            }),
          ],
          spacing: { after: 100 },
          indent: { left: 240 },
        })
      );
    }

    children.push(
      new Paragraph({
        children: [new PageBreak()],
      })
    );
  }

  // Content pages
  for (const page of pages) {
    const { content, layout } = page;

    // Heading
    if (content.heading) {
      const isChapter = layout === "chapter-opener" || layout === "title";
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: content.heading,
              bold: true,
              size: isChapter ? 40 : 28,
              color: headingColor,
              font: headingFont,
            }),
          ],
          heading: isChapter ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2,
          spacing: { before: isChapter ? 400 : 200, after: 200 },
          alignment: isChapter ? AlignmentType.CENTER : AlignmentType.LEFT,
          pageBreakBefore: isChapter,
        })
      );
    }

    // Subheading
    if (content.subheading) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: content.subheading,
              italics: true,
              size: 24,
              color: hexToRgb(template.colors.mutedText),
              font: bodyFont,
            }),
          ],
          spacing: { after: 160 },
          alignment: layout === "chapter-opener" ? AlignmentType.CENTER : AlignmentType.LEFT,
        })
      );
    }

    // Quote
    if (content.quote) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `"${content.quote}"`,
              italics: true,
              size: 26,
              color: accentColor,
              font: headingFont,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 300, after: 120 },
          indent: { left: 720, right: 720 },
        })
      );
      if (content.attribution) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `— ${content.attribution}`,
                size: 20,
                color: hexToRgb(template.colors.mutedText),
                font: bodyFont,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          })
        );
      }
    }

    // Image
    if (content.image) {
      const imgData = await fetchImageAsBuffer(content.image);
      if (imgData) {
        // Scale to max 450pt wide
        const maxWidth = 450;
        const scale = Math.min(1, maxWidth / imgData.width);
        children.push(
          new Paragraph({
            children: [
              new ImageRun({
                data: imgData.buffer,
                transformation: {
                  width: Math.round(imgData.width * scale),
                  height: Math.round(imgData.height * scale),
                },
                type: "png",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 200 },
          })
        );
      }
    }

    // Body text
    if (content.body) {
      children.push(...createBodyParagraphs(content.body, template));
    }

    // Items (checklist / key-takeaways)
    if (content.items && content.items.length > 0) {
      children.push(...createItemsParagraphs(content.items, template));
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children,
      },
    ],
  });

  return await Packer.toBlob(doc);
}
