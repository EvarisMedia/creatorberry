

# Theme Background Designs and Auto-Aligned Text

## Overview

Each theme currently only sets colors and fonts -- pages have plain solid backgrounds. This plan adds decorative background designs (gradient overlays, geometric shapes, patterns, accent bars) unique to each theme, rendered as SVG/CSS overlays on every page. Text positioning automatically adjusts based on the background design to avoid overlapping decorative elements.

## How It Works

Each theme gets a new `backgroundDesign` property that defines decorative elements rendered behind (or alongside) the page content. These are pure CSS/SVG -- no external images needed, so they export cleanly to PDF.

### Background Design Types

Each theme will have a set of decorative elements composed from:
- **Gradient overlays** (subtle linear/radial gradients using theme colors)
- **Geometric shapes** (circles, rectangles, triangles positioned at corners/edges)
- **Accent bars/stripes** (header bars, sidebar stripes, bottom borders)
- **Pattern overlays** (dots, grid lines, diagonal stripes at low opacity)

### Per-Theme Designs

| Theme | Background Design |
|-------|------------------|
| Minimal Clean | Subtle top-left corner circle + thin bottom accent line |
| Classic Elegant | Warm gradient top edge + decorative corner flourish shapes |
| Bold Modern | Large red diagonal stripe in corner + bold header bar |
| Warm Earthy | Soft radial gradient + scattered small dot pattern |
| Ocean Breeze | Wave-shaped SVG along bottom + light gradient wash |
| Dark Professional | Geometric angular shapes in corners + subtle grid pattern |
| Playful Creative | Colorful blob shapes in corners + confetti dots |
| Nature Zen | Leaf-shaped SVG accents + soft green gradient edge |

### Text Auto-Alignment

Each background design specifies a `contentPadding` object that tells the layout renderer how much extra space to add on each side to avoid overlapping decorations:

```
contentPadding: { top: 40, right: 20, bottom: 30, left: 20 }
```

This padding is applied as an additional wrapper around the existing layout content, so text automatically flows within the safe area of each design.

---

## Technical Changes

### 1. Extend Theme Data (`ThemeGallery.tsx`)

Add `backgroundDesign` to the `DesignTheme` interface:

```typescript
export interface ThemeBackgroundDesign {
  // Array of SVG/CSS decorative elements
  elements: BackgroundElement[];
  // Extra padding to keep text away from decorations
  contentPadding: { top: number; right: number; bottom: number; left: number };
}

export interface BackgroundElement {
  type: "circle" | "rect" | "gradient" | "wave" | "dots" | "stripe" | "blob";
  // Position: CSS values
  position: { top?: string; right?: string; bottom?: string; left?: string };
  size: { width: string; height: string };
  color: string; // theme color key or hex
  opacity: number;
  rotation?: number;
  borderRadius?: string;
}
```

Each of the 8 themes gets a unique `backgroundDesign` with 2-4 decorative elements.

### 2. New Background Renderer (`PageBackgroundRenderer.tsx`)

A new component that renders decorative elements as absolutely-positioned divs/SVGs behind the page content:

- Receives the theme's `backgroundDesign` config
- Renders each element as a positioned `div` with CSS gradients, border-radius, rotation, opacity
- For complex shapes (waves, blobs), uses inline SVG paths
- All elements use `pointer-events: none` so they don't interfere with editing

### 3. Update Page Rendering (`EbookPage.tsx`)

- Import and render `PageBackgroundRenderer` behind the content
- Apply `contentPadding` from the active theme's background design as an additional wrapper div around layout content
- The background design name is stored in `PDFStyleConfig` so it persists

### 4. Update Theme Gallery Preview (`ThemeGallery.tsx`)

- The mini page preview in each theme card now shows a tiny version of the background decorations so users can see what the design looks like before selecting

### 5. Update PDF Export (`generatePDF.ts`)

- When rendering pages to PDF canvas, include the background decorations
- Since decorations are CSS/SVG-based (no external images), they render naturally with html2canvas or similar

---

## Files Summary

### New Files
1. `src/components/content/PageBackgroundRenderer.tsx` -- Renders decorative background elements
2. `src/components/content/themeBackgrounds.ts` -- Background design definitions for all 8 themes

### Modified Files
1. `src/components/content/ThemeGallery.tsx` -- Add `backgroundDesign` to theme data, update preview cards
2. `src/components/content/EbookPage.tsx` -- Render background layer + apply content padding
3. `src/components/content/PDFStyleSettings.tsx` -- Store background design reference in config
4. `src/components/content/ebookLayouts.tsx` -- Accept and apply content padding in layout renderers

### No Database Changes
- Background design name is stored in the existing `pdf_style_config` JSONB column

