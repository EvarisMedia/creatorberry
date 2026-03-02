

# Fix Build All Sections: End-to-End Ebook Pipeline

## Problem Summary

The "Build All Sections" workflow has 5 critical issues:

1. **Layouts never saved** -- The `auto-layout-ebook` edge function returns page designs, but the `useBookBuilder` hook discards the response and never writes `page_layouts` to the `expanded_content` table.
2. **Images not generated** -- The image generation phase generates images and saves them to `generated_images`, but never links them back into the page layouts (no `image` field in the layout content).
3. **Text overflow in layouts** -- The AI sometimes generates pages with too much body text for the page size. No content-length guardrails exist in the prompt or post-processing.
4. **Canvas-to-PDF quality loss** -- When fabricJSON exists, pages render through the offscreen Fabric.js canvas at 2x, but most auto-built pages lack fabricJSON, so they fall through to jsPDF text rendering which has limited typography.
5. **Weak template system** -- The AI layout prompt gives equal weight to all templates without guiding toward a professional book structure.

## Fix Plan

### 1. Save AI layouts to database (useBookBuilder.tsx)

After calling `auto-layout-ebook`, take the returned `pages` array and save it as `page_layouts` on the `expanded_content` row:

```typescript
// After design phase succeeds
const pages = layoutResponse.data?.pages || [];
if (pages.length > 0 && contentId) {
  // Convert to EbookPageData format with IDs and order
  const pageLayouts = pages.map((p, idx) => ({
    id: crypto.randomUUID(),
    layout: p.layout,
    content: {
      heading: p.heading,
      subheading: p.subheading,
      body: p.body,
      image: p.image,
      items: p.items,
      quote: p.quote,
      attribution: p.attribution,
    },
    order: idx,
  }));

  await supabase
    .from("expanded_content")
    .update({ page_layouts: pageLayouts })
    .eq("id", contentId);
}
```

### 2. Link generated images into page layouts (useBookBuilder.tsx)

After the imaging phase, find pages with image-capable layouts (text-image, image-text, full-image) and inject the generated image URLs:

```typescript
// After image generation, update page_layouts with image URLs
if (generatedImageUrls.length > 0 && contentId) {
  const { data: ec } = await supabase
    .from("expanded_content")
    .select("page_layouts")
    .eq("id", contentId)
    .single();
  
  if (ec?.page_layouts) {
    const layouts = ec.page_layouts as any[];
    let imgIdx = 0;
    for (const page of layouts) {
      if (["text-image", "image-text", "full-image"].includes(page.layout) && imgIdx < generatedImageUrls.length) {
        page.content.image = generatedImageUrls[imgIdx];
        imgIdx++;
      }
    }
    // Also add remaining images as new image-text pages
    while (imgIdx < generatedImageUrls.length) {
      layouts.push({
        id: crypto.randomUUID(),
        layout: "full-image",
        content: { image: generatedImageUrls[imgIdx], heading: section.title },
        order: layouts.length,
      });
      imgIdx++;
    }
    await supabase
      .from("expanded_content")
      .update({ page_layouts: layouts })
      .eq("id", contentId);
  }
}
```

### 3. Fix text overflow in auto-layout prompt (auto-layout-ebook/index.ts)

Improve the system prompt to enforce word limits per page:

- Add explicit rule: "Each page body should contain at most 150 words for 6x9, 200 words for 8.5x11"
- Add post-processing: truncate body text that exceeds the word limit per layout type
- Add `pageSize` parameter pass-through (already sent but not fully utilized in word limits)

### 4. Improve PDF rendering for non-fabricJSON pages (generatePDF.ts)

For pages without fabricJSON (which is most auto-built pages), improve the jsPDF rendering:

- Add proper text wrapping with overflow protection (check remaining vertical space before rendering)
- Add page-break logic within body text when it exceeds available height
- Ensure images are loaded and properly sized (aspect-ratio preserved)
- Add proper line-height and paragraph spacing

### 5. Improve template/layout intelligence (auto-layout-ebook/index.ts)

Update the AI prompt for better book structure:

- First page must be "chapter-opener"
- Encourage "text-image" or "image-text" layouts when images will be generated (pass `generateImages` flag)
- End with "key-takeaways" or "call-to-action"
- Limit "full-text" pages to 3 consecutive maximum
- Better word-count guidance per layout type

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useBookBuilder.tsx` | Save layout response to DB; collect image URLs and inject into layouts; pass pageSize to design call |
| `supabase/functions/auto-layout-ebook/index.ts` | Add word limits per page, image-aware layout hints, improved structure rules |
| `src/lib/generatePDF.ts` | Add text overflow protection, better body text wrapping with page breaks |

## Technical Sequence

1. Fix `useBookBuilder.tsx` -- save layouts + link images (this is the critical fix)
2. Fix `auto-layout-ebook/index.ts` -- better prompts and word limits
3. Fix `generatePDF.ts` -- overflow protection in jsPDF rendering

No database schema changes needed. No new dependencies.
