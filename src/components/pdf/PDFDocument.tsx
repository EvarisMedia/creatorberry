/**
 * Root PDF document component using @react-pdf/renderer.
 * Assembles cover, TOC, chapter openers, and section pages.
 */
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import { EbookPageData, PageContent, LayoutType } from "@/components/content/ebookLayouts";
import { PDFStyleConfig } from "@/components/content/PDFStyleSettings";
import { EbookTemplate, resolveTemplate } from "./ebookTemplates";

// ── Page dimensions in points (1pt = 1/72 inch) ──
const PAGE_DIMS: Record<string, { width: number; height: number }> = {
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

// ── Helpers ──
function getDims(pageSize: string) {
  return PAGE_DIMS[pageSize] || PAGE_DIMS["6x9"];
}

function getMargin(width: number) {
  return Math.round(width * 0.08);
}

function bodyFontSize(config: PDFStyleConfig): number {
  if (config.bodyFontSize) return config.bodyFontSize;
  return config.fontSize === "small" ? 10 : config.fontSize === "large" ? 14 : 12;
}

function headingFontSize(config: PDFStyleConfig, scale: number): number {
  if (config.headingFontSize) return config.headingFontSize * scale;
  return bodyFontSize(config) * scale;
}

// ── Cover Page ──
function CoverPage({
  title,
  template,
  config,
  dims,
}: {
  title: string;
  template: EbookTemplate;
  config: PDFStyleConfig;
  dims: { width: number; height: number };
}) {
  const margin = getMargin(dims.width);
  return (
    <Page size={[dims.width, dims.height]} style={{ backgroundColor: template.colors.background }}>
      {/* Accent bar */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: dims.height * 0.03,
          backgroundColor: template.colors.accent,
        }}
      />
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: margin * 1.5,
        }}
      >
        <Text
          style={{
            fontSize: headingFontSize(config, 2.3),
            fontFamily: template.fonts.heading,
            fontWeight: "bold",
            color: template.colors.heading,
            textAlign: "center",
            marginBottom: 12,
          }}
        >
          {title}
        </Text>
        {/* Decorative line */}
        <View
          style={{
            width: 60,
            height: 1,
            backgroundColor: template.colors.accent,
            marginTop: 6,
          }}
        />
      </View>
    </Page>
  );
}

// ── TOC Page ──
function TableOfContentsPage({
  entries,
  template,
  config,
  dims,
}: {
  entries: { title: string; pageNum: number }[];
  template: EbookTemplate;
  config: PDFStyleConfig;
  dims: { width: number; height: number };
}) {
  const margin = getMargin(dims.width);
  const bfs = bodyFontSize(config);
  return (
    <Page size={[dims.width, dims.height]} style={{ backgroundColor: template.colors.background, padding: margin }}>
      <Text
        style={{
          fontSize: headingFontSize(config, 1.6),
          fontFamily: template.fonts.heading,
          fontWeight: "bold",
          color: template.colors.heading,
          textAlign: "center",
          marginBottom: 20,
        }}
      >
        Table of Contents
      </Text>
      {entries.map((entry, i) => (
        <View
          key={i}
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 8,
            paddingBottom: 4,
            borderBottomWidth: 0.5,
            borderBottomColor: template.colors.mutedText + "33",
          }}
        >
          <Text
            style={{
              fontSize: bfs,
              fontFamily: template.fonts.body,
              color: template.colors.text,
              flex: 1,
            }}
          >
            {entry.title}
          </Text>
          <Text
            style={{
              fontSize: bfs,
              fontFamily: template.fonts.body,
              color: template.colors.mutedText,
              marginLeft: 8,
            }}
          >
            {entry.pageNum}
          </Text>
        </View>
      ))}
    </Page>
  );
}

// ── Page Number Footer ──
function PageFooter({ template, config }: { template: EbookTemplate; config: PDFStyleConfig }) {
  return (
    <Text
      style={{
        position: "absolute",
        bottom: 12,
        left: 0,
        right: 0,
        textAlign: "center",
        fontSize: 9,
        fontFamily: template.fonts.body,
        color: template.colors.mutedText,
      }}
      render={({ pageNumber, totalPages }) => `${pageNumber}`}
      fixed
    />
  );
}

// ── Content Page renderer ──
function ContentPage({
  page,
  template,
  config,
  dims,
  showPageNumber,
}: {
  page: EbookPageData;
  template: EbookTemplate;
  config: PDFStyleConfig;
  dims: { width: number; height: number };
  showPageNumber?: boolean;
}) {
  const margin = getMargin(dims.width);
  const bfs = bodyFontSize(config);
  const c = page.content;

  const headingStyle = {
    fontSize: headingFontSize(config, 1.3),
    fontFamily: template.fonts.heading,
    fontWeight: "bold" as const,
    color: template.colors.heading,
    marginBottom: 8,
  };

  const subheadingStyle = {
    fontSize: bfs * 0.85,
    fontFamily: template.fonts.body,
    color: template.colors.mutedText,
    textTransform: "uppercase" as const,
    letterSpacing: 2,
    marginBottom: 6,
  };

  const bodyTextStyle = {
    fontSize: bfs,
    fontFamily: template.fonts.body,
    color: template.colors.text,
    lineHeight: 1.6,
  };

  const renderLayout = () => {
    switch (page.layout) {
      case "title":
        return (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: margin * 1.5 }}>
            {c.heading && (
              <Text style={{ ...headingStyle, fontSize: headingFontSize(config, 2), textAlign: "center" }}>
                {c.heading}
              </Text>
            )}
            {c.subheading && (
              <Text style={{ ...bodyTextStyle, fontSize: bfs * 1.1, color: template.colors.mutedText, textAlign: "center", marginTop: 8 }}>
                {c.subheading}
              </Text>
            )}
            {c.attribution && (
              <Text style={{ ...bodyTextStyle, fontSize: bfs * 0.85, color: template.colors.mutedText, textAlign: "center", marginTop: 24 }}>
                {c.attribution}
              </Text>
            )}
          </View>
        );

      case "chapter-opener":
        return (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: margin * 1.2 }}>
            {c.subheading && <Text style={subheadingStyle}>{c.subheading}</Text>}
            {c.heading && (
              <Text style={{ ...headingStyle, fontSize: headingFontSize(config, 1.6), textAlign: "center" }}>
                {c.heading}
              </Text>
            )}
            <View style={{ width: 40, height: 1, backgroundColor: template.colors.mutedText, marginVertical: 10 }} />
            {c.body && (
              <Text style={{ ...bodyTextStyle, textAlign: "center", maxWidth: "80%" }}>
                {c.body}
              </Text>
            )}
          </View>
        );

      case "full-text":
        return (
          <View style={{ flex: 1, padding: margin }}>
            {c.heading && <Text style={headingStyle}>{c.heading}</Text>}
            {c.body && <Text style={bodyTextStyle}>{c.body}</Text>}
          </View>
        );

      case "text-image":
        return (
          <View style={{ flex: 1, flexDirection: "row", padding: margin, gap: 12 }}>
            <View style={{ flex: 1 }}>
              {c.heading && <Text style={headingStyle}>{c.heading}</Text>}
              {c.body && <Text style={bodyTextStyle}>{c.body}</Text>}
            </View>
            {c.image && (
              <View style={{ width: "38%" }}>
                <Image src={c.image} style={{ width: "100%", objectFit: "contain" }} />
              </View>
            )}
          </View>
        );

      case "image-text":
        return (
          <View style={{ flex: 1, flexDirection: "row", padding: margin, gap: 12 }}>
            {c.image && (
              <View style={{ width: "38%" }}>
                <Image src={c.image} style={{ width: "100%", objectFit: "contain" }} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              {c.heading && <Text style={headingStyle}>{c.heading}</Text>}
              {c.body && <Text style={bodyTextStyle}>{c.body}</Text>}
            </View>
          </View>
        );

      case "full-image":
        return (
          <View style={{ flex: 1, padding: margin }}>
            {c.image && (
              <Image src={c.image} style={{ width: "100%", flex: 1, objectFit: "contain" }} />
            )}
            {c.heading && (
              <Text style={{ ...bodyTextStyle, fontSize: bfs * 0.75, fontStyle: "italic", textAlign: "center", color: template.colors.mutedText, marginTop: 6 }}>
                {c.heading}
              </Text>
            )}
          </View>
        );

      case "two-column":
        return (
          <View style={{ flex: 1, padding: margin }}>
            {c.heading && <Text style={headingStyle}>{c.heading}</Text>}
            {c.body && (
              <View style={{ flexDirection: "row", gap: 16 }}>
                {splitTextInHalf(c.body).map((half, i) => (
                  <View key={i} style={{ flex: 1 }}>
                    <Text style={bodyTextStyle}>{half}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        );

      case "quote":
        return (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: margin * 1.5 }}>
            <Text style={{ fontSize: 36, color: template.colors.mutedText + "55", marginBottom: 4 }}>"</Text>
            <Text style={{ ...bodyTextStyle, fontSize: bfs * 1.2, fontStyle: "italic", textAlign: "center", color: template.colors.heading }}>
              {c.quote || c.body || ""}
            </Text>
            {c.attribution && (
              <Text style={{ ...bodyTextStyle, fontSize: bfs * 0.85, color: template.colors.mutedText, marginTop: 12 }}>
                — {c.attribution}
              </Text>
            )}
          </View>
        );

      case "checklist":
        return (
          <View style={{ flex: 1, padding: margin }}>
            {c.heading && <Text style={headingStyle}>{c.heading}</Text>}
            {(c.items || []).map((item, i) => (
              <View key={i} style={{ flexDirection: "row", marginBottom: 6, gap: 6 }}>
                <View style={{ width: 10, height: 10, borderWidth: 1, borderColor: template.colors.accent, marginTop: 2 }} />
                <Text style={{ ...bodyTextStyle, flex: 1 }}>{item}</Text>
              </View>
            ))}
          </View>
        );

      case "key-takeaways":
        return (
          <View style={{ flex: 1, padding: margin }}>
            {c.heading && <Text style={headingStyle}>{c.heading}</Text>}
            {(c.items || []).map((item, i) => (
              <View key={i} style={{ flexDirection: "row", marginBottom: 8, gap: 8 }}>
                <Text style={{ fontSize: bfs, fontWeight: "bold", color: template.colors.accent }}>{i + 1}.</Text>
                <Text style={{ ...bodyTextStyle, flex: 1 }}>{item}</Text>
              </View>
            ))}
          </View>
        );

      case "call-to-action":
        return (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: margin * 1.5 }}>
            {c.heading && (
              <Text style={{ ...headingStyle, fontSize: headingFontSize(config, 1.5), textAlign: "center" }}>
                {c.heading}
              </Text>
            )}
            {c.body && (
              <Text style={{ ...bodyTextStyle, textAlign: "center", color: template.colors.mutedText, marginBottom: 16, maxWidth: "80%" }}>
                {c.body}
              </Text>
            )}
            {c.subheading && (
              <View style={{ backgroundColor: template.colors.accent, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 4 }}>
                <Text style={{ fontSize: bfs * 0.9, fontWeight: "bold", color: "#ffffff" }}>
                  {c.subheading}
                </Text>
              </View>
            )}
          </View>
        );

      default:
        return (
          <View style={{ flex: 1, padding: margin }}>
            {c.heading && <Text style={headingStyle}>{c.heading}</Text>}
            {c.body && <Text style={bodyTextStyle}>{c.body}</Text>}
          </View>
        );
    }
  };

  return (
    <Page size={[dims.width, dims.height]} style={{ backgroundColor: template.colors.background }}>
      {renderLayout()}
      {showPageNumber && <PageFooter template={template} config={config} />}
    </Page>
  );
}

// ── Utility ──
function splitTextInHalf(text: string): [string, string] {
  const words = text.split(/\s+/);
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
}

// ── Main Document Props ──
export interface PDFDocumentProps {
  title: string;
  pages: EbookPageData[];
  pdfStyle: PDFStyleConfig;
  sectionTitles?: string[];
  includeCover?: boolean;
  includeToc?: boolean;
}

/**
 * Full ebook PDF document component.
 * Handles cover, TOC, and all content pages with automatic page breaks.
 */
export function EbookPDFDocument({
  title,
  pages,
  pdfStyle,
  sectionTitles,
  includeCover = true,
  includeToc = true,
}: PDFDocumentProps) {
  const template = resolveTemplate(pdfStyle.themeName);
  const dims = getDims(pdfStyle.pageSize || "6x9");

  // Build TOC entries from chapter-opener pages
  const tocEntries: { title: string; pageNum: number }[] = [];
  let pageCounter = (includeCover ? 1 : 0) + (includeToc && sectionTitles?.length ? 1 : 0);
  for (const page of pages) {
    pageCounter++;
    if (page.layout === "chapter-opener" && page.content.heading) {
      tocEntries.push({ title: page.content.heading, pageNum: pageCounter });
    }
  }

  // If no chapter openers found but sectionTitles provided, use those
  if (tocEntries.length === 0 && sectionTitles?.length) {
    sectionTitles.forEach((t, i) => {
      tocEntries.push({ title: t, pageNum: (includeCover ? 2 : 1) + (includeToc ? 1 : 0) + i });
    });
  }

  return (
    <Document title={title} author="CreatorBerry">
      {includeCover && (
        <CoverPage title={title} template={template} config={pdfStyle} dims={dims} />
      )}

      {includeToc && tocEntries.length > 0 && (
        <TableOfContentsPage entries={tocEntries} template={template} config={pdfStyle} dims={dims} />
      )}

      {pages.map((page) => (
        <ContentPage
          key={page.id}
          page={page}
          template={template}
          config={pdfStyle}
          dims={dims}
          showPageNumber
        />
      ))}
    </Document>
  );
}
