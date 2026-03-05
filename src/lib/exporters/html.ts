/**
 * Template-aware HTML exporter.
 * Generates a self-contained HTML file with embedded CSS from the EbookTemplate config.
 * Images are referenced by URL (not base64) for speed.
 */
import { EbookPageData } from "@/components/content/ebookLayouts";
import { resolveTemplate, EbookTemplate } from "@/components/pdf/ebookTemplates";

interface HtmlExportOptions {
  title: string;
  author?: string;
  themeName?: string;
  includeToc?: boolean;
  includeCover?: boolean;
  sectionTitles?: string[];
}

function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function generateStylesheet(t: EbookTemplate): string {
  const bodyFont =
    t.fonts.body === "Times-Roman"
      ? "Georgia, 'Times New Roman', serif"
      : "'Segoe UI', Calibri, -apple-system, sans-serif";
  const headingFont =
    t.fonts.heading === "Times-Roman"
      ? "Georgia, 'Times New Roman', serif"
      : "'Segoe UI', Calibri, -apple-system, sans-serif";

  return `
:root {
  --bg: ${t.colors.background};
  --text: ${t.colors.text};
  --heading: ${t.colors.heading};
  --accent: ${t.colors.accent};
  --chapter-bg: ${t.colors.chapterBg};
  --muted: ${t.colors.mutedText};
}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
@page { size: 6in 9in; margin: 0.75in; }
@media print {
  .page { page-break-after: always; break-after: page; }
  .no-print { display: none !important; }
}
html { font-size: 16px; }
body {
  font-family: ${bodyFont};
  color: var(--text);
  background: var(--bg);
  line-height: 1.7;
  max-width: 700px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}
h1, h2, h3, h4 {
  font-family: ${headingFont};
  color: var(--heading);
  line-height: 1.3;
}
h1 { font-size: 2rem; margin: 1.5rem 0 1rem; }
h2 { font-size: 1.5rem; margin: 1.25rem 0 0.75rem; }
h3 { font-size: 1.2rem; margin: 1rem 0 0.5rem; }
p { margin: 0.6rem 0; }
img { max-width: 100%; height: auto; border-radius: 6px; margin: 1rem 0; display: block; }
blockquote {
  border-left: 4px solid var(--accent);
  padding: 0.75rem 1.25rem;
  margin: 1.5rem 0;
  font-style: italic;
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 5%, var(--bg));
  border-radius: 0 6px 6px 0;
}
.attribution { text-align: right; color: var(--muted); font-size: 0.9rem; margin-top: -0.5rem; }
ul, ol { padding-left: 1.5rem; margin: 0.5rem 0; }
li { margin: 0.3rem 0; }
hr { border: none; border-top: 1px solid color-mix(in srgb, var(--muted) 30%, var(--bg)); margin: 2rem 0; }
.cover {
  text-align: center;
  padding: 6rem 2rem 4rem;
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.cover h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
.cover .accent-bar { width: 80px; height: 4px; background: var(--accent); margin: 1.5rem auto; border-radius: 2px; }
.cover .author { color: var(--muted); font-size: 1rem; margin-top: 1rem; }
.toc { padding: 2rem 0; }
.toc h2 { color: var(--heading); margin-bottom: 1rem; }
.toc ol { counter-reset: toc; list-style: none; padding: 0; }
.toc li { counter-increment: toc; padding: 0.5rem 0; border-bottom: 1px solid color-mix(in srgb, var(--muted) 15%, var(--bg)); }
.toc li::before { content: counter(toc) "."; color: var(--accent); font-weight: 600; margin-right: 0.75rem; min-width: 1.5rem; display: inline-block; }
.chapter-opener {
  text-align: center;
  padding: 4rem 2rem 3rem;
  background: var(--chapter-bg);
  border-radius: 8px;
  margin: 2rem 0;
}
.chapter-opener .separator { width: 60px; height: 2px; background: var(--accent); margin: 1rem auto; border-radius: 1px; }
.chapter-opener p { color: var(--muted); max-width: 80%; margin: 0.5rem auto; }
.text-image-row { display: flex; gap: 1.5rem; align-items: flex-start; margin: 1.5rem 0; }
.text-image-row > .text-col { flex: 1; }
.text-image-row > .image-col { width: 40%; flex-shrink: 0; }
.text-image-row > .image-col img { width: 100%; border-radius: 6px; }
.full-image { margin: 1.5rem 0; }
.full-image img { width: 100%; border-radius: 8px; }
.full-image .caption { text-align: center; color: var(--muted); font-size: 0.85rem; margin-top: 0.5rem; }
.checklist { list-style: none; padding: 0; }
.checklist li { padding: 0.4rem 0 0.4rem 1.75rem; position: relative; }
.checklist li::before { content: "✓"; position: absolute; left: 0; color: var(--accent); font-weight: 700; }
.takeaways { list-style: none; padding: 0; }
.takeaways li { padding: 0.5rem 0 0.5rem 2rem; position: relative; }
.takeaways li::before { content: "→"; position: absolute; left: 0; color: var(--accent); font-weight: 700; font-size: 1.1rem; }
.cta-block {
  text-align: center;
  padding: 3rem 2rem;
  background: color-mix(in srgb, var(--accent) 8%, var(--bg));
  border: 2px solid color-mix(in srgb, var(--accent) 25%, var(--bg));
  border-radius: 12px;
  margin: 2rem 0;
}
.cta-block h2 { color: var(--accent); }
`;
}

function pageToHtml(page: EbookPageData, template: EbookTemplate): string {
  const { content: c, layout } = page;
  const parts: string[] = [];

  switch (layout) {
    case "title":
      parts.push(`<div class="cover page">`);
      if (c.heading) parts.push(`<h1>${esc(c.heading)}</h1>`);
      parts.push(`<div class="accent-bar"></div>`);
      if (c.subheading) parts.push(`<p style="color:var(--muted);font-size:1.1rem;">${esc(c.subheading)}</p>`);
      if (c.attribution) parts.push(`<p class="author">${esc(c.attribution)}</p>`);
      parts.push(`</div>`);
      break;

    case "chapter-opener":
      parts.push(`<div class="chapter-opener page">`);
      if (c.subheading) parts.push(`<p style="text-transform:uppercase;letter-spacing:3px;font-size:0.75rem;color:var(--muted);">${esc(c.subheading)}</p>`);
      if (c.heading) parts.push(`<h1>${esc(c.heading)}</h1>`);
      parts.push(`<div class="separator"></div>`);
      if (c.body) parts.push(`<p>${esc(c.body)}</p>`);
      parts.push(`</div>`);
      break;

    case "text-image":
      parts.push(`<div class="text-image-row page">`);
      parts.push(`<div class="text-col">`);
      if (c.heading) parts.push(`<h2>${esc(c.heading)}</h2>`);
      if (c.body) {
        for (const p of c.body.split("\n").filter(Boolean)) {
          parts.push(`<p>${esc(p)}</p>`);
        }
      }
      parts.push(`</div>`);
      if (c.image) parts.push(`<div class="image-col"><img src="${esc(c.image)}" alt="" /></div>`);
      parts.push(`</div>`);
      break;

    case "image-text":
      parts.push(`<div class="text-image-row page">`);
      if (c.image) parts.push(`<div class="image-col"><img src="${esc(c.image)}" alt="" /></div>`);
      parts.push(`<div class="text-col">`);
      if (c.heading) parts.push(`<h2>${esc(c.heading)}</h2>`);
      if (c.body) {
        for (const p of c.body.split("\n").filter(Boolean)) {
          parts.push(`<p>${esc(p)}</p>`);
        }
      }
      parts.push(`</div>`);
      parts.push(`</div>`);
      break;

    case "full-image":
      parts.push(`<div class="full-image page">`);
      if (c.image) parts.push(`<img src="${esc(c.image)}" alt="" />`);
      if (c.heading) parts.push(`<div class="caption">${esc(c.heading)}</div>`);
      parts.push(`</div>`);
      break;

    case "quote":
      parts.push(`<div class="page">`);
      if (c.quote) parts.push(`<blockquote>${esc(c.quote)}</blockquote>`);
      if (c.attribution) parts.push(`<p class="attribution">— ${esc(c.attribution)}</p>`);
      parts.push(`</div>`);
      break;

    case "checklist":
      parts.push(`<div class="page">`);
      if (c.heading) parts.push(`<h2>${esc(c.heading)}</h2>`);
      if (c.items && c.items.length > 0) {
        parts.push(`<ul class="checklist">`);
        for (const item of c.items) parts.push(`<li>${esc(item)}</li>`);
        parts.push(`</ul>`);
      }
      parts.push(`</div>`);
      break;

    case "key-takeaways":
      parts.push(`<div class="page">`);
      if (c.heading) parts.push(`<h2>${esc(c.heading)}</h2>`);
      if (c.items && c.items.length > 0) {
        parts.push(`<ul class="takeaways">`);
        for (const item of c.items) parts.push(`<li>${esc(item)}</li>`);
        parts.push(`</ul>`);
      }
      parts.push(`</div>`);
      break;

    case "call-to-action":
      parts.push(`<div class="cta-block page">`);
      if (c.heading) parts.push(`<h2>${esc(c.heading)}</h2>`);
      if (c.body) parts.push(`<p>${esc(c.body)}</p>`);
      parts.push(`</div>`);
      break;

    case "two-column":
    case "full-text":
    default:
      parts.push(`<div class="page">`);
      if (c.heading) parts.push(`<h2>${esc(c.heading)}</h2>`);
      if (c.subheading) parts.push(`<h3>${esc(c.subheading)}</h3>`);
      if (c.body) {
        for (const p of c.body.split("\n").filter(Boolean)) {
          parts.push(`<p>${esc(p)}</p>`);
        }
      }
      if (c.items && c.items.length > 0) {
        parts.push(`<ul>`);
        for (const item of c.items) parts.push(`<li>${esc(item)}</li>`);
        parts.push(`</ul>`);
      }
      parts.push(`</div>`);
      break;
  }

  return parts.join("\n");
}

export function generateHTML(
  pages: EbookPageData[],
  options: HtmlExportOptions
): string {
  const template = resolveTemplate(options.themeName);
  const author = options.author || "";

  const bodyParts: string[] = [];

  // Cover
  if (options.includeCover !== false) {
    bodyParts.push(`<div class="cover page">
  <h1>${esc(options.title)}</h1>
  <div class="accent-bar"></div>
  ${author ? `<p class="author">${esc(author)}</p>` : ""}
</div>
<hr />`);
  }

  // TOC
  if (options.includeToc !== false && options.sectionTitles && options.sectionTitles.length > 0) {
    bodyParts.push(`<div class="toc page">
  <h2>Table of Contents</h2>
  <ol>
${options.sectionTitles.map((t) => `    <li>${esc(t)}</li>`).join("\n")}
  </ol>
</div>
<hr />`);
  }

  // Pages
  for (const page of pages) {
    bodyParts.push(pageToHtml(page, template));
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(options.title)}</title>
  <style>${generateStylesheet(template)}</style>
</head>
<body>
${bodyParts.join("\n\n")}
</body>
</html>`;
}
