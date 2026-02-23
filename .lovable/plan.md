

# Fix Chapter Opener Layout Overlap + Image Generation Guide

## Problem 1: Chapter Opener Layout Content Overlap

The `layoutChapterOpener` function in `src/lib/fabricPageSerializer.ts` uses **fixed vertical offsets** from a single `centerY` anchor point. When the heading text wraps to multiple lines, the Fabric.js Textbox grows downward, but the divider line and body text are placed at hardcoded positions (`centerY + 40`, `centerY + 55`), causing:
- Heading overlaps the divider line
- Divider overlaps the body text
- Long body text overflows below the canvas boundary

The same issue exists in other layouts (title, quote, CTA) that use fixed offsets instead of stacking.

### Fix: Dynamic Vertical Stacking

**Modified: `src/lib/fabricPageSerializer.ts`**

Replace the fixed-offset approach with a **sequential stacking** pattern that estimates text height based on content length, font size, and available width:

```text
Before (fixed offsets):
  subheading -> centerY - 20
  heading    -> centerY        (fixed, ignores text wrap)
  divider    -> centerY + 40   (overlaps if heading is 3+ lines)
  body       -> centerY + 55   (overlaps divider, overflows canvas)

After (dynamic stacking):
  subheading -> startY
  heading    -> startY + subheadingHeight + gap
  divider    -> after heading with gap
  body       -> after divider with gap (clamped to canvas bounds)
```

Add a helper function `estimateTextHeight(text, fontSize, width, lineHeight)` that calculates approximate rendered height based on character count and available width. This is used to stack elements without overlap.

Apply the same fix to these layout functions that have the same issue:
- `layoutChapterOpener` -- primary fix
- `layoutTitle` -- subheading/attribution can overlap on long titles
- `layoutQuote` -- quote mark, quote text, and attribution overlap
- `layoutCTA` -- heading, body, and button overlap

**Modified: `src/components/content/FabricPageCanvas.tsx`**

Add **canvas boundary clamping** so objects cannot be dragged or resized beyond the page edges. This prevents users from accidentally moving content outside the visible area:

```typescript
canvas.on("object:moving", (e) => {
  const obj = e.target;
  if (!obj) return;
  const bound = obj.getBoundingRect();
  if (bound.left < 0) obj.set("left", obj.left - bound.left);
  if (bound.top < 0) obj.set("top", obj.top - bound.top);
  if (bound.left + bound.width > dims.width) 
    obj.set("left", obj.left - (bound.left + bound.width - dims.width));
  if (bound.top + bound.height > dims.height) 
    obj.set("top", obj.top - (bound.top + bound.height - dims.height));
});
```

---

## Problem 2: Image Generation -- Where and How

Images can be generated in two places:

### A. Within the Content Editor (Design tab)
The `GenerateSectionImageDialog` is already wired up in `EbookPageDesigner.tsx`. It opens when:
- **Template/Freeform mode**: Click a placeholder image area on the page, then select "Generate" from the image action
- **Canvas mode**: Use the **Add > Image** dropdown in the toolbar, then the `onImageAction("generate")` callback opens the dialog

**Current issue**: In Canvas mode, the "Add > Image" dropdown only has an "upload" option. There is no "Generate with AI" option.

**Fix: `src/components/content/FabricPageCanvas.tsx`**

Add a "Generate with AI" menu item to the Add dropdown:

```tsx
{onImageAction && (
  <>
    <DropdownMenuItem onClick={() => onImageAction("upload")}>
      <Image className="w-3.5 h-3.5 mr-2" /> Upload Image
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => onImageAction("generate")}>
      <Sparkles className="w-3.5 h-3.5 mr-2" /> Generate with AI
    </DropdownMenuItem>
  </>
)}
```

### B. From the Image Studio page (`/image-studio`)
Users can generate standalone images from the sidebar navigation under "Image Studio". These can then be inserted into pages.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/lib/fabricPageSerializer.ts` | Add `estimateTextHeight` helper; rewrite `layoutChapterOpener`, `layoutTitle`, `layoutQuote`, `layoutCTA` to use dynamic stacking instead of fixed offsets |
| `src/components/content/FabricPageCanvas.tsx` | Add canvas boundary clamping on `object:moving`; add "Generate with AI" to the Add dropdown menu |

## Technical Details

### `estimateTextHeight` helper

```typescript
function estimateTextHeight(
  text: string, fontSize: number, width: number, lineHeight = 1.3
): number {
  const avgCharWidth = fontSize * 0.55;
  const charsPerLine = Math.max(1, Math.floor(width / avgCharWidth));
  const lines = Math.ceil(text.length / charsPerLine);
  return Math.max(lines, 1) * fontSize * lineHeight;
}
```

### Revised `layoutChapterOpener` (conceptual)

```typescript
function layoutChapterOpener(...) {
  let y = t + h * 0.2; // Start 20% down instead of 35%

  if (c.subheading) {
    const subH = estimateTextHeight(c.subheading, baseSize * 0.7, w * 0.8);
    objects.push({ type: "Textbox", left: l + w*0.1, top: y, width: w*0.8, ... });
    y += subH + 12;
  }
  if (c.heading) {
    const headH = estimateTextHeight(c.heading, baseSize * 1.5, w * 0.8);
    objects.push({ type: "Textbox", left: l + w*0.1, top: y, width: w*0.8, ... });
    y += headH + 16;
  }
  // Divider
  objects.push({ type: "Rect", left: l + w*0.35, top: y, width: w*0.3, height: 1 });
  y += 16;
  
  if (c.body) {
    // Clamp body height to remaining space
    const maxBodyH = (t + h) - y - 10;
    objects.push({ type: "Textbox", left: l + w*0.1, top: y, width: w*0.8, ... });
  }
}
```

No database changes required.
