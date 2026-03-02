

# Fix: Content Editor Loading, Image Generation, Scroll, Font Sizes, and Upload

## Issues and Root Causes

### 1. Content Editor shows "Select a section or navigate here from an outline"
**Root cause**: `BuildAllSectionsDialog.tsx` line 305 and `ProductOutline.tsx` line 151 navigate to `/content-editor/${sectionId}` WITHOUT the required `?outlineId=...` query parameter. The ContentEditor (line 98-99) requires `outlineId` from the query string to load the outline and find the section. Without it, `oid` is null, the fetch is skipped, `section` stays null, and the placeholder message is shown.

### 2. Image generation 404 error
**Root cause**: The edge function logs confirm: `models/gemini-2.0-flash-preview-image-generation is not found for API version v1beta`. This model name is invalid for the direct Gemini API. The whitelist in `generate-image/index.ts` contains only invalid models. For the **user-key path** (direct Google AI Studio), the correct model is `gemini-2.0-flash-exp-image-generation`. For the **gateway path** (Lovable AI), we should use `google/gemini-3-pro-image-preview` which is the documented image generation model.

### 3. Generate Image dialog scroll issue
**Root cause**: `GenerateSectionImageDialog.tsx` line 168 uses `<ScrollArea className="flex-1 -mx-6 px-6">`. The `flex-1` doesn't resolve to a constrained height inside a `flex flex-col` dialog without explicit max-height on the ScrollArea. The generate button at the bottom is hidden off-screen.

### 4. Image upload not working in Canvas mode
**Root cause**: The `handleFileUpload` in `EbookPageDesigner.tsx` (line 287-302) uploads the file and calls `updatePageContent(selectedPageIndex, "image", urlData.publicUrl)`. However, in Canvas mode, the `FabricPageCanvas` component doesn't re-render when `page.content.image` changes because its `useEffect` only reloads when `page.id` changes (line 113-117 of FabricPageCanvas). The uploaded image URL is saved to page data but never added to the canvas.

### 5. Template/Canvas mode not helpful + custom font sizes
**Root cause**: The `PDFStyleConfig.fontSize` only supports `"small" | "medium" | "large"` presets. Users want custom numeric font sizes for headings and body text separately. Currently there's no way to set heading size vs paragraph size independently.

---

## Fix Plan

### Fix 1: Add `outlineId` to all content-editor navigation links

**Files**: `src/components/outlines/BuildAllSectionsDialog.tsx`, `src/pages/ProductOutline.tsx`

In `BuildAllSectionsDialog.tsx` line 305, the `outlineId` prop is available. Change:
```
navigate(`/content-editor/${sections[0]?.id}`)
```
to:
```
navigate(`/content-editor/${sections[0]?.id}?outlineId=${outlineId}`)
```

In `ProductOutline.tsx` line 151, `activeOutline.id` is available. Change:
```
navigate(`/content-editor/${activeOutline.sections[0].id}`)
```
to:
```
navigate(`/content-editor/${activeOutline.sections[0].id}?outlineId=${activeOutline.id}`)
```

### Fix 2: Fix image generation model names

**Files**: `supabase/functions/generate-image/index.ts`, `src/hooks/useUserApiKeys.tsx`

- Update the user-key path whitelist to use actually available Gemini image models. Based on the Lovable AI model docs, use `google/gemini-3-pro-image-preview` for the gateway path.
- For the user-key (direct API) path, try `gemini-2.0-flash-exp-image-generation` as the primary fallback. Also add `imagen-3.0-generate-002` as an alternative.
- Update `useUserApiKeys.tsx` default to match.
- Add a more descriptive error response when the model returns 404, suggesting the user update their image model in settings.

### Fix 3: Fix scroll in GenerateSectionImageDialog

**File**: `src/components/content/GenerateSectionImageDialog.tsx`

Line 168: Change `<ScrollArea className="flex-1 -mx-6 px-6">` to `<ScrollArea className="max-h-[60vh] -mx-6 px-6">`. This gives the ScrollArea a definite height constraint so it becomes scrollable and the Generate button remains visible.

### Fix 4: Fix image upload/insert in Canvas mode

**File**: `src/components/content/EbookPageDesigner.tsx`

When in Canvas mode, after uploading an image, instead of just updating page data (which the canvas ignores), directly add the image to the Fabric canvas. Modify `handleFileUpload` and `handleImageGenerated` to check if `canvasMode` is true and if so, use `fabricCanvasRef.current?.getCanvas()` to add a `FabricImage` object directly.

### Fix 5: Add custom font size controls for heading and paragraph

**File**: `src/components/content/PDFStyleSettings.tsx`

- Add two new numeric fields to `PDFStyleConfig`: `headingFontSize` (number, default based on preset) and `bodyFontSize` (number, default based on preset).
- Add number input fields in the PDF Style Settings card for "Heading Font Size" and "Body Font Size" with reasonable min/max (10-48 for headings, 8-24 for body).
- Update `generatePDF.ts` to use these custom sizes when available, falling back to the preset-based sizes.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/outlines/BuildAllSectionsDialog.tsx` | Add `?outlineId=` to navigation URL |
| `src/pages/ProductOutline.tsx` | Add `?outlineId=` to preview navigation URL |
| `supabase/functions/generate-image/index.ts` | Fix image model whitelist and gateway model |
| `src/hooks/useUserApiKeys.tsx` | Update default image model |
| `src/components/content/GenerateSectionImageDialog.tsx` | Fix ScrollArea height constraint |
| `src/components/content/EbookPageDesigner.tsx` | Handle image insert in canvas mode via Fabric API |
| `src/components/content/PDFStyleSettings.tsx` | Add custom heading/body font size fields |
| `src/lib/generatePDF.ts` | Use custom font sizes from config |

## Technical Sequence

1. Fix navigation URLs (resolves the "Select a section" issue immediately)
2. Fix image model names in edge function (resolves all image generation 404s)
3. Fix dialog scroll (makes generate button visible)
4. Fix canvas mode image insertion
5. Add custom font size controls

