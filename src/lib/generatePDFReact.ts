/**
 * New PDF generation using @react-pdf/renderer.
 * Replaces the jsPDF pipeline with declarative React components.
 */
import { pdf } from "@react-pdf/renderer";
import { createElement } from "react";
import { EbookPDFDocument, PDFDocumentProps } from "@/components/pdf/PDFDocument";
import { EbookPageData } from "@/components/content/ebookLayouts";
import { PDFStyleConfig } from "@/components/content/PDFStyleSettings";

/**
 * Generate a PDF blob from ebook pages using @react-pdf/renderer.
 */
export async function generatePDFFromPagesReact(
  pages: EbookPageData[],
  pdfStyle: PDFStyleConfig,
  title: string,
  options?: {
    includeCoverPage?: boolean;
    includeToc?: boolean;
    sectionTitles?: string[];
  }
): Promise<Blob> {
  const props: PDFDocumentProps = {
    title,
    pages,
    pdfStyle,
    sectionTitles: options?.sectionTitles,
    includeCover: options?.includeCoverPage !== false,
    includeToc: options?.includeToc !== false,
  };

  const doc = createElement(EbookPDFDocument, props);
  const blob = await pdf(doc).toBlob();
  return blob;
}

/**
 * Generate a PDF blob from raw markdown (fallback).
 * Converts markdown to simple full-text pages, then renders.
 */
export async function generatePDFFromMarkdownReact(
  markdown: string,
  pdfStyle: PDFStyleConfig,
  title: string
): Promise<Blob> {
  const pages = markdownToPages(markdown);

  return generatePDFFromPagesReact(pages, pdfStyle, title, {
    includeCoverPage: true,
    includeToc: false,
  });
}

/**
 * Convert raw markdown text into simple EbookPageData pages.
 */
function markdownToPages(markdown: string): EbookPageData[] {
  const pages: EbookPageData[] = [];
  const lines = markdown.split("\n");

  let currentHeading = "";
  let currentBody = "";
  let order = 0;

  const flush = () => {
    if (currentBody.trim() || currentHeading) {
      // Split long body into ~300-word chunks
      const words = currentBody.trim().split(/\s+/);
      const WORDS_PER_PAGE = 300;

      if (words.length <= WORDS_PER_PAGE) {
        pages.push({
          id: crypto.randomUUID(),
          layout: currentHeading && pages.length > 0 ? "chapter-opener" : "full-text",
          content: {
            heading: currentHeading || undefined,
            body: currentBody.trim() || undefined,
          },
          order: order++,
        });
      } else {
        // First page with heading
        pages.push({
          id: crypto.randomUUID(),
          layout: "chapter-opener",
          content: {
            heading: currentHeading || undefined,
            body: words.slice(0, WORDS_PER_PAGE).join(" "),
          },
          order: order++,
        });

        // Continuation pages
        for (let i = WORDS_PER_PAGE; i < words.length; i += WORDS_PER_PAGE) {
          pages.push({
            id: crypto.randomUUID(),
            layout: "full-text",
            content: {
              body: words.slice(i, i + WORDS_PER_PAGE).join(" "),
            },
            order: order++,
          });
        }
      }

      currentHeading = "";
      currentBody = "";
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("# ") || trimmed.startsWith("## ")) {
      flush();
      currentHeading = trimmed.replace(/^#+\s+/, "");
    } else if (trimmed.startsWith("---")) {
      flush();
    } else if (trimmed.startsWith("![")) {
      // Skip image markdown
      continue;
    } else {
      // Clean markdown formatting
      const clean = trimmed
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .replace(/\*(.*?)\*/g, "$1");
      if (clean) {
        currentBody += clean + "\n";
      } else {
        currentBody += "\n";
      }
    }
  }
  flush();

  return pages;
}
