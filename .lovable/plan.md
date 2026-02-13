

# Fix Export Download + Rich Content Editor with Images and PDF Styling

## Problem Summary
1. **Download button hidden**: Export history records have `file_url = null` because exports return content inline without saving a file URL. The condition `{exp.file_url && ...}` always hides the button.
2. **Images show as markdown code**: "Insert into Content" appends `![text](url)` as raw text in a `<Textarea>`, not as a rendered image.
3. **No aspect ratio/style options** in the Generate Section Image dialog.
4. **No PDF styling controls** in the Content Editor.

---

## Changes

### 1. Fix Export History Download Button
**File:** `src/pages/ExportCenter.tsx`

Remove the `{exp.file_url && ...}` condition. Instead, always show the download button. When clicked, it re-triggers the export (same outline + format) to generate and download the file again. Since `file_url` is never populated (content is returned inline), the button should use the `exportProduct` mutation with the stored `product_outline_id` and `format` from the history record.

Alternatively (simpler): Always show the download button but instead of relying on `file_url`, store the export format/outlineId on each record and re-export on click. Since re-exporting is slow, the better approach is to just always show the download icon and make it trigger a re-export toast message explaining the re-download.

**Simplest fix**: Remove the `exp.file_url` condition so the button is always visible. Change the `<a href>` approach to an `onClick` that calls `exportProduct.mutate({ outlineId: exp.product_outline_id, format: exp.format })`.

### 2. Rich Content Display with Visual Images
**File:** `src/pages/ContentEditor.tsx`

Replace the plain `<Textarea>` editing and raw `whitespace-pre-wrap` display with a rich content renderer:

- **View mode**: Parse the content string and render markdown images (`![alt](url)`) as actual `<img>` tags inline within the text. Use a simple regex-based renderer that splits content by image patterns and renders text as `<p>` and images as `<img>`.
- **Edit mode**: Keep the `<Textarea>` for raw editing, but add a toolbar above it with an "Insert Image" button that opens a picker to select from the section gallery or generate a new one. This inserts the markdown tag at the cursor position.
- **"Insert into Content" button**: When clicked, it still appends `![](url)` to the content string, but the view mode will render it as an actual image.

Create a new component `src/components/content/RichContentRenderer.tsx`:
- Takes a content string (markdown)
- Splits by `![alt](url)` patterns
- Renders text segments as formatted paragraphs and image patterns as `<img>` elements
- Supports basic markdown formatting (bold, italic, headings)

### 3. Add Aspect Ratio and Enhanced Style Options to Image Generation
**File:** `src/components/content/GenerateSectionImageDialog.tsx`

Add new state and UI controls:
- **Aspect Ratio selector**: Options like "Square (1:1)", "Landscape (16:9)", "Portrait (9:16)", "Wide (4:3)", "Book Cover (2:3)"
- **More image types**: Add "Diagram", "Concept Map", "Quote Card" to the existing list
- **More styles**: Add "Watercolor", "3D Render", "Flat Design", "Vintage" to the style badges
- Pass the `aspect_ratio` parameter to the `generate-image` edge function

**File:** `supabase/functions/generate-image/index.ts`
- Accept `aspect_ratio` parameter and include it in the image generation prompt/parameters

### 4. PDF Styling Options in Content Editor
**File:** `src/pages/ContentEditor.tsx`

Add a collapsible "PDF Styling" panel below the content area (or as a tab):
- **Font Family**: Serif, Sans-serif, Monospace
- **Font Size**: Small, Medium, Large
- **Heading Color**: Color picker (defaults to brand primary color)
- **Page Layout**: Single column, Two column
- **Include Cover Page**: Toggle
- **Include TOC**: Toggle
- **Header/Footer text**: Optional inputs

Store these as local state or in a `content_styling` field. When exporting to PDF, pass these settings to the export function.

Create a new component `src/components/content/PDFStyleSettings.tsx`:
- Renders the styling controls
- Returns a settings object
- Saved per-section or per-outline

### 5. CSV Export Support
**File:** `supabase/functions/export-product/index.ts`

Add `"csv"` to valid formats. Generate CSV with columns: Chapter Number, Title, Description, Content, Word Count, Subsections.

---

## Technical Details

### RichContentRenderer Component
```text
Input: "Some text\n\n![Image](https://...)\n\nMore text"

Output:
+---------------------------+
| Some text                 |
|                           |
| [Rendered <img> element]  |
|                           |
| More text                 |
+---------------------------+
```

The renderer uses a regex split on `!\[([^\]]*)\]\(([^)]+)\)` to separate text and image segments, rendering each appropriately.

### Export History Download Fix
- Remove `{exp.file_url && ...}` guard
- Add onClick handler that calls `exportProduct.mutate()` with the record's outline ID and format
- Show a loading spinner while re-exporting

### Image Generation Dialog Enhancements
- New `aspectRatio` state with Select dropdown
- Values: `"1:1"`, `"16:9"`, `"9:16"`, `"4:3"`, `"2:3"`
- Passed in the edge function body as `aspect_ratio`
- Extended STYLES array with more options
- Extended IMAGE_TYPES array with more types

### PDF Style Settings
- New component with form controls for font, colors, layout
- Settings object shape:
```text
{
  fontFamily: "serif" | "sans-serif" | "mono",
  fontSize: "small" | "medium" | "large",
  headingColor: "#hexcolor",
  layout: "single" | "two-column",
  includeCoverPage: boolean,
  includeToc: boolean,
  headerText: string,
  footerText: string
}
```
- Passed to export function via `settings` parameter

### Files to Create
- `src/components/content/RichContentRenderer.tsx`
- `src/components/content/PDFStyleSettings.tsx`

### Files to Modify
- `src/pages/ContentEditor.tsx` (rich renderer, PDF settings panel, image toolbar)
- `src/pages/ExportCenter.tsx` (download button fix)
- `src/components/content/GenerateSectionImageDialog.tsx` (aspect ratio, more styles/types)
- `supabase/functions/export-product/index.ts` (CSV format, PDF styling params)
- `supabase/functions/generate-image/index.ts` (accept aspect_ratio)

