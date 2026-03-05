/**
 * EPUB exporter — generates a valid .epub (OEBPS) zip using JSZip.
 * Converts EbookPageData[] into HTML chapters with template-aware CSS.
 */
import JSZip from "jszip";
import { EbookPageData } from "@/components/content/ebookLayouts";
import { resolveTemplate, EbookTemplate } from "@/components/pdf/ebookTemplates";

interface EpubOptions {
  title: string;
  author?: string;
  themeName?: string;
  includeToc?: boolean;
  includeCover?: boolean;
  sectionTitles?: string[];
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function generateCSS(template: EbookTemplate): string {
  const bodyFont = template.fonts.body === "Times-Roman" ? "Georgia, 'Times New Roman', serif" : "'Segoe UI', Calibri, sans-serif";
  const headingFont = template.fonts.heading === "Times-Roman" ? "Georgia, 'Times New Roman', serif" : "'Segoe UI', Calibri, sans-serif";

  return `
body {
  font-family: ${bodyFont};
  color: ${template.colors.text};
  background-color: ${template.colors.background};
  line-height: 1.6;
  margin: 1em;
  padding: 0;
}
h1, h2, h3 {
  font-family: ${headingFont};
  color: ${template.colors.heading};
  margin-top: 1.5em;
  margin-bottom: 0.5em;
}
h1 { font-size: 1.8em; text-align: center; }
h2 { font-size: 1.4em; }
h3 { font-size: 1.2em; }
p { margin: 0.5em 0; }
blockquote {
  font-style: italic;
  color: ${template.colors.accent};
  border-left: 3px solid ${template.colors.accent};
  margin: 1em 0;
  padding: 0.5em 1em;
}
.attribution { text-align: right; color: ${template.colors.mutedText}; font-size: 0.9em; }
ul { padding-left: 1.5em; }
li { margin: 0.3em 0; }
img { max-width: 100%; height: auto; display: block; margin: 1em auto; }
.cover { text-align: center; margin-top: 30%; }
.cover h1 { font-size: 2.2em; }
.chapter-opener { text-align: center; margin-top: 20%; }
.separator { text-align: center; color: ${template.colors.mutedText}; margin: 1em 0; }
`;
}

function pageToHtml(page: EbookPageData, template: EbookTemplate): string {
  const { content, layout } = page;
  const parts: string[] = [];

  const isChapter = layout === "chapter-opener" || layout === "title";

  if (isChapter) {
    parts.push(`<div class="chapter-opener">`);
  }

  if (content.heading) {
    parts.push(`<h1>${escapeHtml(content.heading)}</h1>`);
  }

  if (content.subheading) {
    parts.push(`<h3>${escapeHtml(content.subheading)}</h3>`);
  }

  if (isChapter) {
    parts.push(`<div class="separator">———</div>`);
  }

  if (content.image) {
    parts.push(`<img src="${escapeHtml(content.image)}" alt="" />`);
  }

  if (content.quote) {
    parts.push(`<blockquote>${escapeHtml(content.quote)}</blockquote>`);
    if (content.attribution) {
      parts.push(`<p class="attribution">— ${escapeHtml(content.attribution)}</p>`);
    }
  }

  if (content.body) {
    const paragraphs = content.body.split("\n").filter(Boolean);
    for (const p of paragraphs) {
      parts.push(`<p>${escapeHtml(p)}</p>`);
    }
  }

  if (content.items && content.items.length > 0) {
    parts.push("<ul>");
    for (const item of content.items) {
      parts.push(`<li>${escapeHtml(item)}</li>`);
    }
    parts.push("</ul>");
  }

  if (isChapter) {
    parts.push(`</div>`);
  }

  return parts.join("\n");
}

function wrapInXhtml(body: string, title: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" type="text/css" href="../css/style.css" />
</head>
<body>
${body}
</body>
</html>`;
}

/**
 * Group pages into chapters. A new chapter starts at chapter-opener or title layout.
 */
function groupIntoChapters(pages: EbookPageData[]): { title: string; pages: EbookPageData[] }[] {
  const chapters: { title: string; pages: EbookPageData[] }[] = [];
  let current: { title: string; pages: EbookPageData[] } | null = null;

  for (const page of pages) {
    const isOpener = page.layout === "chapter-opener" || page.layout === "title";
    if (isOpener || !current) {
      current = {
        title: page.content.heading || `Chapter ${chapters.length + 1}`,
        pages: [page],
      };
      chapters.push(current);
    } else {
      current.pages.push(page);
    }
  }

  return chapters;
}

export async function generateEPUB(
  pages: EbookPageData[],
  options: EpubOptions
): Promise<Blob> {
  const template = resolveTemplate(options.themeName);
  const zip = new JSZip();
  const bookId = crypto.randomUUID();
  const author = options.author || "Author";

  // mimetype (must be first, uncompressed)
  zip.file("mimetype", "application/epub+zip", { compression: "STORE" });

  // META-INF/container.xml
  zip.file(
    "META-INF/container.xml",
    `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`
  );

  // CSS
  zip.file("OEBPS/css/style.css", generateCSS(template));

  // Group pages into chapters
  const chapters = groupIntoChapters(pages);
  const chapterFiles: { id: string; filename: string; title: string }[] = [];

  // Cover chapter
  if (options.includeCover !== false) {
    const coverHtml = `<div class="cover"><h1>${escapeHtml(options.title)}</h1><p class="attribution">${escapeHtml(author)}</p></div>`;
    const coverXhtml = wrapInXhtml(coverHtml, options.title);
    zip.file("OEBPS/text/cover.xhtml", coverXhtml);
    chapterFiles.push({ id: "cover", filename: "cover.xhtml", title: "Cover" });
  }

  // TOC chapter
  if (options.includeToc !== false && chapters.length > 1) {
    let tocHtml = `<h1>Table of Contents</h1>\n<ul>\n`;
    chapters.forEach((ch, i) => {
      tocHtml += `<li><a href="chapter_${i}.xhtml">${escapeHtml(ch.title)}</a></li>\n`;
    });
    tocHtml += `</ul>`;
    zip.file("OEBPS/text/toc_page.xhtml", wrapInXhtml(tocHtml, "Table of Contents"));
    chapterFiles.push({ id: "toc_page", filename: "toc_page.xhtml", title: "Table of Contents" });
  }

  // Content chapters
  for (const [i, chapter] of chapters.entries()) {
    const bodyParts = chapter.pages.map((p) => pageToHtml(p, template));
    const xhtml = wrapInXhtml(bodyParts.join("\n<hr />\n"), chapter.title);
    const filename = `chapter_${i}.xhtml`;
    zip.file(`OEBPS/text/${filename}`, xhtml);
    chapterFiles.push({ id: `chapter_${i}`, filename, title: chapter.title });
  }

  // content.opf
  const manifestItems = chapterFiles
    .map((f) => `    <item id="${f.id}" href="text/${f.filename}" media-type="application/xhtml+xml"/>`)
    .join("\n");
  const spineItems = chapterFiles.map((f) => `    <itemref idref="${f.id}"/>`).join("\n");

  const contentOpf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="bookid" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="bookid">urn:uuid:${bookId}</dc:identifier>
    <dc:title>${escapeHtml(options.title)}</dc:title>
    <dc:creator>${escapeHtml(author)}</dc:creator>
    <dc:language>en</dc:language>
    <meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d{3}Z/, "Z")}</meta>
  </metadata>
  <manifest>
    <item id="css" href="css/style.css" media-type="text/css"/>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
${manifestItems}
  </manifest>
  <spine>
${spineItems}
  </spine>
</package>`;
  zip.file("OEBPS/content.opf", contentOpf);

  // nav.xhtml (EPUB3 navigation)
  const navItems = chapterFiles
    .map((f) => `      <li><a href="text/${f.filename}">${escapeHtml(f.title)}</a></li>`)
    .join("\n");

  const navXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="en">
<head><title>Navigation</title></head>
<body>
  <nav epub:type="toc">
    <h1>Table of Contents</h1>
    <ol>
${navItems}
    </ol>
  </nav>
</body>
</html>`;
  zip.file("OEBPS/nav.xhtml", navXhtml);

  return await zip.generateAsync({ type: "blob", mimeType: "application/epub+zip" });
}
