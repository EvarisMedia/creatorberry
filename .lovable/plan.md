

# Fix Preview to Show Page Layouts + Add Inline Editing to Page Designer

## Problems

1. **Preview tab ignores page layouts**: The Preview tab (line 634-668) renders content using `RichContentRenderer` with basic PDF styling. It does not show the actual page layouts created in the "Page Design" tab. Creators design pages in one tab but see something completely different in Preview.

2. **Page layouts are read-only**: The `EbookPage` component renders static text and images. Creators cannot click on a heading, body text, or image within a page layout to edit it directly. They have to go back to the Edit tab, modify raw markdown, and hope it maps correctly.

---

## Changes

### 1. Preview Tab Shows Page Layouts
**File:** `src/pages/ContentEditor.tsx`

Replace the current Preview tab content with a vertical scroll of all designed pages rendered at a readable scale using `EbookPage`. This shows the exact same layouts from the Page Design tab, styled with the current PDF settings, in a continuous scroll view -- like a print preview.

- Load saved `page_layouts` from the `expanded_content` record
- Render each page sequentially using `EbookPage` with PDF style settings applied
- Keep the `PDFStyleSettings` controls at the top so users can adjust font/colors and see changes instantly
- If no page layouts exist yet, fall back to the current `RichContentRenderer` preview

### 2. Inline Editing in Page Designer
**File:** `src/components/content/EbookPageDesigner.tsx`
**File:** `src/components/content/ebookLayouts.tsx`

Make all text fields in page layouts editable:

- **Text editing**: Each text element (heading, subheading, body, quote, attribution, list items) becomes a `contentEditable` span/div when the page is selected. Clicking on text allows direct typing.
- **Image editing**: Clicking an image slot shows overlay buttons: "Generate New", "Upload", "Remove". Clicking the placeholder on empty image slots opens the same options.
- **Auto-save**: After editing, changes are debounced and saved to the `page_layouts` JSONB column.

The approach:
- Add `onContentChange` callback prop to `EbookPage`
- In `ebookLayouts.tsx`, modify `renderPageLayout` to accept an `editable` flag and `onFieldChange(field, value)` callback
- When `editable=true`, text elements use `contentEditable` divs with `onBlur` to capture changes
- Image slots show an overlay with edit/upload/remove buttons when hovered

### 3. Image Management in Page Layouts
**File:** `src/components/content/EbookPageDesigner.tsx`

Add image controls for layout slots that support images (text-image, image-text, full-image):
- Hover overlay on image areas with "Generate", "Upload", "Remove" buttons
- Generate opens the existing `GenerateSectionImageDialog`
- Upload triggers a file picker
- Selected/generated image URL is saved into the page's `content.image` field
- Changes persist to the database immediately

---

## Technical Details

### Preview Tab Update
The Preview tab will:
1. Read `page_layouts` from the current content record (already loaded in `EbookPageDesigner`)
2. Render pages vertically with `EbookPage` at a comfortable reading scale
3. Show `PDFStyleSettings` above for live adjustments
4. Add page numbers between pages

### Editable Page Layout Rendering
The `renderPageLayout` function gains two new props:
- `editable: boolean` -- enables contentEditable on text elements
- `onFieldChange: (field: string, value: string) => void` -- called when text is edited

Each text element becomes:
```
<div
  contentEditable={editable}
  suppressContentEditableWarning
  onBlur={(e) => onFieldChange("heading", e.currentTarget.textContent || "")}
>
  {content.heading}
</div>
```

List items (checklist, key-takeaways) use individual contentEditable spans per item, with the ability to add/remove items.

### Image Slot Overlay
For layouts with image slots, when `editable=true`:
- The image area gets a hover overlay with action buttons
- Empty slots show a dashed border with "Add Image" prompt
- Clicking triggers a callback that the parent (`EbookPageDesigner`) handles

### Auto-Save with Debounce
Content changes in the page designer are debounced (500ms) before saving to the database. This prevents excessive writes while the user is typing.

### Files to Modify
- `src/pages/ContentEditor.tsx` -- Update Preview tab to render page layouts
- `src/components/content/EbookPageDesigner.tsx` -- Add inline editing, image management, content change handling
- `src/components/content/EbookPage.tsx` -- Pass editable/onContentChange props through
- `src/components/content/ebookLayouts.tsx` -- Make `renderPageLayout` support editable mode with contentEditable elements and image overlays

### No New Files Needed
All changes extend existing components.

### No Database Changes Needed
The `page_layouts` JSONB column already stores all the content per page, so inline edits just update the same structure.

