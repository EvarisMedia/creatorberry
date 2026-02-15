

# AI-Powered Auto Layout for Ebook Pages

## How It Works

When a creator enters the "Page Design" tab, the system sends the section content to an AI function that analyzes headings, paragraphs, images, lists, and quotes -- then returns a complete page-by-page layout assignment. The creator sees fully designed pages immediately, and can swap any page's layout manually if they want something different.

## Flow

1. Creator clicks **"Page Design"** tab
2. System calls the `auto-layout-ebook` edge function with the section's markdown content and PDF style settings
3. AI analyzes the content structure and returns an array of pages, each with a recommended layout template and the content slotted into that template's fields (heading, body, image, items, quote, etc.)
4. Pages render instantly with the AI-chosen layouts
5. Creator can click any page and choose **"Change Layout"** to pick a different template -- the content re-flows into the new layout automatically

## AI Layout Logic (Edge Function)

The AI receives the full markdown content and a list of available layout templates with descriptions. It returns structured output using tool calling:

```
Input:
- Full markdown content of the section
- Available layouts: title, chapter-opener, full-text, text-image, image-text, full-image, two-column, quote, checklist, key-takeaways, call-to-action, blank
- Page size (6x9, 8.5x11, etc.)
- Brand context (tone, style)

Output (via tool calling):
[
  { layout: "chapter-opener", heading: "...", subheading: "..." },
  { layout: "text-image", heading: "...", body: "...", image: "url-from-content" },
  { layout: "full-text", heading: "...", body: "..." },
  { layout: "quote", quote: "...", attribution: "..." },
  { layout: "key-takeaways", heading: "...", items: ["...", "..."] },
  ...
]
```

The AI makes smart decisions like:
- Detecting a strong opening sentence and assigning "chapter-opener"
- Spotting blockquotes and assigning "quote" layout
- Pairing images with adjacent text into "text-image" layouts
- Converting bullet lists into "key-takeaways" or "checklist" pages
- Splitting long text blocks across multiple "full-text" pages based on word count per page

## Changes

### 1. New Edge Function: auto-layout-ebook
**File:** `supabase/functions/auto-layout-ebook/index.ts`

- Accepts: `content` (markdown), `pageSize`, `brandContext`, `availableLayouts`
- Uses Lovable AI gateway with tool calling to get structured layout assignments
- Returns: array of page objects with layout type and slotted content
- Uses `google/gemini-3-flash-preview` for speed

### 2. New Components (Ebook Designer)
**File:** `src/components/content/EbookPageDesigner.tsx`
- On mount, calls the auto-layout function if no saved layouts exist
- Shows a loading state ("Designing your pages...") while AI processes
- Renders the returned pages using the scaling approach (fixed page dimensions, CSS transform)
- Thumbnail sidebar for page navigation
- "Change Layout" button on each page opens PageLayoutPicker
- "Regenerate Layout" button to re-run AI on the whole section

**File:** `src/components/content/EbookPage.tsx`
- Renders a single page with the assigned layout template
- Applies PDF style settings (font, colors)
- Content is editable inline

**File:** `src/components/content/PageLayoutPicker.tsx`
- Visual gallery of layout templates as wireframe thumbnails
- Click to swap the current page's layout -- content re-maps to the new template's fields

**File:** `src/components/content/ebookLayouts.tsx`
- Layout template definitions with render functions and wireframe thumbnails
- 12 templates: title, chapter-opener, full-text, text-image, image-text, full-image, two-column, quote, checklist, key-takeaways, call-to-action, blank

### 3. Integration in ContentEditor
**File:** `src/pages/ContentEditor.tsx`
- Add "Page Design" tab alongside Edit and Preview
- When tab is selected, mount EbookPageDesigner with the current section content
- Save page layout data to the `expanded_content` record (new `page_layouts` JSONB column)

### 4. Database Migration
- Add `page_layouts JSONB DEFAULT NULL` column to `expanded_content` table
- Stores the array of page objects so layouts persist between sessions

### 5. Page Size in PDF Settings
**File:** `src/components/content/PDFStyleSettings.tsx`
- Add page size selector: 6x9", 5.5x8.5", 8.5x11", 8x8" square
- This value is passed to the auto-layout function and affects page dimensions in the designer

## Technical Details

### Scaling (Lovable Slides Pattern)
Each page renders at fixed pixel dimensions (e.g., 432x648 for 6x9") and scales to fit the editor container using `transform: scale(containerWidth / pageWidth)`. The parent container has `overflow: hidden` and `position: relative`.

### AI Tool Calling Schema
The edge function uses tool calling to ensure structured output:
```
tools: [{
  type: "function",
  function: {
    name: "design_ebook_pages",
    parameters: {
      type: "object",
      properties: {
        pages: {
          type: "array",
          items: {
            type: "object",
            properties: {
              layout: { type: "string", enum: [...all layout names] },
              heading: { type: "string" },
              subheading: { type: "string" },
              body: { type: "string" },
              image: { type: "string" },
              items: { type: "array", items: { type: "string" } },
              quote: { type: "string" },
              attribution: { type: "string" }
            }
          }
        }
      }
    }
  }
}]
```

### Files to Create
- `supabase/functions/auto-layout-ebook/index.ts`
- `src/components/content/EbookPageDesigner.tsx`
- `src/components/content/EbookPage.tsx`
- `src/components/content/PageLayoutPicker.tsx`
- `src/components/content/ebookLayouts.tsx`

### Files to Modify
- `src/pages/ContentEditor.tsx` -- Add Page Design tab
- `src/components/content/PDFStyleSettings.tsx` -- Add page size selector
- `supabase/config.toml` -- Register new edge function

### Database
- Add `page_layouts` JSONB column to `expanded_content` table

