import { renderPageLayout, EbookPageData, PAGE_SIZES, PageSizeKey, ContentBlock, contentToBlocks } from "./ebookLayouts";
import { PDFStyleConfig } from "./PDFStyleSettings";
import { FreeformPageRenderer } from "./FreeformPageRenderer";
import { PageBackgroundRenderer } from "./PageBackgroundRenderer";
import { THEME_BACKGROUNDS } from "./themeBackgrounds";

interface Props {
  page: EbookPageData;
  pageSize: PageSizeKey;
  pdfStyle: PDFStyleConfig;
  scale: number;
  isSelected?: boolean;
  onClick?: () => void;
  editable?: boolean;
  freeformMode?: boolean;
  onFieldChange?: (field: string, value: string) => void;
  onItemChange?: (index: number, value: string) => void;
  onImageAction?: (action: "generate" | "upload" | "remove") => void;
  onBlocksChange?: (blocks: ContentBlock[]) => void;
  onFreeformImageAction?: (action: "generate" | "upload" | "remove", blockId: string) => void;
}

export function EbookPage({
  page, pageSize, pdfStyle, scale, isSelected, onClick, editable,
  freeformMode, onFieldChange, onItemChange, onImageAction,
  onBlocksChange, onFreeformImageAction,
}: Props) {
  const dims = PAGE_SIZES[pageSize];
  const fontFamily = pdfStyle.fontFamily === "serif" ? "Georgia, serif" : pdfStyle.fontFamily === "mono" ? "'Courier New', monospace" : "system-ui, sans-serif";
  const fontSize = pdfStyle.fontSize === "small" ? "14px" : pdfStyle.fontSize === "large" ? "18px" : "16px";

  const styleProps = {
    fontFamily,
    headingColor: pdfStyle.headingColor,
    fontSize,
    accentColor: pdfStyle.accentColor,
    backgroundColor: pdfStyle.backgroundColor,
    bodyColor: pdfStyle.bodyColor,
  };

  // Get or generate blocks for freeform mode
  const blocks = freeformMode
    ? (page.blocks && page.blocks.length > 0 ? page.blocks : contentToBlocks(page.content, page.layout))
    : [];

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
        className={`border shadow-md overflow-hidden ${editable ? "" : "cursor-pointer"} transition-all ${isSelected ? "ring-2 ring-primary" : "hover:ring-1 hover:ring-primary/50"} relative`}
        style={{
          width: dims.width,
          height: dims.height,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          backgroundColor: pdfStyle.backgroundColor || undefined,
        }}
      >
        {/* Background decorations */}
        {pdfStyle.themeName && THEME_BACKGROUNDS[pdfStyle.themeName] && (
          <PageBackgroundRenderer
            design={THEME_BACKGROUNDS[pdfStyle.themeName]}
            width={dims.width}
            height={dims.height}
          />
        )}
        {/* Content with auto-padding from theme */}
        <div
          className="relative h-full"
          style={{
            zIndex: 1,
            ...(pdfStyle.themeName && THEME_BACKGROUNDS[pdfStyle.themeName]
              ? {
                  paddingTop: THEME_BACKGROUNDS[pdfStyle.themeName].contentPadding.top,
                  paddingRight: THEME_BACKGROUNDS[pdfStyle.themeName].contentPadding.right,
                  paddingBottom: THEME_BACKGROUNDS[pdfStyle.themeName].contentPadding.bottom,
                  paddingLeft: THEME_BACKGROUNDS[pdfStyle.themeName].contentPadding.left,
                }
              : {}),
          }}
        >
          {freeformMode ? (
            <FreeformPageRenderer
              blocks={blocks}
              style={styleProps}
              editable={editable}
              onBlocksChange={onBlocksChange}
              onImageAction={onFreeformImageAction}
            />
          ) : (
            renderPageLayout(
              {
                content: page.content,
                style: styleProps,
                editable,
                onFieldChange,
                onItemChange,
                onImageAction,
              },
              page.layout
            )
          )}
        </div>
      </div>
    </div>
  );
}