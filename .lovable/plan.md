
# PDF Export Migration — Complete ✅

## Phase 1: Replace jsPDF with @react-pdf/renderer ✅
- Installed `@react-pdf/renderer`
- Created `src/components/pdf/ebookTemplates.ts` — unified EbookTemplate config (8 themes)
- Created `src/components/pdf/PDFDocument.tsx` — declarative PDF components (Cover, TOC, Content)
- Created `src/lib/generatePDFReact.ts` — bridge functions using `pdf().toBlob()`
- Updated `useProductExports.tsx` to use new renderer

## Phase 2: Add DOCX + EPUB exports ✅
- Installed `docx` npm package
- Created `src/lib/exporters/docx.ts` — template-aware DOCX with images, styles, TOC
- Created `src/lib/exporters/epub.ts` — valid EPUB3 using JSZip with template CSS
- Wired both into `useProductExports.tsx` as client-side generators

## Phase 3: Enhanced HTML export ✅
- Created `src/lib/exporters/html.ts` — self-contained HTML with embedded template CSS
- Supports all 12 layout types, print-ready `@media print`, responsive design
- HTML export now uses client-side generator instead of edge function

## Phase 4: Cleanup ✅
- Deleted `src/lib/generatePDF.ts` (925 lines of legacy jsPDF code)
- Deleted `src/lib/fabricOffscreenRenderer.ts` (unused)
- Kept `jspdf` dependency (still used by `ExportCarouselDialog.tsx` for carousel PDF export)

## Final Architecture

### Export Pipeline
```
useProductExports.tsx
  ├── PDF  → generatePDFReact.ts → PDFDocument.tsx (@react-pdf/renderer)
  ├── DOCX → exporters/docx.ts (docx npm package)
  ├── EPUB → exporters/epub.ts (JSZip)
  ├── HTML → exporters/html.ts (template-aware self-contained HTML)
  └── Other (md/txt/json/csv) → edge function (export-product)
```

### Template System
```
ebookTemplates.ts — 8 unified templates
  → drives PDF fonts/colors/layout
  → drives DOCX heading styles/colors
  → drives EPUB chapter CSS
  → drives HTML embedded stylesheet
```

### What We Kept
- Fabric.js canvas editor (interactive design mode)
- All Supabase integration (brands, outlines, sections, exports)
- Full product pipeline (ideas → outlines → content → images → export)
- jsPDF for carousel-specific PDF export
