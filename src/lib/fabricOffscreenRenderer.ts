import { Canvas, Textbox, Rect, Circle, FabricImage, FabricObject } from "fabric";
import { EbookPageData, PAGE_SIZES, PageSizeKey } from "@/components/content/ebookLayouts";
import { PDFStyleConfig } from "@/components/content/PDFStyleSettings";
import { pageDataToFabricJSON } from "./fabricPageSerializer";

/**
 * Render pages with fabricJSON to data URLs using an offscreen Fabric canvas.
 * Only pages that have fabricJSON get rendered; others are skipped.
 */
export async function renderPagesToDataURLs(
  pages: EbookPageData[],
  pdfStyle: PDFStyleConfig
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  const pageSize = (pdfStyle.pageSize || "6x9") as PageSizeKey;
  const dims = PAGE_SIZES[pageSize];

  // Only render pages that have fabricJSON data
  const fabricPages = pages.filter((p) => p.fabricJSON);
  if (fabricPages.length === 0) return result;

  // Create a temporary offscreen canvas element
  const canvasEl = document.createElement("canvas");
  canvasEl.width = dims.width;
  canvasEl.height = dims.height;
  canvasEl.style.display = "none";
  document.body.appendChild(canvasEl);

  try {
    const canvas = new Canvas(canvasEl, {
      width: dims.width,
      height: dims.height,
      renderOnAddRemove: false,
    });

    for (const page of fabricPages) {
      try {
        canvas.clear();
        canvas.backgroundColor = pdfStyle.backgroundColor || "#ffffff";
        await canvas.loadFromJSON(page.fabricJSON);
        canvas.renderAll();

        result[page.id] = canvas.toDataURL({
          format: "png",
          quality: 1,
          multiplier: 2,
        });
      } catch (err) {
        console.warn(`Failed to render page ${page.id} from fabricJSON:`, err);
      }
    }

    canvas.dispose();
  } finally {
    document.body.removeChild(canvasEl);
  }

  return result;
}
