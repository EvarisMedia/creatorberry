

# Fix: Save Button in Design Tab + Fix Image Generation Dialog

## Issue 1: No Save Button in Design & Preview Tab

The Design tab auto-saves via a debounced function (500ms delay after edits), but there is no visible save button or feedback. The user has no way to know their changes are saved.

### Fix
Add a "Save" button to the `EbookPageDesigner` toolbar (line 255-276) that explicitly calls `saveLayouts(pages)` and shows a toast confirmation. Also add a small "Auto-saved" indicator so users know edits are persisted automatically.

**File: `src/components/content/EbookPageDesigner.tsx`**
- Add a `Save` button next to the existing toolbar buttons (near the "Change Layout" and "Fullscreen" buttons)
- The button calls `saveLayouts(pages)` and shows a toast

---

## Issue 2: Generate Image Dialog Never Opens

Two separate breakages:

### Problem A: Hidden dialog trigger ID is missing
In `ContentEditor.tsx` line 603, the toolbar's "Insert Image" button tries to programmatically click an element with `id="generate-image-trigger"`:
```js
const trigger = document.getElementById("generate-image-trigger");
trigger?.click();
```
But the `GenerateSectionImageDialog` component (lines 714-723) renders a `DialogTrigger` button with NO `id` attribute. So `getElementById` returns `null` and nothing happens.

### Problem B: Designer's image dialog renders but never opens
In `EbookPageDesigner.tsx` line 176-184, clicking "generate" on a page's image action sets `showImageDialog = true`. This conditionally renders `GenerateSectionImageDialog` (line 333), but that component has its own internal `open` state starting at `false`. The component renders a button (DialogTrigger) the user would have to click again -- but it's not even visible in the layout. So the dialog never opens.

### Fix A: Add the missing ID to the hidden trigger
In `GenerateSectionImageDialog.tsx`, add an optional `triggerId` prop. When provided, set `id={triggerId}` on the `DialogTrigger` button.

In `ContentEditor.tsx` line 717-722 (hidden dialog), pass `triggerId="generate-image-trigger"`.

### Fix B: Auto-open dialog in designer
Change `GenerateSectionImageDialog` to accept an optional `defaultOpen` prop. When the designer sets `showImageDialog = true`, pass `defaultOpen={true}` so the dialog opens immediately without requiring a second click.

Alternatively (simpler approach): In `EbookPageDesigner.tsx`, instead of rendering `GenerateSectionImageDialog` conditionally, always render it and control its open state externally. Pass `open={showImageDialog}` and `onOpenChange={setShowImageDialog}` as props.

The cleaner fix: Add `externalOpen` and `onExternalOpenChange` props to `GenerateSectionImageDialog` so the parent can control whether the dialog is open.

---

## Files to Modify

1. **`src/components/content/GenerateSectionImageDialog.tsx`**
   - Add `triggerId?: string` prop, apply to `DialogTrigger`
   - Add `externalOpen?: boolean` and `onExternalOpenChange?: (open: boolean) => void` props
   - When `externalOpen` is provided, use it instead of internal `open` state

2. **`src/components/content/EbookPageDesigner.tsx`**
   - Pass `externalOpen={showImageDialog}` and `onExternalOpenChange={setShowImageDialog}` to `GenerateSectionImageDialog`
   - Always render the dialog (remove the `showImageDialog &&` condition), let open/close be controlled by props
   - Add a "Save" button to the toolbar that calls `saveLayouts(pages)` with toast feedback

3. **`src/pages/ContentEditor.tsx`**
   - Pass `triggerId="generate-image-trigger"` to the hidden `GenerateSectionImageDialog` (line 717)

## No new files needed
## No database changes needed

