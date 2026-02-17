

# Redesign Content Editor Workflow

## Problems Found

1. **Fullscreen hides entire page**: The current fullscreen toggle (`isFullscreen`) hides the main sidebar and section sidebar, making the entire page fullscreen. The user wants fullscreen only within the editor area (the Visual Designer content area expands to fill the available space, not the browser viewport).

2. **PDF Style settings disconnected**: Page size and styling controls only appear in the Preview tab. The Visual Designer uses the same `pdfStyle` and `pageSize` but the user has no way to change them without switching tabs. This creates a confusing back-and-forth.

3. **Generate Section Image is broken**: The button at the bottom (line 769-776) renders a `GenerateSectionImageDialog` that calls `handleInsertImage` -- which inserts markdown into the raw text content (`editContent`). When the user is on the Visual Designer tab, this does nothing visible because Visual Designer uses `page_layouts`, not raw markdown. The image never appears in the page layout.

4. **Three tabs cause confusion**: "Edit Content" is raw markdown, "Visual Designer" is layout-based inline editing, "Preview" is read-only. Users don't understand which is the "source of truth." Edits in one don't reflect in the other (markdown edits don't update page layouts and vice versa).

## Solution: Unified Two-Tab Workflow

Reduce to **two tabs** with clear purposes and move shared controls to a persistent toolbar.

### Tab 1: "Write" (was "Edit Content")
- Raw markdown editor with AI tools, formatting toolbar
- For writing and generating content
- "Generate Section Image" button inserts into markdown here

### Tab 2: "Design & Preview" (merges Visual Designer + Preview)
- Top toolbar bar with: Page Size selector, Font/Style settings (inline, not collapsible), Fullscreen button
- Below toolbar: the page designer with thumbnails on the left, main editable page on the right
- The fullscreen button here only expands this tab's content area to fill the `<main>` element (using absolute positioning within the main area), NOT the entire browser viewport
- "Generate Section Image" in this tab inserts the image into the currently selected page's image slot
- When no pages exist yet, shows a "Generate Page Layouts" button
- This IS the preview -- pages are rendered at actual scale with real styling applied

This eliminates the Preview tab entirely because the Visual Designer already shows exactly what the export will look like.

### Shared Toolbar (above tabs)
Move the PDF Style settings (page size, font, colors) into a compact horizontal bar above the tabs so both Write and Design tabs benefit from the same settings. This replaces the collapsible `PDFStyleSettings` card that was buried inside Preview.

## Detailed Changes

### 1. ContentEditor.tsx -- Major restructure

**Remove**: The `isFullscreen` state that hides sidebars. Replace with `isDesignerFullscreen` that only affects the Design tab content area using `absolute inset-0 z-40` within `<main>`.

**Remove**: The "Preview" tab entirely. Merge its functionality into "Design & Preview."

**Move**: PDF style controls from inside Preview tab to a compact inline toolbar above the tabs. Show page size as a small dropdown, font as a dropdown, heading color as a small color picker -- all in a single horizontal row.

**Fix**: The "Generate Section Image" button at the bottom. When on the "Design & Preview" tab, its `onInsertImage` callback should update the selected page's image field in `designedPages` instead of inserting markdown. Add a new callback prop or detect the active tab.

**Rename tabs**:
- "edit" with label "Write" 
- "design" with label "Design & Preview"

### 2. EbookPageDesigner.tsx -- Add fullscreen support

Add an `isFullscreen` prop and `onToggleFullscreen` callback. When fullscreen:
- The component renders with `absolute inset-0 z-40 bg-background` within its parent
- An "Exit" button floats in the top-right
- Thumbnails get slightly more space (w-36)
- The main page view fills the remaining space

Add page size and style controls in the designer's own toolbar (compact inline row showing current page size, font, heading color).

### 3. Fix Generate Section Image for Design tab

Currently, `handleInsertImage` only modifies raw markdown content. When `editorTab === "design"`:
- The image should be inserted into the currently selected page's `content.image` field
- This requires the `EbookPageDesigner` to expose the selected page index and an `onInsertImageToPage` callback
- Or: move the Generate Section Image button inside the `EbookPageDesigner` component itself (it already has `handleImageAction` for this, but the dialog rendering is broken because `section` and `brand` props may be undefined)

The fix: Ensure `brand` and `section` are always passed correctly. The `showImageDialog` state in `EbookPageDesigner` already handles this, but the dialog only renders when `section && brand` are truthy (line 297). The props are being passed from ContentEditor (lines 691-692), so the issue is that the bottom button's `onInsertImage` goes to the wrong place. Remove the bottom `GenerateSectionImageDialog` when on the design tab, and rely on the one inside `EbookPageDesigner`.

### 4. Compact Style Toolbar

Replace the collapsible `PDFStyleSettings` card with a compact horizontal bar:

```
[Page Size: 6x9 v] [Font: Serif v] [Color: #1a1a2e] [Cover: on] [ToC: on]
```

This bar sits above the tab content, always visible, so changes apply to both writing preview and page design instantly.

## Files to Modify

- **src/pages/ContentEditor.tsx** -- Remove Preview tab, rename tabs, move style controls up, fix fullscreen to be design-area-only, fix image insertion routing
- **src/components/content/EbookPageDesigner.tsx** -- Accept fullscreen prop, add fullscreen button in its own toolbar, ensure image dialog works
- **src/components/content/PDFStyleSettings.tsx** -- Add a new compact/inline variant for the toolbar (keep the existing card variant as fallback)

## No new files needed
## No database changes needed

## Technical Notes

### Fullscreen within main area only
Instead of `fixed inset-0 z-50` on the entire page, use `absolute inset-0 z-40 bg-background` within the `<main>` element (which needs `position: relative`). This keeps the main sidebar visible but gives the designer the full main content area.

### Image insertion routing
Add a ref or callback from `EbookPageDesigner` so the parent can trigger image insertion into the selected page. Alternatively, conditionally render the bottom `GenerateSectionImageDialog` only on the "Write" tab, and let the designer's built-in image controls handle it on the "Design" tab.

### Style toolbar layout
The compact toolbar will use a flex row with small Select dropdowns (h-8) and a color input. It replaces the large collapsible card, saving vertical space and making settings always accessible.

