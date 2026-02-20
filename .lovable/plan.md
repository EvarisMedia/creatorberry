

# Fix PDF Export: Add Background Designs + Fix Expanded Content

## Problem Analysis

There are **two distinct bugs** causing missing content in the exported PDF:

### Bug 1: Background designs are never rendered in the PDF

The `generatePDF.ts` file uses raw jsPDF drawing commands (lines, rectangles, text) to build each page. It has **zero awareness** of the theme background system (`themeBackgrounds.ts`, `PageBackgroundRenderer.tsx`). Those decorative elements (gradients, blobs, waves, dots, accent bars) only appear in the browser preview via React components -- they are completely absent from the PDF generation path.

### Bug 2: Sections without `page_layouts` are silently skipped

In `useProductExports.tsx` (the `generatePDFClientSide` function, lines ~240-260), the code loops through sections and only collects pages from sections that have `page_layouts` populated. Sections that were expanded (have content) but were never "designed" (no `page_layouts`) produce zero pages and are simply dropped. The fallback path (markdown export) only triggers when ALL sections have no pages.

---

## Fix 1: Render Background Designs in PDF

### What Changes

Add a new function `renderPageBackground()` to `generatePDF.ts` that draws the theme's decorative elements using jsPDF native drawing commands before rendering page content.

Each background element type maps to jsPDF operations:
- **circle** -- `doc.circle()` with fill color and opacity
- **rect** -- `doc.rect()` with fill color, rotation, and opacity
- **gradient** -- Simulated with multiple semi-transparent rectangles (jsPDF has no native gradient support, so we approximate with layered fills)
- **line/stripe** -- `doc.rect()` thin filled rectangle
- **wave/blob** -- Draw the SVG path data using jsPDF lines/curves (parse the `svgPath` into move/curve commands)
- **dots** -- Draw small circles in a repeating grid pattern

Also apply the theme's `contentPadding` to the margin calculations so text stays within the safe zone.

### Files Modified

**`src/lib/generatePDF.ts`**
- Import `THEME_BACKGROUNDS` and `ThemeBackgroundDesign` from `themeBackgrounds.ts`
- Add `renderPageBackground(doc, themeName, wMm, hMm)` function
- Call it at the start of each page render in `generatePDFFromPages`
- Update `renderPage` to use `backgroundColor` and `bodyColor` from the style config
- Apply `contentPadding` from the theme to margin calculations
- Use `accentColor` for numbered items, checkboxes, and CTA buttons

---

## Fix 2: Include Sections Without Page Layouts

### What Changes

In `useProductExports.tsx`, the `generatePDFClientSide` function currently skips sections that have expanded content but no `page_layouts`. The fix generates fallback pages for those sections automatically.

### Logic

For each section that has expanded content but no `page_layouts`:
1. Create a "chapter-opener" page from the section title
2. Split the expanded content text into chunks of ~200 words
3. Create "full-text" pages for each chunk

This matches the existing fallback behavior mentioned in the memory notes and ensures no content is lost.

### Files Modified

**`src/hooks/useProductExports.tsx`**
- In `generatePDFClientSide`, after collecting pages from sections with `page_layouts`, also process sections that have expanded content but no page layouts
- Generate fallback `EbookPageData[]` (chapter-opener + full-text pages) for those sections
- Insert them in the correct sort order

---

## Files Summary

### Modified Files
1. **`src/lib/generatePDF.ts`** -- Add background rendering, apply theme colors and content padding
2. **`src/hooks/useProductExports.tsx`** -- Generate fallback pages for expanded sections without page_layouts

### No New Files Required
### No Database Changes Required

