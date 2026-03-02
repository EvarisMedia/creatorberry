
# Comprehensive Fix: 12 Issues — Brand Management, PDF, Images, Navigation, and Sales Pages

## Issues and Root Causes

### 1. No way to edit or delete brand
`useBrands.tsx` only has `fetchBrands` and `selectBrand` — no update or delete functions. No UI for brand management exists on any page.

### 2. Sales page HTML is basic, not modern section-by-section design
`SalesPageBuilder.tsx` line 129-150: `generateHtml()` produces minimal inline CSS with a single gradient hero and unstyled sections. The preview dialog (line 358-405) also renders plain divs with no section-specific styling.

### 3. Generate Image popup not scrollable / button hidden
`GenerateStudioImageDialog.tsx` line 117: `DialogContent` has `overflow-hidden flex flex-col` and wraps content in `ScrollArea`. The ScrollArea component needs a fixed height to scroll; currently it uses `flex-1` which may not resolve to a constrained height within the dialog.

### 4. Uploaded image not displaying in Canvas mode
`FabricPageCanvas.tsx` handles images via `FabricImage.fromURL()`. Need to verify if the image loading callback handles errors and CORS for uploaded images from storage buckets.

### 5. No Preview button in Outline creator
`ProductOutline.tsx` has no preview functionality — no way to see what the outline content looks like before building.

### 6. CTA button background not resizing based on text
`generatePDF.ts` line 558: `const btnW = 50;` is hardcoded. Should dynamically calculate width from CTA text length using `doc.getTextWidth()`.

### 7. PDF Preview blocked by Chrome
`ExportCenter.tsx` line 292-297: Uses `<iframe src={previewUrl}>` for PDF preview. Chrome blocks PDF rendering in iframes from blob URLs. Need to use `<object>` or `<embed>` tag with `type="application/pdf"`.

### 8. "Open Content Editor" shows 404 after Build All Sections
`BuildAllSectionsDialog.tsx` line 305: navigates to `/content/${outlineId}` — but `App.tsx` routes are `/content-editor` and `/content-editor/:sectionId`. The route is **wrong**.

### 9. Content should break numbers/lists into new lines, smaller paragraphs
`generatePDF.ts` line 312: `drawBody` splits text on `\n\n+` (double newlines) only. Single newlines (used for numbered lists like `1.\n2.\n3.`) are lost, causing all list items to merge into one paragraph.

### 10 and 12. Image generation errors — model not found
Edge function logs confirm: `models/gemini-2.0-flash-exp is not found for API version v1beta`. The fallback model we set in the previous fix is now **also deprecated/unavailable** on Google's API. For the user-key path (direct Gemini API), need to use a currently valid model. For the gateway path, the model `google/gemini-2.5-flash-image` is correct per documentation.

### 11. Exported PDF showing lines in background design
Theme background elements (stripes, lines, rects) render with visible opacity. Some themes have `line` and `stripe` type elements that draw solid colored rectangles, creating visible lines. Need to cap opacity lower for these decorative elements or add an option to disable background decorations.

---

## Fix Plan

### Fix 1: Add brand edit and delete to `useBrands.tsx` + Settings page
- Add `updateBrand(id, updates)` and `deleteBrand(id)` functions to `useBrands.tsx`
- Add a "Brand Management" section to `src/pages/Settings.tsx` with edit form (name, colors, tone, about, target audience) and delete button with confirmation dialog
- The edit form should pre-populate with the current brand's data

### Fix 2: Modern sales page HTML generation
- Rewrite `generateHtml()` in `SalesPageBuilder.tsx` to produce section-by-section styled HTML:
  - Each section type (hero, problem, benefits, testimonials, faq, cta) gets its own styled container
  - Alternating background colors for visual separation
  - Modern typography, proper spacing, responsive design
  - Styled CTA buttons with hover effects
  - Update the preview dialog to render each section with its own visual treatment

### Fix 3: Fix image popup scrolling
- In `GenerateStudioImageDialog.tsx`, change the `ScrollArea` to have an explicit `max-h` constraint (e.g., `max-h-[60vh]`) instead of relying on `flex-1` which doesn't resolve properly inside the dialog

### Fix 4: Fix uploaded image display in Canvas mode
- In `FabricPageCanvas.tsx`, check the `FabricImage.fromURL` call for CORS handling
- Add `crossOrigin: "anonymous"` to image loading options for storage bucket URLs
- Add error handling with fallback placeholder when image loading fails

### Fix 5: Add Preview button to Outline page
- Add a "Preview" link/button to `ProductOutline.tsx` outline detail view
- Navigate to the first section's content editor: `/content-editor/{firstSectionId}`
- Only show when sections exist

### Fix 6: Dynamic CTA button width in PDF
- In `generatePDF.ts` line 556-566 (call-to-action layout):
  - Calculate `btnW` using `doc.getTextWidth(c.subheading) + padding` instead of hardcoded `50`
  - Add minimum width and maximum width constraints

### Fix 7: Fix PDF preview in Chrome
- In `ExportCenter.tsx` line 292, replace `<iframe>` with `<object>` or `<embed>`:
```html
<object data={previewUrl} type="application/pdf" width="100%" height="100%">
  <p>Unable to display PDF. <a href={previewUrl} download>Download instead</a>.</p>
</object>
```

### Fix 8: Fix "Open Content Editor" navigation route
- In `BuildAllSectionsDialog.tsx` line 305: change from:
  `navigate(`/content/${outlineId}`)`
  to:
  `navigate(`/content-editor/${firstSectionId}`)`
  where `firstSectionId` is `sections[0]?.id`

### Fix 9: Handle single-newline line breaks in PDF body text
- In `generatePDF.ts` `drawBody()`: Split on single `\n` as well, not just `\n\n`
- Treat single newlines as line breaks (for lists) and double newlines as paragraph breaks
- Detect numbered/bulleted lines (starting with `1.`, `2.`, `-`, `*`) and add proper spacing

### Fix 10/12: Update image generation models
- **User-key path**: Update the `VALID_IMAGE_MODELS` whitelist in `generate-image/index.ts` to use currently available models. Replace `gemini-2.0-flash-exp` with `gemini-2.0-flash-preview-image-generation` as the default fallback (this is a known working model for image generation via the Gemini API)
- **Gateway path**: Keep `google/gemini-2.5-flash-image` (confirmed working per documentation)
- **Settings hook**: Update default in `useUserApiKeys.tsx` to match
- Add better error messaging: if the model returns 404, surface a user-friendly toast suggesting they update their API key settings

### Fix 11: Reduce background decoration visibility in PDF
- In `generatePDF.ts` `renderPageBackground()`:
  - Cap maximum opacity for `line` and `stripe` elements at 0.05 (very subtle)
  - Cap `rect` decorative elements at 0.08
  - Add a `subtleBackgrounds` option to PDFStyleConfig that defaults to true

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useBrands.tsx` | Add `updateBrand()` and `deleteBrand()` functions |
| `src/pages/Settings.tsx` | Add Brand Management section with edit/delete UI |
| `src/pages/SalesPageBuilder.tsx` | Rewrite `generateHtml()` with modern section styling; update preview dialog |
| `src/components/images/GenerateStudioImageDialog.tsx` | Fix ScrollArea height constraint |
| `src/components/content/FabricPageCanvas.tsx` | Add crossOrigin and error handling for images |
| `src/pages/ProductOutline.tsx` | Add Preview/Open Content Editor button |
| `src/lib/generatePDF.ts` | Fix CTA button width, line breaks in body text, background opacity caps |
| `src/pages/ExportCenter.tsx` | Replace iframe with object tag for PDF preview |
| `src/components/outlines/BuildAllSectionsDialog.tsx` | Fix navigation route from `/content/` to `/content-editor/` |
| `supabase/functions/generate-image/index.ts` | Update valid image models whitelist |
| `src/hooks/useUserApiKeys.tsx` | Update default image model |

## Technical Sequence

1. Fix navigation route in BuildAllSectionsDialog (one-line fix, resolves 404)
2. Fix image model whitelist in generate-image (resolves all image generation errors)
3. Fix PDF rendering (CTA width, line breaks, background opacity)
4. Fix PDF preview (iframe to object tag)
5. Fix image popup scrolling
6. Fix canvas image display
7. Add brand edit/delete
8. Add outline preview button
9. Modernize sales page HTML
