import { renderPageLayout, EbookPageData, PAGE_SIZES, PageSizeKey } from "./ebookLayouts";
import { PDFStyleConfig } from "./PDFStyleSettings";

interface Props {
  page: EbookPageData;
  pageSize: PageSizeKey;
  pdfStyle: PDFStyleConfig;
  scale: number;
  isSelected?: boolean;
  onClick?: () => void;
  editable?: boolean;
  onFieldChange?: (field: string, value: string) => void;
  onItemChange?: (index: number, value: string) => void;
  onImageAction?: (action: "generate" | "upload" | "remove") => void;
}

export function EbookPage({ page, pageSize, pdfStyle, scale, isSelected, onClick, editable, onFieldChange, onItemChange, onImageAction }: Props) {
  const dims = PAGE_SIZES[pageSize];
  const fontFamily = pdfStyle.fontFamily === "serif" ? "Georgia, serif" : pdfStyle.fontFamily === "mono" ? "'Courier New', monospace" : "system-ui, sans-serif";
  const fontSize = pdfStyle.fontSize === "small" ? "14px" : pdfStyle.fontSize === "large" ? "18px" : "16px";

  return (
    <div
      className="relative"
      style={{
        width: dims.width * scale,
        height: dims.height * scale,
      }}
      onClick={onClick}
    >
      <div
        className={`border shadow-md overflow-hidden ${editable ? "" : "cursor-pointer"} transition-all ${isSelected ? "ring-2 ring-primary" : "hover:ring-1 hover:ring-primary/50"}`}
        style={{
          width: dims.width,
          height: dims.height,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          backgroundColor: pdfStyle.backgroundColor || undefined,
        }}
      >
        {renderPageLayout(
          {
            content: page.content,
            style: { fontFamily, headingColor: pdfStyle.headingColor, fontSize, accentColor: pdfStyle.accentColor, backgroundColor: pdfStyle.backgroundColor, bodyColor: pdfStyle.bodyColor },
            editable,
            onFieldChange,
            onItemChange,
            onImageAction,
          },
          page.layout
        )}
      </div>
    </div>
  );
}
