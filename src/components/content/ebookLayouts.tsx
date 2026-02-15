import React from "react";

export interface PageContent {
  heading?: string;
  subheading?: string;
  body?: string;
  image?: string;
  items?: string[];
  quote?: string;
  attribution?: string;
}

export interface EbookPageData {
  id: string;
  layout: LayoutType;
  content: PageContent;
  order: number;
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
  };
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

// Actual page renderer
export function renderPageLayout({ content, style }: PageRenderProps, layout: LayoutType) {
  const headingStyle = { color: style.headingColor, fontFamily: style.fontFamily };
  const bodyStyle = { fontFamily: style.fontFamily, fontSize: style.fontSize };

  switch (layout) {
    case "title":
      return (
        <div className="flex flex-col items-center justify-center h-full text-center px-12" style={bodyStyle}>
          <h1 className="text-3xl font-bold mb-4 leading-tight" style={headingStyle}>{content.heading || "Untitled"}</h1>
          {content.subheading && <p className="text-lg text-muted-foreground">{content.subheading}</p>}
          {content.attribution && <p className="text-sm text-muted-foreground mt-8">{content.attribution}</p>}
        </div>
      );

    case "chapter-opener":
      return (
        <div className="flex flex-col items-center justify-center h-full text-center px-10" style={bodyStyle}>
          {content.subheading && <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">{content.subheading}</p>}
          <h1 className="text-2xl font-bold mb-4" style={headingStyle}>{content.heading || "Chapter"}</h1>
          <div className="w-16 h-px bg-border mb-4" />
          {content.body && <p className="text-sm leading-relaxed text-muted-foreground max-w-[80%]">{content.body}</p>}
        </div>
      );

    case "full-text":
      return (
        <div className="flex flex-col h-full px-10 py-8" style={bodyStyle}>
          {content.heading && <h2 className="text-xl font-bold mb-4" style={headingStyle}>{content.heading}</h2>}
          {content.body && (
            <div className="text-sm leading-relaxed whitespace-pre-wrap flex-1 overflow-hidden">{content.body}</div>
          )}
        </div>
      );

    case "text-image":
      return (
        <div className="flex h-full gap-4 px-6 py-6" style={bodyStyle}>
          <div className="flex-1 flex flex-col">
            {content.heading && <h2 className="text-lg font-bold mb-3" style={headingStyle}>{content.heading}</h2>}
            {content.body && <p className="text-sm leading-relaxed flex-1 overflow-hidden">{content.body}</p>}
          </div>
          <div className="w-[40%] shrink-0">
            {content.image ? (
              <img src={content.image} alt="" className="w-full h-full object-cover rounded" />
            ) : (
              <div className="w-full h-full bg-muted rounded flex items-center justify-center text-muted-foreground text-xs">Image</div>
            )}
          </div>
        </div>
      );

    case "image-text":
      return (
        <div className="flex h-full gap-4 px-6 py-6" style={bodyStyle}>
          <div className="w-[40%] shrink-0">
            {content.image ? (
              <img src={content.image} alt="" className="w-full h-full object-cover rounded" />
            ) : (
              <div className="w-full h-full bg-muted rounded flex items-center justify-center text-muted-foreground text-xs">Image</div>
            )}
          </div>
          <div className="flex-1 flex flex-col">
            {content.heading && <h2 className="text-lg font-bold mb-3" style={headingStyle}>{content.heading}</h2>}
            {content.body && <p className="text-sm leading-relaxed flex-1 overflow-hidden">{content.body}</p>}
          </div>
        </div>
      );

    case "full-image":
      return (
        <div className="flex flex-col h-full" style={bodyStyle}>
          <div className="flex-1 relative">
            {content.image ? (
              <img src={content.image} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">No image</div>
            )}
          </div>
          {content.heading && (
            <div className="px-6 py-3 text-center">
              <p className="text-xs text-muted-foreground italic">{content.heading}</p>
            </div>
          )}
        </div>
      );

    case "two-column":
      return (
        <div className="flex flex-col h-full px-8 py-6" style={bodyStyle}>
          {content.heading && <h2 className="text-lg font-bold mb-4" style={headingStyle}>{content.heading}</h2>}
          {content.body && (
            <div className="text-sm leading-relaxed flex-1 overflow-hidden" style={{ columns: 2, columnGap: "1.5rem" }}>
              {content.body}
            </div>
          )}
        </div>
      );

    case "quote":
      return (
        <div className="flex flex-col items-center justify-center h-full px-12 text-center" style={bodyStyle}>
          <div className="text-4xl text-muted-foreground/30 mb-2">"</div>
          <blockquote className="text-lg italic leading-relaxed mb-4" style={headingStyle}>
            {content.quote || content.body || "Quote text"}
          </blockquote>
          {content.attribution && <p className="text-sm text-muted-foreground">— {content.attribution}</p>}
        </div>
      );

    case "checklist":
      return (
        <div className="flex flex-col h-full px-10 py-8" style={bodyStyle}>
          {content.heading && <h2 className="text-lg font-bold mb-4" style={headingStyle}>{content.heading}</h2>}
          <div className="space-y-2 flex-1 overflow-hidden">
            {(content.items || []).map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="w-4 h-4 border-2 border-muted-foreground/30 rounded mt-0.5 shrink-0" />
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      );

    case "key-takeaways":
      return (
        <div className="flex flex-col h-full px-10 py-8" style={bodyStyle}>
          {content.heading && <h2 className="text-lg font-bold mb-4" style={headingStyle}>{content.heading}</h2>}
          <div className="space-y-3 flex-1 overflow-hidden">
            {(content.items || []).map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                  {i + 1}
                </div>
                <span className="text-sm leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
        </div>
      );

    case "call-to-action":
      return (
        <div className="flex flex-col items-center justify-center h-full px-12 text-center" style={bodyStyle}>
          {content.heading && <h2 className="text-2xl font-bold mb-3" style={headingStyle}>{content.heading}</h2>}
          {content.body && <p className="text-sm text-muted-foreground mb-6 max-w-[80%]">{content.body}</p>}
          {content.subheading && (
            <div className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
              {content.subheading}
            </div>
          )}
        </div>
      );

    case "blank":
    default:
      return (
        <div className="flex flex-col h-full px-10 py-8" style={bodyStyle}>
          {content.heading && <h2 className="text-lg font-bold mb-4" style={headingStyle}>{content.heading}</h2>}
          {content.body && <p className="text-sm leading-relaxed">{content.body}</p>}
        </div>
      );
  }
}

export const PAGE_SIZES = {
  "6x9": { width: 432, height: 648, label: '6×9" (Standard Ebook)' },
  "5.5x8.5": { width: 396, height: 612, label: '5.5×8.5" (Digest)' },
  "8.5x11": { width: 612, height: 792, label: '8.5×11" (Letter/Workbook)' },
  "8x8": { width: 576, height: 576, label: '8×8" (Square)' },
} as const;

export type PageSizeKey = keyof typeof PAGE_SIZES;
