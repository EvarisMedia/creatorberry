

# Build All Sections: Theme, Layout & Auto-Image Generation

## What This Does

Transforms the "Build All Sections" pre-build options screen into a complete product configuration panel. Before clicking "Start Building," you will be able to:

1. **Choose a design theme** -- pick from the 8 existing themes (Minimal Clean, Bold Modern, Ocean Breeze, etc.) so every page shares the same colors, fonts, and background style
2. **Select a page size** -- 6x9, A4, workbook, slides, etc.
3. **Enable auto-image generation** -- toggle on/off, and set how many images per chapter (0, 1, 2, or 3)
4. **Set image style** -- Modern, Minimal, Watercolor, etc.

The build pipeline will then: Write content -> Design layouts -> Generate images (if enabled) -- all automatically per chapter.

---

## Changes

### 1. Build Options UI (`BuildAllSectionsDialog.tsx`)

Add a pre-build configuration section with:

- **Theme picker** -- inline grid of 8 theme swatches (reusing `BUILT_IN_THEMES` from `ThemeGallery.tsx`). Clicking one selects it. Shows color dots + name.
- **Page size dropdown** -- reuses the existing page size options from `PDFStyleSettings.tsx`
- **Auto-generate images toggle** -- Switch with label
- **Images per chapter selector** -- appears when toggle is on: radio/select for 1, 2, or 3 images per chapter
- **Image style badges** -- row of clickable style badges (Modern, Minimal, Bold, etc.) -- appears when toggle is on

The dialog width increases slightly (`max-w-xl`) to accommodate the new options.

### 2. Save Theme to Outline on Build Start

When the user clicks "Start Building":
- Save the selected theme + page size to the outline's `pdf_style_config` column (already exists in the `product_outlines` table)
- This ensures the Content Editor and PDF Export will use the same design

### 3. Add Image Generation Phase to `useBookBuilder.tsx`

Add a new phase `"imaging"` to the pipeline after `"designing"`:

```text
Current pipeline per section:
  expanding -> designing -> done

New pipeline per section:
  expanding -> designing -> imaging -> done
                             (skipped if auto-images disabled or imagesPerChapter = 0)
```

Changes to `BuildOptions` interface:
```typescript
interface BuildOptions {
  sections: OutlineSection[];
  brandId: string;
  brandContext: any;
  contextAware: boolean;
  // New fields:
  generateImages: boolean;
  imagesPerChapter: number;
  imageStyle: string;
}
```

Changes to `SectionPhase`:
```typescript
type SectionPhase = "pending" | "expanding" | "designing" | "imaging" | "done" | "skipped" | "error";
```

The imaging phase calls the existing `generate-image` edge function for each image needed, using image types cycled from: `section_infographic`, `chapter_illustration`, `diagram`. The generated image URLs are then inserted into the section's page layouts (into `text-image` or `image-text` layout pages that have empty image slots).

### 4. Pass Theme to Auto-Layout Edge Function

Update the `auto-layout-ebook` call in `useBookBuilder.tsx` to include the selected theme info, so the AI layout designer can make better layout decisions aware of the styling context.

### 5. Progress UI Updates

Update the progress screen to show the new imaging phase:
- Icon: camera/image icon for imaging phase
- Status text: "Generating images for Chapter X"
- The phase indicator in the section list shows the imaging spinner

---

## Files Modified

| File | Change |
|------|--------|
| `src/components/outlines/BuildAllSectionsDialog.tsx` | Add theme picker, page size, image toggle, images-per-chapter, image style to pre-build screen; pass new options to builder; save theme to outline |
| `src/hooks/useBookBuilder.tsx` | Add `imaging` phase; accept new build options; call `generate-image` edge function per chapter; insert generated image URLs into page layouts |

## Files Read Only (no changes)

| File | Purpose |
|------|---------|
| `src/components/content/ThemeGallery.tsx` | Import `BUILT_IN_THEMES` and `DesignTheme` |
| `src/components/content/PDFStyleSettings.tsx` | Import page size options and `PDFStyleConfig` types |
| `supabase/functions/generate-image/index.ts` | Existing edge function called during imaging phase |
| `supabase/functions/auto-layout-ebook/index.ts` | Existing edge function called during design phase |

No database changes required -- the `pdf_style_config` column already exists on `product_outlines`.

---

## Technical Details

### Image Generation During Build

For each section where `generateImages` is enabled:

```typescript
// After design phase completes successfully
if (generateImages && imagesPerChapter > 0) {
  updateStatus(i, { phase: "imaging" });
  
  const imageTypes = ["section_infographic", "chapter_illustration", "diagram"];
  
  for (let imgIdx = 0; imgIdx < imagesPerChapter; imgIdx++) {
    const imageType = imageTypes[imgIdx % imageTypes.length];
    
    const response = await supabase.functions.invoke("generate-image", {
      body: {
        brand: {
          name: brandContext.name,
          primary_color: brandContext.primary_color || "#000000",
          secondary_color: brandContext.secondary_color || "#ffffff",
          tone: brandContext.tone,
        },
        quote_text: section.title,
        style: imageStyle,
        image_type: imageType,
        aspect_ratio: "16:9",
        section_context: {
          title: section.title,
          description: section.description,
          subsections: section.subsections,
        },
      },
    });
    
    if (response.data?.image_url) {
      // Save to generated_images table
      await supabase.from("generated_images").insert({
        user_id: userId,
        brand_id: brandId,
        image_url: response.data.image_url,
        prompt: response.data.prompt,
        image_type: imageType,
        quote_text: section.title,
        style: imageStyle,
        section_id: section.id,
      });
    }
  }
}
```

### Theme Selection UI (inline, no dialog)

```text
+------------------------------------------+
|  Design Theme                            |
|  [o][o][o][o][o][o][o][o]  <- 8 swatches |
|  "Minimal Clean" selected                |
|                                          |
|  Page Size: [6x9 Standard Ebook v]      |
|                                          |
|  [x] Context-aware writing               |
|  [x] Auto-generate images               |
|      Images per chapter: [1] [2] [3]     |
|      Style: [Modern] [Minimal] [Bold]... |
|                                          |
|  Est. time: ~8 minutes                   |
|            [Cancel]  [Start Building]    |
+------------------------------------------+
```

### Time Estimate Update

When auto-images is enabled, increase the time estimate to account for image generation (~15-20s per image):

```typescript
const baseMinutes = sections.length * 0.5;
const imageMinutes = generateImages ? (sections.length * imagesPerChapter * 0.3) : 0;
const totalMinutes = Math.ceil(baseMinutes + imageMinutes);
```

