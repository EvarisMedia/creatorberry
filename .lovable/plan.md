

# Streamline Content Editor: Fullscreen Mode, Unified Editing, and More Page Sizes

## Problems Identified

1. **Page Designer is cramped**: The main sidebar (264px) + section sidebar (240px) = 504px eaten before the editor even starts. The page design area is too small for visual editing.
2. **Preview has no fullscreen**: Users can't see a clean, distraction-free print preview.
3. **Two editing modes cause confusion**: The "Edit" tab has a markdown textarea with AI tools, while "Page Design" has inline contentEditable editing. Users don't know which edits "stick" or which is the source of truth.
4. **Missing page sizes**: Only 4 sizes available (6x9, 5.5x8.5, 8.5x11, 8x8). No landscape, A4, or other common formats.

## Solution

### 1. Fullscreen Toggle for Page Design and Preview

Add a fullscreen button that hides both sidebars and the header, giving the editor the entire viewport. Works for both "Page Design" and "Preview" tabs.

- A "Fullscreen" button (Maximize icon) in the toolbar area of Page Design and Preview
- When active: both sidebars and the page header are hidden via CSS (`hidden` class), the editor area takes `100vw` and `100vh`
- An "Exit Fullscreen" button (X or Minimize icon) floats in the top-right corner
- Pressing Escape also exits fullscreen

### 2. Merge Edit and Page Design into a Single Workflow

Remove the confusion by making the tabs: **"Edit Content"** (markdown/raw) and **"Visual Designer"** (page layouts with inline editing + AI). Rename clearly:

- **"Edit Content"** -- The markdown textarea for raw text editing with AI toolbar. This is for writing and generating content.
- **"Visual Designer"** -- The page layout editor where users see the final design and can edit text/images inline. This is for designing the output.
- **"Preview"** -- Read-only print preview of the designed pages.

Add a clear label/description under each tab so users understand the purpose:
- Edit Content: "Write and edit your raw content"
- Visual Designer: "Design your pages visually"  
- Preview: "See how your export will look"

### 3. More Page Sizes

Add these sizes to the `PAGE_SIZES` constant and the PDF Settings dropdown:

| Size | Dimensions (px at 72dpi) | Use Case |
|------|--------------------------|----------|
| A4 Portrait | 595 x 842 | International standard |
| A4 Landscape | 842 x 595 | Presentations, workbooks |
| A5 Portrait | 420 x 595 | Small books |
| US Letter Landscape | 792 x 612 | Landscape workbooks |
| 16:9 Landscape | 960 x 540 | Slide-style ebooks |
| 6x9 | 432 x 648 | (existing) |
| 5.5x8.5 | 396 x 612 | (existing) |
| 8.5x11 | 612 x 792 | (existing) |
| 8x8 | 576 x 576 | (existing) |

### 4. Better Layout for Page Designer

When in Page Design or Preview, automatically collapse/hide the section sidebar and use a more compact layout:
- Thumbnail strip stays on the left (narrower, 100px)
- Main page view takes remaining space
- The section nav can be accessed via a small toggle button

## Technical Details

### Fullscreen State
Add a `isFullscreen` state to `ContentEditor.tsx`. When true:
- The outer `div.min-h-screen.flex` gets a conditional class that hides both `<aside>` elements
- The `<main>` area becomes `fixed inset-0 z-50 bg-background`
- A floating "Exit" button appears in the top-right

### Tab Renaming
In `ContentEditor.tsx` lines 505-510, update:
```
TabsTrigger value="edit" -> "Edit Content"
TabsTrigger value="page-design" -> "Visual Designer"  
TabsTrigger value="preview" -> "Preview"
```

### PAGE_SIZES Update
In `src/components/content/ebookLayouts.tsx` line 497-502, add new entries:
```
"a4": { width: 595, height: 842, label: 'A4 Portrait' },
"a4-landscape": { width: 842, height: 595, label: 'A4 Landscape' },
"a5": { width: 420, height: 595, label: 'A5 Portrait' },
"letter-landscape": { width: 792, height: 612, label: 'Letter Landscape' },
"16x9": { width: 960, height: 540, label: '16:9 Landscape (Slides)' },
```

### PDFStyleSettings Update
In `src/components/content/PDFStyleSettings.tsx`, update the `pageSize` type and add new `SelectItem` entries for each new size.

### Auto-hide Section Sidebar
When `editorTab` is `"page-design"` or `"preview"`, hide the section sidebar (the `w-60` aside) or collapse it to a small toggle. This gives ~240px more width to the designer.

### Files to Modify
- `src/pages/ContentEditor.tsx` -- Fullscreen toggle, tab renaming, auto-hide section sidebar
- `src/components/content/ebookLayouts.tsx` -- Add new page sizes
- `src/components/content/PDFStyleSettings.tsx` -- Add new page size options to dropdown and type
- `src/components/content/EbookPageDesigner.tsx` -- Add fullscreen button, adjust thumbnail width

### No New Files Needed
### No Database Changes Needed

