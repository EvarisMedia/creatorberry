import React from "react";
import { ImagePlus } from "lucide-react";
export interface PageContent {
  heading?: string;
  subheading?: string;
  body?: string;
  image?: string;
  items?: string[];
  quote?: string;
  attribution?: string;
}

export interface ContentBlock {
  id: string;
  type: "heading" | "subheading" | "body" | "image" | "items" | "quote" | "attribution" | "spacer";
  content: string;
  items?: string[];
  imageWidth?: number; // percentage 10-100
  imageHeight?: number; // px
  alignment?: "left" | "center" | "right";
}

export interface EbookPageData {
  id: string;
  layout: LayoutType;
  content: PageContent;
  order: number;
  blocks?: ContentBlock[];
}

// Convert template content + layout into ordered content blocks
export function contentToBlocks(content: PageContent, layout: LayoutType): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  const mkId = () => crypto.randomUUID();

  // Heading
  if (content.heading) {
    blocks.push({ id: mkId(), type: "heading", content: content.heading, alignment: ["title", "chapter-opener", "call-to-action", "quote"].includes(layout) ? "center" : "left" });
  }
  // Subheading
  if (content.subheading) {
    blocks.push({ id: mkId(), type: "subheading", content: content.subheading, alignment: ["title", "chapter-opener", "call-to-action"].includes(layout) ? "center" : "left" });
  }
  // Image
  if (content.image || ["text-image", "image-text", "full-image"].includes(layout)) {
    blocks.push({ id: mkId(), type: "image", content: content.image || "", imageWidth: layout === "full-image" ? 100 : 40, alignment: "center" });
  }
  // Body
  if (content.body) {
    blocks.push({ id: mkId(), type: "body", content: content.body, alignment: ["title", "chapter-opener", "call-to-action", "quote"].includes(layout) ? "center" : "left" });
  }
  // Quote
  if (content.quote) {
    blocks.push({ id: mkId(), type: "quote", content: content.quote, alignment: "center" });
  }
  // Attribution
  if (content.attribution) {
    blocks.push({ id: mkId(), type: "attribution", content: content.attribution, alignment: "center" });
  }
  // Items
  if (content.items && content.items.length > 0) {
    blocks.push({ id: mkId(), type: "items", content: "", items: content.items });
  }

  if (blocks.length === 0) {
    blocks.push({ id: mkId(), type: "body", content: "Click to edit..." });
  }

  return blocks;
}

// Convert blocks back to PageContent for backward compatibility
export function blocksToContent(blocks: ContentBlock[]): PageContent {
  const content: PageContent = {};
  for (const block of blocks) {
    switch (block.type) {
      case "heading": content.heading = block.content; break;
      case "subheading": content.subheading = block.content; break;
      case "body": content.body = block.content; break;
      case "image": content.image = block.content; break;
      case "quote": content.quote = block.content; break;
      case "attribution": content.attribution = block.content; break;
      case "items": content.items = block.items || []; break;
    }
  }
  return content;
}

export type LayoutType =
  | "title"
  | "chapter-opener"
  | "full-text"
  | "text-image"
  | "image-text"
  | "full-image"
  | "two-column"
  | "quote"
  | "checklist"
  | "key-takeaways"
  | "call-to-action"
  | "blank";

export interface LayoutTemplate {
  type: LayoutType;
  label: string;
  description: string;
  icon: string;
}

export const LAYOUT_TEMPLATES: LayoutTemplate[] = [
  { type: "title", label: "Title Page", description: "Large centered title with subtitle", icon: "📘" },
  { type: "chapter-opener", label: "Chapter Opener", description: "Chapter number, title, intro paragraph", icon: "📖" },
  { type: "full-text", label: "Full Text", description: "Clean single-column body text", icon: "📝" },
  { type: "text-image", label: "Text + Image", description: "Text left, image right", icon: "🖼️" },
  { type: "image-text", label: "Image + Text", description: "Image left, text right", icon: "🎨" },
  { type: "full-image", label: "Full Image", description: "Full-bleed image with caption", icon: "📷" },
  { type: "two-column", label: "Two Column", description: "Body text in two columns", icon: "📰" },
  { type: "quote", label: "Quote", description: "Large centered quote with attribution", icon: "💬" },
  { type: "checklist", label: "Checklist", description: "Actionable checklist items", icon: "✅" },
  { type: "key-takeaways", label: "Key Takeaways", description: "Summary points with icons", icon: "🎯" },
  { type: "call-to-action", label: "Call to Action", description: "CTA with heading and description", icon: "🚀" },
  { type: "blank", label: "Blank", description: "Empty page for freeform content", icon: "⬜" },
];

interface PageRenderProps {
  content: PageContent;
  style: {
    fontFamily: string;
    headingColor: string;
    fontSize: string;
    accentColor?: string;
    backgroundColor?: string;
    bodyColor?: string;
  };
  editable?: boolean;
  onFieldChange?: (field: string, value: string) => void;
  onItemChange?: (index: number, value: string) => void;
  onImageAction?: (action: "generate" | "upload" | "remove") => void;
}

// Wireframe thumbnail for the layout picker
export function LayoutWireframe({ type }: { type: LayoutType }) {
  const base = "w-full h-full flex flex-col p-2 gap-1";
  const bar = "bg-muted-foreground/30 rounded-sm";
  const block = "bg-muted-foreground/15 rounded-sm flex-1";

  switch (type) {
    case "title":
      return (
        <div className={base + " items-center justify-center"}>
          <div className={`${bar} w-3/4 h-3`} />
          <div className={`${bar} w-1/2 h-2`} />
          <div className={`${bar} w-1/3 h-2 mt-2`} />
        </div>
      );
    case "chapter-opener":
      return (
        <div className={base + " items-center justify-center"}>
          <div className={`${bar} w-1/4 h-2`} />
          <div className={`${bar} w-3/4 h-3 mt-1`} />
          <div className="w-1/2 h-px bg-muted-foreground/20 my-1" />
          <div className={`${bar} w-full h-2`} />
          <div className={`${bar} w-5/6 h-2`} />
        </div>
      );
    case "full-text":
      return (
        <div className={base}>
          <div className={`${bar} w-2/3 h-2.5`} />
          <div className={`${bar} w-full h-1.5 mt-1`} />
          <div className={`${bar} w-full h-1.5`} />
          <div className={`${bar} w-5/6 h-1.5`} />
          <div className={`${bar} w-full h-1.5`} />
          <div className={`${bar} w-4/5 h-1.5`} />
          <div className={`${bar} w-full h-1.5`} />
        </div>
      );
    case "text-image":
      return (
        <div className={base + " flex-row gap-2"}>
          <div className="flex-1 flex flex-col gap-1">
            <div className={`${bar} w-3/4 h-2`} />
            <div className={`${bar} w-full h-1.5`} />
            <div className={`${bar} w-5/6 h-1.5`} />
            <div className={`${bar} w-full h-1.5`} />
          </div>
          <div className={`${block} w-2/5 min-h-full`} />
        </div>
      );
    case "image-text":
      return (
        <div className={base + " flex-row gap-2"}>
          <div className={`${block} w-2/5 min-h-full`} />
          <div className="flex-1 flex flex-col gap-1">
            <div className={`${bar} w-3/4 h-2`} />
            <div className={`${bar} w-full h-1.5`} />
            <div className={`${bar} w-5/6 h-1.5`} />
            <div className={`${bar} w-full h-1.5`} />
          </div>
        </div>
      );
    case "full-image":
      return (
        <div className={base + " justify-end"}>
          <div className={`${block} w-full`} style={{ minHeight: "70%" }} />
          <div className={`${bar} w-1/2 h-2 mx-auto mt-1`} />
        </div>
      );
    case "two-column":
      return (
        <div className={base}>
          <div className={`${bar} w-1/2 h-2.5 mb-1`} />
          <div className="flex gap-2 flex-1">
            <div className="flex-1 flex flex-col gap-1">
              <div className={`${bar} w-full h-1.5`} />
              <div className={`${bar} w-5/6 h-1.5`} />
              <div className={`${bar} w-full h-1.5`} />
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <div className={`${bar} w-full h-1.5`} />
              <div className={`${bar} w-4/5 h-1.5`} />
              <div className={`${bar} w-full h-1.5`} />
            </div>
          </div>
        </div>
      );
    case "quote":
      return (
        <div className={base + " items-center justify-center"}>
          <div className="text-muted-foreground/30 text-lg leading-none">"</div>
          <div className={`${bar} w-5/6 h-2`} />
          <div className={`${bar} w-3/4 h-2`} />
          <div className={`${bar} w-1/3 h-1.5 mt-2`} />
        </div>
      );
    case "checklist":
      return (
        <div className={base}>
          <div className={`${bar} w-1/2 h-2.5 mb-1`} />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-1">
              <div className="w-2 h-2 border border-muted-foreground/30 rounded-sm shrink-0" />
              <div className={`${bar} h-1.5`} style={{ width: `${60 + Math.random() * 30}%` }} />
            </div>
          ))}
        </div>
      );
    case "key-takeaways":
      return (
        <div className={base}>
          <div className={`${bar} w-2/3 h-2.5 mb-1`} />
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-1">
              <div className="w-2 h-2 rounded-full bg-muted-foreground/30 shrink-0 mt-0.5" />
              <div className="flex-1 flex flex-col gap-0.5">
                <div className={`${bar} w-3/4 h-1.5`} />
                <div className={`${bar} w-full h-1`} />
              </div>
            </div>
          ))}
        </div>
      );
    case "call-to-action":
      return (
        <div className={base + " items-center justify-center"}>
          <div className={`${bar} w-3/4 h-3`} />
          <div className={`${bar} w-5/6 h-2 mt-1`} />
          <div className={`${bar} w-4/6 h-2`} />
          <div className="bg-muted-foreground/25 rounded w-1/3 h-3 mt-2" />
        </div>
      );
    case "blank":
    default:
      return <div className={base + " items-center justify-center"}><span className="text-muted-foreground/20 text-xs">Empty</span></div>;
  }
}

// Editable text helper
function EditableText({
  value,
  field,
  editable,
  onFieldChange,
  className,
  style,
  as: Tag = "div",
}: {
  value?: string;
  field: string;
  editable?: boolean;
  onFieldChange?: (field: string, value: string) => void;
  className?: string;
  style?: React.CSSProperties;
  as?: keyof JSX.IntrinsicElements;
}) {
  if (!value && !editable) return null;
  const El = Tag as any;
  if (editable) {
    return (
      <El
        contentEditable
        suppressContentEditableWarning
        onBlur={(e: React.FocusEvent<HTMLElement>) =>
          onFieldChange?.(field, e.currentTarget.textContent || "")
        }
        className={`${className || ""} outline-none hover:ring-1 hover:ring-primary/30 focus:ring-2 focus:ring-primary/50 rounded px-0.5 cursor-text`}
        style={style}
      >
        {value || `[${field}]`}
      </El>
    );
  }
  return <El className={className} style={style}>{value}</El>;
}

// Image slot with overlay
function ImageSlot({
  src,
  editable,
  onImageAction,
  className,
}: {
  src?: string;
  editable?: boolean;
  onImageAction?: (action: "generate" | "upload" | "remove") => void;
  className?: string;
}) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <div
      className={`relative ${className || ""}`}
      onMouseEnter={() => editable && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {src ? (
        <img src={src} alt="" className="w-full h-full object-cover rounded" />
      ) : (
        <div className={`w-full h-full ${editable ? "border-2 border-dashed border-primary/30 bg-muted/30" : "bg-muted"} rounded flex flex-col items-center justify-center gap-2 p-4`}>
          <ImagePlus className="w-8 h-8 text-muted-foreground/40" />
          <span className="text-xs text-muted-foreground">{editable ? "Click to add image" : "Image"}</span>
          {editable && onImageAction && (
            <div className="flex gap-1.5 mt-1">
              <button
                onClick={(e) => { e.stopPropagation(); onImageAction("generate"); }}
                className="px-2.5 py-1 text-[10px] font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Generate
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onImageAction("upload"); }}
                className="px-2.5 py-1 text-[10px] font-medium bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
              >
                Upload
              </button>
            </div>
          )}
        </div>
      )}
      {editable && hovered && (
        <div className="absolute inset-0 bg-background/80 rounded flex items-center justify-center gap-1">
          <button
            onClick={() => onImageAction?.("generate")}
            className="px-2 py-1 text-[10px] bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Generate
          </button>
          <button
            onClick={() => onImageAction?.("upload")}
            className="px-2 py-1 text-[10px] bg-secondary text-secondary-foreground rounded hover:bg-secondary/90"
          >
            Upload
          </button>
          {src && (
            <button
              onClick={() => onImageAction?.("remove")}
              className="px-2 py-1 text-[10px] bg-destructive text-destructive-foreground rounded hover:bg-destructive/90"
            >
              Remove
            </button>
          )}
        </div>
      )}
      {editable && !src && !hovered && (
        <button
          onClick={() => onImageAction?.("upload")}
          className="absolute inset-0 rounded cursor-pointer"
        />
      )}
    </div>
  );
}

// Editable list items
function EditableItems({
  items,
  editable,
  onItemChange,
  renderItem,
}: {
  items: string[];
  editable?: boolean;
  onItemChange?: (index: number, value: string) => void;
  renderItem: (item: string, index: number, editEl?: React.ReactNode) => React.ReactNode;
}) {
  return (
    <>
      {(items || []).map((item, i) => {
        if (editable) {
          const editEl = (
            <span
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => onItemChange?.(i, e.currentTarget.textContent || "")}
              className="outline-none hover:ring-1 hover:ring-primary/30 focus:ring-2 focus:ring-primary/50 rounded px-0.5 cursor-text"
            >
              {item}
            </span>
          );
          return <React.Fragment key={i}>{renderItem(item, i, editEl)}</React.Fragment>;
        }
        return <React.Fragment key={i}>{renderItem(item, i)}</React.Fragment>;
      })}
    </>
  );
}

// Actual page renderer
export function renderPageLayout(props: PageRenderProps, layout: LayoutType) {
  const { content, style, editable, onFieldChange, onItemChange, onImageAction } = props;
  const headingStyle = { color: style.headingColor, fontFamily: style.fontFamily };
  const bodyStyle: React.CSSProperties = { fontFamily: style.fontFamily, fontSize: style.fontSize, color: style.bodyColor || undefined };
  const accentColor = style.accentColor || style.headingColor;

  switch (layout) {
    case "title":
      return (
        <div className="flex flex-col items-center justify-center h-full text-center px-12" style={bodyStyle}>
          <EditableText value={content.heading} field="heading" editable={editable} onFieldChange={onFieldChange} className="text-3xl font-bold mb-4 leading-tight" style={headingStyle} as="h1" />
          <EditableText value={content.subheading} field="subheading" editable={editable} onFieldChange={onFieldChange} className="text-lg text-muted-foreground" as="p" />
          <EditableText value={content.attribution} field="attribution" editable={editable} onFieldChange={onFieldChange} className="text-sm text-muted-foreground mt-8" as="p" />
        </div>
      );

    case "chapter-opener":
      return (
        <div className="flex flex-col items-center justify-center h-full text-center px-10" style={bodyStyle}>
          <EditableText value={content.subheading} field="subheading" editable={editable} onFieldChange={onFieldChange} className="text-xs uppercase tracking-widest text-muted-foreground mb-2" as="p" />
          <EditableText value={content.heading || "Chapter"} field="heading" editable={editable} onFieldChange={onFieldChange} className="text-2xl font-bold mb-4" style={headingStyle} as="h1" />
          <div className="w-16 h-px bg-border mb-4" />
          <EditableText value={content.body} field="body" editable={editable} onFieldChange={onFieldChange} className="text-sm leading-relaxed text-muted-foreground max-w-[80%]" as="p" />
        </div>
      );

    case "full-text":
      return (
        <div className="flex flex-col h-full px-10 py-8" style={bodyStyle}>
          <EditableText value={content.heading} field="heading" editable={editable} onFieldChange={onFieldChange} className="text-xl font-bold mb-4" style={headingStyle} as="h2" />
          <EditableText value={content.body} field="body" editable={editable} onFieldChange={onFieldChange} className="text-sm leading-relaxed whitespace-pre-wrap flex-1 overflow-hidden" />
        </div>
      );

    case "text-image":
      return (
        <div className="flex h-full gap-4 px-6 py-6" style={bodyStyle}>
          <div className="flex-1 flex flex-col">
            <EditableText value={content.heading} field="heading" editable={editable} onFieldChange={onFieldChange} className="text-lg font-bold mb-3" style={headingStyle} as="h2" />
            <EditableText value={content.body} field="body" editable={editable} onFieldChange={onFieldChange} className="text-sm leading-relaxed flex-1 overflow-hidden" as="p" />
          </div>
          <ImageSlot src={content.image} editable={editable} onImageAction={onImageAction} className="w-[40%] shrink-0" />
        </div>
      );

    case "image-text":
      return (
        <div className="flex h-full gap-4 px-6 py-6" style={bodyStyle}>
          <ImageSlot src={content.image} editable={editable} onImageAction={onImageAction} className="w-[40%] shrink-0" />
          <div className="flex-1 flex flex-col">
            <EditableText value={content.heading} field="heading" editable={editable} onFieldChange={onFieldChange} className="text-lg font-bold mb-3" style={headingStyle} as="h2" />
            <EditableText value={content.body} field="body" editable={editable} onFieldChange={onFieldChange} className="text-sm leading-relaxed flex-1 overflow-hidden" as="p" />
          </div>
        </div>
      );

    case "full-image":
      return (
        <div className="flex flex-col h-full" style={bodyStyle}>
          <ImageSlot src={content.image} editable={editable} onImageAction={onImageAction} className="flex-1" />
          <EditableText value={content.heading} field="heading" editable={editable} onFieldChange={onFieldChange} className="px-6 py-3 text-center text-xs text-muted-foreground italic" as="p" />
        </div>
      );

    case "two-column":
      return (
        <div className="flex flex-col h-full px-8 py-6" style={bodyStyle}>
          <EditableText value={content.heading} field="heading" editable={editable} onFieldChange={onFieldChange} className="text-lg font-bold mb-4" style={headingStyle} as="h2" />
          <EditableText value={content.body} field="body" editable={editable} onFieldChange={onFieldChange} className="text-sm leading-relaxed flex-1 overflow-hidden" style={{ columns: 2, columnGap: "1.5rem" }} />
        </div>
      );

    case "quote":
      return (
        <div className="flex flex-col items-center justify-center h-full px-12 text-center" style={bodyStyle}>
          <div className="text-4xl text-muted-foreground/30 mb-2">"</div>
          <EditableText value={content.quote || content.body || "Quote text"} field="quote" editable={editable} onFieldChange={onFieldChange} className="text-lg italic leading-relaxed mb-4" style={headingStyle} as="blockquote" />
          <EditableText value={content.attribution ? `— ${content.attribution}` : undefined} field="attribution" editable={editable} onFieldChange={onFieldChange} className="text-sm text-muted-foreground" as="p" />
        </div>
      );

    case "checklist":
      return (
        <div className="flex flex-col h-full px-10 py-8" style={bodyStyle}>
          <EditableText value={content.heading} field="heading" editable={editable} onFieldChange={onFieldChange} className="text-lg font-bold mb-4" style={headingStyle} as="h2" />
          <div className="space-y-2 flex-1 overflow-hidden">
            <EditableItems
              items={content.items || []}
              editable={editable}
              onItemChange={onItemChange}
              renderItem={(item, i, editEl) => (
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 border-2 rounded mt-0.5 shrink-0" style={{ borderColor: accentColor }} />
                  {editEl || <span className="text-sm">{item}</span>}
                </div>
              )}
            />
          </div>
        </div>
      );

    case "key-takeaways":
      return (
        <div className="flex flex-col h-full px-10 py-8" style={bodyStyle}>
          <EditableText value={content.heading} field="heading" editable={editable} onFieldChange={onFieldChange} className="text-lg font-bold mb-4" style={headingStyle} as="h2" />
          <div className="space-y-3 flex-1 overflow-hidden">
            <EditableItems
              items={content.items || []}
              editable={editable}
              onItemChange={onItemChange}
              renderItem={(item, i, editEl) => (
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ backgroundColor: accentColor + "1a", color: accentColor }}>
                    {i + 1}
                  </div>
                  {editEl || <span className="text-sm leading-relaxed">{item}</span>}
                </div>
              )}
            />
          </div>
        </div>
      );

    case "call-to-action":
      return (
        <div className="flex flex-col items-center justify-center h-full px-12 text-center" style={bodyStyle}>
          <EditableText value={content.heading} field="heading" editable={editable} onFieldChange={onFieldChange} className="text-2xl font-bold mb-3" style={headingStyle} as="h2" />
          <EditableText value={content.body} field="body" editable={editable} onFieldChange={onFieldChange} className="text-sm text-muted-foreground mb-6 max-w-[80%]" as="p" />
          {content.subheading && (
            <div className="px-6 py-2.5 rounded-lg text-sm font-medium" style={{ backgroundColor: accentColor, color: "#ffffff" }}>
              {editable ? (
                <span
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => onFieldChange?.("subheading", e.currentTarget.textContent || "")}
                  className="outline-none"
                >
                  {content.subheading}
                </span>
              ) : (
                content.subheading
              )}
            </div>
          )}
        </div>
      );

    case "blank":
    default:
      return (
        <div className="flex flex-col h-full px-10 py-8" style={bodyStyle}>
          <EditableText value={content.heading} field="heading" editable={editable} onFieldChange={onFieldChange} className="text-lg font-bold mb-4" style={headingStyle} as="h2" />
          <EditableText value={content.body} field="body" editable={editable} onFieldChange={onFieldChange} className="text-sm leading-relaxed" as="p" />
        </div>
      );
  }
}

export const PAGE_SIZES = {
  "6x9": { width: 432, height: 648, label: '6×9" (Standard Ebook)' },
  "5.5x8.5": { width: 396, height: 612, label: '5.5×8.5" (Digest)' },
  "8.5x11": { width: 612, height: 792, label: '8.5×11" (Letter/Workbook)' },
  "8x8": { width: 576, height: 576, label: '8×8" (Square)' },
  "a4": { width: 595, height: 842, label: 'A4 Portrait' },
  "a4-landscape": { width: 842, height: 595, label: 'A4 Landscape' },
  "a5": { width: 420, height: 595, label: 'A5 Portrait' },
  "letter-landscape": { width: 792, height: 612, label: 'Letter Landscape' },
  "16x9": { width: 960, height: 540, label: '16:9 Landscape (Slides)' },
} as const;

export type PageSizeKey = keyof typeof PAGE_SIZES;
