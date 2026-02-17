

# Fix Image Insertion: Cursor Position and Design Tab Routing

## Problems

1. **Image appends to bottom instead of cursor position**: The `handleInsertImage` function (line 157-191) checks `cursorPosition` but this value is only set when the user clicks/selects inside the textarea (via `handleTextareaSelect`). When the user clicks "Generate Section Image" (which opens a dialog), the textarea loses focus and `cursorPosition` becomes stale or null. The fallback (`cursorPosition ?? editContent.length`) then appends to the end. Additionally, if `editingId` is not set (user is not in edit mode), the image always appends to the latest content.

2. **Design tab image routing is broken**: The `handleImageInsertRouted` function (line 303-312) calls `handleInsertImage` in BOTH branches -- it never actually inserts into the page layout. The `EbookPageDesigner` has its own `onInsertImageToPage` prop but it's never wired up from `ContentEditor`.

## Fixes

### Fix 1: Preserve cursor position before dialog opens

Save the cursor position immediately when the user clicks the "Generate Image" or "Insert Image" toolbar button, before the dialog steals focus.

**File: `src/pages/ContentEditor.tsx`**

- In the `ContentToolbar`'s `onInsertImage` callback (line 596-599), save `cursorPosition` from the textarea before triggering the dialog click
- Change `handleTextareaSelect` to also save on every keystroke/change so the position is always current
- Store the cursor position in a ref (not just state) so it survives re-renders during dialog interaction

### Fix 2: Route images to page designer when on Design tab

**File: `src/pages/ContentEditor.tsx`**

- Add an `insertImageToPageRef` -- a ref holding a callback function that `EbookPageDesigner` populates
- Pass `onInsertImageToPage` prop to `EbookPageDesigner` that sets this ref
- In `handleImageInsertRouted`: when `editorTab === "design"`, call `insertImageToPageRef.current(imageUrl)` instead of `handleInsertImage`

**File: `src/components/content/EbookPageDesigner.tsx`**

- The component already has `insertImageToCurrentPage` (a useCallback). Wire the `onInsertImageToPage` prop so the parent can trigger it
- Expose the callback via a prop: `onInsertImageToPage?: (fn: (url: string) => void) => void` -- called on mount to register the function

### Fix 3: Wire all image insertion points through the router

Update these callers to use `handleImageInsertRouted` instead of `handleInsertImage`:
- Line 650: Gallery image click
- Line 714: Hidden dialog's `onInsertImage`
- Line 725: Visible dialog's `onInsertImage`
- Line 758: Section images gallery "Insert" button

This ensures every image insertion respects the active tab context.

## Technical Details

### Cursor Position via Ref

```typescript
const cursorPosRef = useRef<number | null>(null);

const handleTextareaSelect = () => {
  if (editTextareaRef.current) {
    cursorPosRef.current = editTextareaRef.current.selectionStart;
    setCursorPosition(editTextareaRef.current.selectionStart);
    // ... existing selection logic
  }
};
```

Then in `handleInsertImage`:
```typescript
const pos = cursorPosRef.current ?? editContent.length;
```

### Designer Image Callback Registration

```typescript
// In ContentEditor
const designerInsertImageRef = useRef<((url: string) => void) | null>(null);

// Pass to EbookPageDesigner
<EbookPageDesigner
  ...
  onRegisterInsertImage={(fn) => { designerInsertImageRef.current = fn; }}
/>

// In handleImageInsertRouted
if (editorTab === "design" && designerInsertImageRef.current) {
  designerInsertImageRef.current(imageUrl);
} else {
  handleInsertImage(imageUrl, altText);
}
```

### Files to Modify
- `src/pages/ContentEditor.tsx` -- Fix cursor tracking, fix routing, wire all callers
- `src/components/content/EbookPageDesigner.tsx` -- Expose insert image callback via `onRegisterInsertImage` prop

### No new files needed
### No database changes needed
