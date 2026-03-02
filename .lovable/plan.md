

# Comprehensive Fix: PDF Export Quality, Images, Text Flow, and Preview

## Flaws Found in the Exported PDF

After analyzing the actual exported PDF (58+ pages), here are the specific issues:

### 1. No images anywhere in the PDF
- **Root cause (gateway path)**: Line 294 of `generate-image/index.ts` still uses `google/gemini-2.5-flash-image-preview` which is an invalid model name. The previous fix only changed the user-API-key path (line 310), not the gateway default.
- **Root cause (image storage)**: Generated images are base64 data URLs. These are saved to `generated_images` table and injected into `page_layouts` as `content.image`. But `loadImageAsBase64()` in `generatePDF.ts` tries to `fetch()` these URLs -- `fetch()` on a `data:` URI may fail silently in some environments, and even when it works, the function re-encodes to base64 via FileReader, adding unnecessary overhead.
- **Root cause (image sizing)**: In `text-image` and `image-text` layouts, images stretch the full page height (`hMm - margin.top - margin.bottom`), creating a massive distorted image column.

### 2. Text cut off mid-sentence (pages end abruptly)
- **Root cause**: `drawBody()` stops rendering at `bottomLimit` but discards all remaining text. There is zero overflow/continuation logic -- text simply vanishes.
- Pages 1, 3, 4, 7, 9 in the PDF all have numbered lists that get cut off partway through.

### 3. Duplicate content across pages
- Pages 1 and 3 have identical content ("The Mechanics of an InstaTheme Page"). This suggests the fallback page generator or the AI layout engine is duplicating content across the chapter-opener and the first full-text page.

### 4. No page numbers in the PDF
- There are no page numbers, headers, or footers -- making the document feel unprofessional.

### 5. Heading text cut off (Page 11: "Your Niche, Your Brand, Your B")
- The heading is truncated. The `drawHeading()` function wraps text but the heading for chapter-opener is rendered centered at a fixed Y position without checking if wrapped lines fit.

### 6. No cover page or table of contents
- The `BuildAllSectionsDialog` saves `includeCoverPage: true` and `includeToc: true` to the style config, but `generatePDFFromPages()` never generates these pages.

### 7. No PDF preview before export
- Users export blindly with no way to review the output.

### 8. `pageSize` not passed from BuildAllSectionsDialog to builder
- Line 80-89 of `BuildAllSectionsDialog.tsx`: `builder.build()` is called but `pageSize` is NOT included in the options object (it's defined in state but never passed).

---

## Fix Plan

### Fix 1: Pass `pageSize` to builder (BuildAllSectionsDialog.tsx)
Add `pageSize` to the `builder.build()` call -- it's currently missing despite being a state variable.

### Fix 2: Fix gateway image model (generate-image/index.ts)
- Change line 294 default from `google/gemini-2.5-flash-image-preview` to `google/gemini-2.5-flash-image` (the correct Lovable gateway model name per documentation).
- Fix `loadImageAsBase64` in `generatePDF.ts` to handle `data:` URIs directly (return them as-is instead of re-fetching).

### Fix 3: Text overflow with continuation pages (generatePDF.ts)
Refactor the PDF generation loop to handle text overflow:
- Make `drawBody()` return the number of characters actually rendered.
- In `generatePDFFromPages()`, when body text overflows, automatically insert continuation pages with the remaining text.
- This prevents text from being silently cut off.

### Fix 4: Fix image sizing in layouts (generatePDF.ts)
- For `text-image` and `image-text`: size the image proportionally (max 60% of page height, maintain aspect ratio) instead of stretching full height.
- For `full-image`: properly handle the full-bleed case.

### Fix 5: Add page numbers (generatePDF.ts)
After rendering all pages, loop through and add page numbers at the bottom center of each page (skip page 1 if it's a cover).

### Fix 6: Add cover page and table of contents (generatePDF.ts + useProductExports.tsx)
- Generate a cover page from the outline title and brand info.
- Generate a table of contents from section titles with page numbers.
- Insert these at the beginning of the `allPages` array before PDF generation.

### Fix 7: Fix content duplication
- In `generateFallbackPages()`, the chapter-opener already includes the first 200 chars of content, then the full-text pages start from word 0 again. Fix: start the full-text chunking after skipping the opener content.

### Fix 8: Add PDF preview (ExportCenter.tsx)
- Add a "Preview" button that generates the PDF blob client-side and displays it in an iframe using an object URL.
- Show the preview inline in a modal or expandable section.

### Fix 9: Fix heading truncation (generatePDF.ts)
- In `drawHeading()`, check if wrapped lines fit in available vertical space. If not, reduce font size or allow heading to flow into body area.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/outlines/BuildAllSectionsDialog.tsx` | Pass `pageSize` to `builder.build()` |
| `supabase/functions/generate-image/index.ts` | Fix gateway default model to `google/gemini-2.5-flash-image` |
| `src/lib/generatePDF.ts` | Text overflow/continuation, image sizing, page numbers, cover page, TOC, heading fix, data URI handling |
| `src/hooks/useProductExports.tsx` | Add cover/TOC generation, fix content duplication in fallback, add preview support |
| `src/pages/ExportCenter.tsx` | Add Preview button and inline PDF viewer |

## Technical Sequence

1. Fix `BuildAllSectionsDialog.tsx` -- pass `pageSize` (one-line fix)
2. Fix `generate-image/index.ts` -- correct gateway model name
3. Fix `generatePDF.ts` -- core rendering improvements (text flow, images, page numbers, cover/TOC)
4. Fix `useProductExports.tsx` -- cover page generation, fallback duplication fix
5. Fix `ExportCenter.tsx` -- add preview capability

