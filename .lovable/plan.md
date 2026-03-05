
# PDF Export Migration Plan — jsPDF → @react-pdf/renderer

## Phase 1: Replace jsPDF with @react-pdf/renderer (Session 1-2)

### 1a. Install dependencies & create PDF component foundation
- Install `@react-pdf/renderer`
- Register Google Fonts via `Font.register()` for all 6 template font pairs
- Create `src/components/pdf/` folder with shared components:
  - `PDFDocument.tsx` — root `<Document>` wrapper
  - `CoverPage.tsx` — title, tagline, cover image
  - `TableOfContents.tsx` — auto-generated from chapters
  - `ChapterOpener.tsx` — full-page chapter start
  - `SectionPage.tsx` — section content + image
  - `FooterHeader.tsx` — page numbers
  - `TemplateProvider.tsx` — context providing template config

### 1b. Create unified EbookTemplate config type
- Define `EbookTemplate` type with colors, fonts, cover style, layout settings
- Migrate existing `themeBackgrounds` + `PDFStyleConfig` into 6 template configs:
  - modern-dark, editorial-light, bold-magazine, minimal-clean, luxury-gold, tech-blueprint
- Single config drives PDF styling (and later HTML/DOCX/EPUB)

### 1c. Replace generatePDF.ts internals
- Rewrite `generatePDFFromPages()` to use `pdf(<PDFDocument />).toBlob()`
- Remove jsPDF dependency and `fabricOffscreenRenderer.ts` from the PDF path
- Keep Fabric.js canvas editor untouched — it stays for interactive design
- Update `useProductExports.tsx` to call the new renderer

### 1d. Verify & test
- Test PDF export with all 6 templates
- Verify cover page, TOC, chapter openers, section pages render correctly
- Confirm fonts load from Google Fonts CDN

## Phase 2: Add DOCX + EPUB exports (Session 3)

### 2a. DOCX export
- Install `docx` npm package
- Create `src/lib/exporters/docx.ts`
- Map markdown content → docx elements (headings, bold, lists, images)
- Template config drives heading colors, font choices

### 2b. EPUB export
- Install `epub-gen-memory`
- Create `src/lib/exporters/epub.ts`
- Convert sections to HTML chapters with template CSS

### 2c. Update Export Center UI
- Add DOCX and EPUB download buttons alongside existing PDF/HTML/JSON
- Each shows loading spinner during generation

## Phase 3: Enhanced HTML export (Session 4)

### 3a. Template-aware HTML export
- Create `src/lib/exporters/html.ts`
- Generate self-contained HTML with embedded CSS from template config
- Images as base64 data URIs
- Print-ready @media print CSS

## Phase 4: Cleanup (Session 5)

- Remove jsPDF dependency
- Remove `fabricOffscreenRenderer.ts` (if no longer used)
- Remove old `generatePDF.ts` imperative code
- Update plan.md with final architecture

---

## What We Keep
- Fabric.js canvas editor (Template + Canvas dual mode)
- All existing Supabase integration (brands, outlines, sections, exports)
- Full product pipeline (ideas → outlines → content → images → export)
- EbookPage.tsx + PageBackgroundRenderer.tsx for in-app preview

## What Changes
- PDF generation: jsPDF → @react-pdf/renderer
- Template system: fragmented configs → unified EbookTemplate type
- Export formats: PDF only → PDF + DOCX + EPUB + HTML
- Fonts: jsPDF built-ins → custom Google Fonts

## Current Status: Ready to start Phase 1
