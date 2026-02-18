

# Theme Gallery + One-Click "Expand & Design All" Workflow

## Overview

Two major features to make the content creation process more automated and visually polished:

1. **Design Theme Gallery** -- Pre-built coordinated themes (colors, fonts, backgrounds) that users can apply to their entire ebook with one click
2. **"Expand & Design All" Automation** -- A single button on the Outline page that sequentially expands every section with AI and then auto-generates page layouts, so users get a complete designed ebook draft with minimal effort

---

## Feature 1: Design Theme Gallery

### What It Does

Instead of manually picking heading color, font family, and font size, users select a named theme like "Minimal Clean", "Bold & Modern", or "Warm Earthy" and it applies a coordinated set of styles across all pages.

### Theme Data Structure

Each theme includes:
- Name and thumbnail preview
- Font family (serif / sans-serif / mono)
- Font size (small / medium / large)
- Heading color
- Accent color (for bullets, CTA backgrounds, numbering)
- Page background color
- Body text color

### Built-In Themes (8 Starter Themes)

| Theme | Font | Heading | Accent | Background |
|-------|------|---------|--------|------------|
| Minimal Clean | sans-serif | #1a1a2e | #6366f1 | #ffffff |
| Classic Elegant | serif | #2c1810 | #8b6f47 | #faf8f5 |
| Bold Modern | sans-serif | #0f172a | #ef4444 | #ffffff |
| Warm Earthy | serif | #3d2c1e | #d97706 | #fefbf3 |
| Ocean Breeze | sans-serif | #0c4a6e | #0891b2 | #f0f9ff |
| Dark Professional | sans-serif | #e2e8f0 | #818cf8 | #1e293b |
| Playful Creative | sans-serif | #7c3aed | #ec4899 | #fdf4ff |
| Nature Zen | serif | #14532d | #16a34a | #f0fdf4 |

### Where It Lives in the UI

- New "Themes" button added to the Page Style tab (alongside existing font/color/size controls)
- Opens a dialog with theme cards showing preview swatches
- Selecting a theme updates the `PDFStyleConfig` and adds new fields (`accentColor`, `backgroundColor`, `bodyColor`, `themeName`)
- The `PDFStyleConfig` interface gets extended with these new fields

### Technical Changes

**New file: `src/components/content/ThemeGallery.tsx`**
- Dialog component displaying 8 theme cards in a grid
- Each card shows a mini color swatch preview + theme name
- On select, calls `onChange(themeConfig)` to update all style fields at once

**Modified: `src/components/content/PDFStyleSettings.tsx`**
- Extend `PDFStyleConfig` with `accentColor`, `backgroundColor`, `bodyColor`, `themeName`
- Add "Choose Theme" button that opens `ThemeGallery`
- Selecting a theme auto-fills all style fields

**Modified: `src/components/content/ebookLayouts.tsx`**
- `PageRenderProps.style` gets `accentColor`, `backgroundColor`, `bodyColor`
- Layout renderers use these for:
  - Page wrapper background color
  - Numbered circles in key-takeaways use accent color
  - CTA button uses accent color
  - Body text uses body color
  - Checkbox borders use accent color

**Modified: `src/components/content/EbookPage.tsx`**
- Pass new style fields from `pdfStyle` config down to layout renderers

---

## Feature 2: One-Click "Expand & Design All Sections"

### What It Does

On the Outline detail page, a new "Build All Sections" button appears. When clicked:

1. For each section (sequentially to avoid rate limits):
   a. Call `expand-content` edge function to generate the "Expand" mode content
   b. Call `auto-layout-ebook` edge function to generate page layouts from that content
   c. Save the page layouts to `expanded_content.page_layouts`
2. Show a progress indicator: "Expanding section 2 of 8..." / "Designing section 3 of 8..."
3. When complete, show a success toast with "View in Content Editor" link

### User Flow

```
Outline Page (sections listed)
  |
  v  [User clicks "Build All Sections"]
  |
  v  Progress modal: "Expanding Module 1: Introduction..."
  v  Progress modal: "Designing Module 1: Introduction..."
  v  Progress modal: "Expanding Module 2: Getting Started..."
  v  ... (repeats for each section)
  |
  v  Success: "All 8 sections expanded and designed!"
  v  [Go to Content Editor] button
```

### Skip Logic

- If a section already has expanded content for the default "expansion" mode, skip the expand step (use existing content)
- If a section already has page layouts, skip the design step
- This makes re-running safe -- it only fills gaps

### Technical Changes

**New file: `src/components/outlines/BuildAllSectionsDialog.tsx`**
- Modal dialog with progress bar and status text
- Takes `outlineId`, `sections[]`, `brandId`, `brandContext` as props
- Iterates sections sequentially, calling supabase functions
- Shows per-section progress with checkmarks for completed ones
- Has cancel button to stop mid-way (already-processed sections are saved)
- On completion, offers "Open Content Editor" link to first section

**Modified: `src/pages/ProductOutline.tsx`**
- Add "Build All Sections" button next to the outline info card
- Only visible when viewing an outline detail (has sections)
- Opens `BuildAllSectionsDialog`

**Modified: `src/hooks/useContentExpansion.tsx`**
- Add `expandSectionDirect` method that returns the content ID (for chaining with auto-layout)
- Existing `expandSection` already does this but refetches all contents; the new method is lighter for batch use

**Edge function changes: None required**
- `expand-content` and `auto-layout-ebook` already work independently
- The client orchestrates them sequentially

### Batch Processing Logic (in BuildAllSectionsDialog)

```
for each section:
  1. Check if expanded_content exists for (section.id, mode="expansion")
     - If yes: use existing content ID and text
     - If no: call expand-content, get back content ID and text
  
  2. Check if page_layouts is populated for that content ID
     - If yes: skip
     - If no: call auto-layout-ebook with the content text
     - Save returned pages to expanded_content.page_layouts
  
  3. Update progress bar: (currentIndex + 1) / totalSections
  
  Add 1-second delay between sections to avoid rate limits
```

---

## Files Summary

### New Files
1. `src/components/content/ThemeGallery.tsx` -- Theme picker dialog with 8 built-in themes
2. `src/components/outlines/BuildAllSectionsDialog.tsx` -- Progress dialog for batch expand+design

### Modified Files
1. `src/components/content/PDFStyleSettings.tsx` -- Extend config interface, add theme button
2. `src/components/content/ebookLayouts.tsx` -- Use accent/background/body colors in renderers
3. `src/components/content/EbookPage.tsx` -- Pass extended style props
4. `src/pages/ProductOutline.tsx` -- Add "Build All Sections" button
5. `src/hooks/useContentExpansion.tsx` -- Add lightweight expand method for batch use

### No Database Changes Required
- `pdf_style_config` is already a JSONB column that accepts any shape
- `page_layouts` already exists on `expanded_content`
- All new theme fields are stored in the existing JSONB config

