

# Plan: Build All Sections Improvements + Image Dialog Scroll Fix + Remove Template Mode

## 3 Changes

### 1. Add Font Size Control to Build All Sections Dialog
**Problem:** The `DesignTheme` type has a `fontSize` field but it's hardcoded to `"medium"` for all themes. No UI control exists in the Build All dialog.

**Fix:**
- Add a font size selector (Small / Medium / Large) to `BuildAllSectionsDialog.tsx` below the theme picker
- Add optional custom heading/body font size number inputs (matching `PDFStyleConfig.headingFontSize` / `bodyFontSize`)
- Pass the selected font size into the `pdf_style_config` saved to the outline

### 2. Fix Custom Font Not Reflecting in Design
**Problem:** In `EbookPage.tsx` (line 24), fonts are mapped from generic names (`serif` → `Georgia`, `sans-serif` → `system-ui`). The `PDFStyleConfig` only supports 3 font families. Custom Google Fonts from `@react-pdf/renderer` registration aren't used in the canvas preview.

**Fix:**
- The `DesignTheme.fontFamily` is `"serif" | "sans-serif" | "mono"` — these map to CSS system fonts in the preview, which is correct for the canvas. The issue is that all 8 themes use only `serif` or `sans-serif`, so visually they look identical in font.
- Add `headingFontSize` and `bodyFontSize` support to `EbookPage.tsx` so custom numeric sizes from `PDFStyleConfig` actually render in the preview (currently only the generic `small/medium/large` is used).

### 3. Fix Image Generation Dialog Scroll
**Problem:** `GenerateImageDialog.tsx` uses `max-h-[90vh] overflow-y-auto` on `DialogContent` but the content inside isn't wrapped in a `ScrollArea`. On smaller screens the Generate button gets cut off.

**Fix:**
- Wrap the form content in `GenerateImageDialog.tsx` with a `ScrollArea` (same pattern as `GenerateSectionImageDialog.tsx`)
- Apply same fix to `GenerateStudioImageDialog.tsx` and `GeneratePinImageDialog.tsx` if they have similar issues

### 4. Remove Template Mode, Keep Only Canvas
**Problem:** `EbookPageDesigner.tsx` has a Template/Canvas toggle. User wants only Canvas mode.

**Fix:**
- Remove `canvasMode` state variable (default to always-canvas behavior)
- Remove the Template/Canvas toggle button from the toolbar
- Remove the Template-mode rendering branch (the `EbookPage` inline-editable path at lines 491-508)
- Remove the "Layout" button (only relevant for template mode)
- Keep the `EbookPage` component itself (still used for thumbnails and other previews)
- Clean up `showLayoutPicker` state and its dialog (template-only feature)

### Files to Modify
- `src/components/outlines/BuildAllSectionsDialog.tsx` — add font size UI
- `src/components/content/EbookPage.tsx` — respect `headingFontSize`/`bodyFontSize` from config
- `src/components/content/EbookPageDesigner.tsx` — remove template mode, always use canvas
- `src/components/images/GenerateImageDialog.tsx` — add ScrollArea wrapper
- `src/components/images/GenerateStudioImageDialog.tsx` — verify/fix scroll
- `src/components/pins/GeneratePinImageDialog.tsx` — verify/fix scroll

