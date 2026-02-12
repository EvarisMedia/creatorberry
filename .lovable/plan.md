
# Fix Dismissed Ideas Undo + Button Alignment

## Problem
1. **No undo for dismissed ideas**: Once an idea is dismissed, there's no way to bring it back -- the card only shows a Delete button.
2. **Button alignment**: The action buttons (Save, Start Building, Dismiss) are not vertically aligned/centered properly in the footer row.

## Changes

### File: `src/components/product-ideas/ProductIdeaCard.tsx`

**1. Add "Restore" button for dismissed ideas**
- When `idea.status === "dismissed"`, show a "Restore" button that sets the status back to `"new"`
- Uses an `Undo2` icon from lucide-react
- Styled consistently with the other ghost buttons

**2. Fix button alignment**
- Add `items-center` to the action bar container (already present, but buttons themselves need consistent sizing)
- Add `h-8` to all action buttons for uniform height
- Add `flex items-center` to ensure icon + text align on the same baseline

### Visual Result

**Before (dismissed card):**
```
[Delete icon]
```

**After (dismissed card):**
```
[Restore]                    [Delete icon]
```

**Before (new card buttons):**
```
[Save] [Start Building] [Dismiss]     [Delete]
```
Buttons may have uneven heights/alignment.

**After:**
All buttons share `h-8` height and `flex items-center` for perfect vertical alignment.
