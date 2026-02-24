
# Simplify Editor: Remove Freeform Mode (Keep Template + Canvas)

## Overview

Remove the intermediate "Freeform" mode from the ebook designer, leaving only two clear modes:
- **Template** -- Structured, layout-based editing with inline text editing
- **Canvas** -- Full Fabric.js design freedom (drag, resize, rotate, layer)

## Changes

### File: `src/components/content/EbookPageDesigner.tsx`

1. **Remove state & functions related to freeform:**
   - Remove `freeformMode` state variable
   - Remove `toggleFreeformMode()` function
   - Remove `handleBlocksChange()` function
   - Remove `handleFreeformImageAction()` function
   - Remove `activeImageBlockId` state (only used by freeform)
   - Remove freeform-related block initialization in `addPage()`

2. **Simplify mode toggle button** to a direct two-state switch:
   - Template (Layers icon) -- click to switch to Canvas
   - Canvas (PenTool icon) -- click to switch back to Template
   - Update tooltip text accordingly

3. **Clean up the main page view** -- remove `freeformMode` prop from `EbookPage` and freeform-related callbacks (`onBlocksChange`, `onFreeformImageAction`)

4. **Show Layout button always in Template mode** (remove the `!freeformMode` condition since freeform no longer exists)

5. **Simplify image handling** -- remove freeform branch from `handleImageGenerated` and `handleFileUpload`

6. **Update status text** from three options to two: "Click text to edit" (Template) vs "Canvas: drag, rotate, resize objects" (Canvas)

7. **Remove unused imports:** `MousePointerClick`, `contentToBlocks`, `blocksToContent`, `ContentBlock`

### File: `src/components/content/EbookPage.tsx`

- Remove the `freeformMode` prop and any conditional rendering that uses it
- Remove references to `FreeformPageRenderer` if it's only used via freeform mode

### File: `src/components/content/FreeformPageRenderer.tsx`

- This file can be left in place (no breakage) or deleted entirely since nothing will reference it after the cleanup

## No database or backend changes required.
