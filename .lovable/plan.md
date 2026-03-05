

# Plan: Enhance Themes, Fix Vertical Alignment, Scroll, and Image Placeholders

## 5 Changes

### 1. Add 4 New Creative Themes with Richer Backgrounds
**Files:** `src/components/content/themeBackgrounds.ts`, `src/components/content/ThemeGallery.tsx`, `src/components/pdf/ebookTemplates.ts`

Add 4 new themes with more decorative background elements:
- **Sunset Glow** — warm orange/coral gradients, wave bottom accent, floating circles, top gradient bar
- **Midnight Luxe** — deep navy background, gold geometric diamond accents, vertical gold stripe, corner circles
- **Pastel Dreams** — soft pink/lavender, multiple floating blobs, dots pattern, bottom gradient
- **Tech Grid** — dark background, cyan grid lines (multiple stripes), corner circles, top accent bar

Also enrich existing themes with additional elements (e.g. add corner accents to "Minimal Clean", add more geometric shapes to "Bold Modern").

Add matching entries in `BUILT_IN_THEMES` array in `ThemeGallery.tsx` and `EBOOK_TEMPLATES` in `ebookTemplates.ts` for each new theme.

### 2. Vertically Center Content on Pages with Less Text
**File:** `src/lib/fabricPageSerializer.ts`

For centered layouts (`title`, `chapter-opener`, `quote`, `call-to-action`), the content already starts at a percentage offset (e.g. `t + h * 0.3`). The issue is when body text is very short. Fix:

- After placing all objects in `layoutTitle`, `layoutChapterOpener`, `layoutQuote`, `layoutCTA`: calculate total content height from first to last object
- If total height < 50% of available content height, shift all placed objects down by `(contentHeight - totalHeight) / 2 - currentTopOffset` to vertically center
- Add a helper function `verticalCenterObjects(objects, startIdx, contentTop, contentHeight)` that adjusts top positions

For `layoutFullText` and `layoutList`: when total content height is small, add initial Y offset to center.

### 3. Fix Scroll in Image Generation Dialogs
**Files:** `src/components/images/GenerateImageDialog.tsx`, `src/components/images/GenerateStudioImageDialog.tsx`, `src/components/pins/GeneratePinImageDialog.tsx`

Current state:
- `GenerateImageDialog` and `GenerateStudioImageDialog` have `ScrollArea` with `max-h-[60vh]` but the Generate button is INSIDE the ScrollArea — it should scroll into view. The real issue is `max-h-[60vh]` is too restrictive. Change to `flex-1 min-h-0` with the dialog using `flex flex-col` layout.
- `GeneratePinImageDialog` uses `overflow-y-auto` on DialogContent but no ScrollArea — wrap content in ScrollArea.

Fix approach for all three:
- Dialog: `max-h-[90vh] overflow-hidden flex flex-col`
- ScrollArea: `flex-1 min-h-0` (fills remaining space after header)
- Move generate button outside ScrollArea as a sticky footer

### 4. Fix Image Placeholder — Show Visual Placeholder with Upload/Generate Options
**Files:** `src/lib/fabricPageSerializer.ts`, `src/components/content/FabricPageCanvas.tsx`

**Serializer:** When `content.image` is empty/falsy in `layoutTextImage` and `layoutFullImage`, instead of a plain `#f1f5f9` rect, create a group:
- Dashed-border rect with `#e2e8f0` fill
- "Image" text label centered in the rect (small, muted color)
- Mark with a custom property `isImagePlaceholder: true`

**FabricPageCanvas:** In `loadPageContent`, when creating Rect objects, check for `isImagePlaceholder` property. When user double-clicks an image placeholder rect, trigger `onImageAction("generate")`. Add a double-click handler on canvas that checks if the clicked object has `isImagePlaceholder: true`.

### 5. Use Custom Font Sizes in Fabric Serializer
**File:** `src/lib/fabricPageSerializer.ts`

Line 55 currently: `const baseFontSize = pdfStyle.fontSize === "small" ? 14 : pdfStyle.fontSize === "large" ? 18 : 16;`

Change to:
```
const baseFontSize = pdfStyle.bodyFontSize ?? (pdfStyle.fontSize === "small" ? 14 : pdfStyle.fontSize === "large" ? 18 : 16);
const headingSize = pdfStyle.headingFontSize ?? Math.round(baseFontSize * 1.6);
```
Then use `headingSize` for heading multipliers across all layout functions instead of `baseFontSize * 1.3/1.5/1.6/2`.

### Files Summary
| File | Change |
|------|--------|
| `src/components/content/themeBackgrounds.ts` | Add 4 new themes, enrich existing |
| `src/components/content/ThemeGallery.tsx` | Add 4 new theme entries to `BUILT_IN_THEMES` |
| `src/components/pdf/ebookTemplates.ts` | Add 4 matching ebook template entries |
| `src/lib/fabricPageSerializer.ts` | Vertical centering, custom font sizes, image placeholder |
| `src/components/content/FabricPageCanvas.tsx` | Double-click placeholder to trigger generate/upload |
| `src/components/images/GenerateImageDialog.tsx` | Fix scroll — sticky generate button |
| `src/components/images/GenerateStudioImageDialog.tsx` | Fix scroll — sticky generate button |
| `src/components/pins/GeneratePinImageDialog.tsx` | Add ScrollArea, fix scroll |

**Note:** Image generation continues to use user's own Gemini API key only — no Lovable AI gateway fallback.

