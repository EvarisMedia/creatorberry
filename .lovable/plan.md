

# Add Delete and Generate New Outline to Outline Detail View

## Overview

Currently, when viewing an outline's detail page (`/outlines/:id`), the header only shows "Back to Outlines" and "Build All Sections." The user has no way to delete the current outline or generate a new one without going back to the list. This plan adds both actions to the detail view header.

## Changes

### File: `src/pages/ProductOutline.tsx`

1. **Add a Delete button** to the `headerActions` area when viewing an outline detail (`outlineId` is present). Clicking it will call the existing `handleDeleteOutline` with a confirmation, then navigate back to `/outlines`.

2. **Add a "Generate Outline" button** next to the delete button so users can create a new outline without leaving the detail view. This opens the existing `GenerateOutlineDialog`.

3. **Add a confirmation dialog** before deleting (using the existing `AlertDialog` component) to prevent accidental deletions.

The header actions for the detail view will look like:

```
[Back to Outlines]   [+ Generate Outline]   [Delete (trash icon)]
```

### Technical Details

- Import `Trash2` icon from lucide-react and `AlertDialog` components from the UI library
- Add `showDeleteConfirm` state to manage the confirmation dialog
- The "Generate Outline" button reuses the existing `setShowGenerateDialog(true)` already wired up
- The delete confirmation dialog calls `handleDeleteOutline(outlineId)` on confirm

No database or backend changes needed -- all functions (`deleteOutline`, `generateOutline`) already exist.

