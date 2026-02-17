

# Comprehensive Fix: PDF Download, Image Display, Image Generation UX, and Studio Parity

## Issues Found

### 1. PDF Download Opens Print Dialog Instead of Direct Download
The current PDF "export" generates styled HTML (not a real PDF binary). Both the initial export and the download-from-history paths open a print dialog. The user wants a direct `.pdf` file download.

**Fix:** Use `jsPDF` (already installed) combined with rendering the HTML pages to a canvas to produce an actual PDF binary file. This replaces the print-dialog approach entirely.

### 2. Images Not Showing in Design & Preview or Exported PDF
The `EbookPage` component renders images correctly via `<img>` tags when they have a URL. However, the exported PDF HTML uses `escapeXml()` on image URLs which breaks them if they contain `&` characters (common in signed URLs). Also, the export function only looks at `page_layouts` from `expanded_content` -- images embedded in markdown via `![alt](url)` tags are not carried into the visual page layouts.

**Fix:** Stop escaping image URLs in the export function's HTML rendering. Images from the designer should render as-is since they're stored as public URLs in the `generated-images` bucket.

### 3. Generate Section Image Missing Custom Prompt in Designer
When clicking "Generate" on an image slot in the Designer, `GenerateSectionImageDialog` opens but the "Custom Concept" option already exists -- it just requires selecting "Custom Concept" from the Image Type dropdown. The issue is discoverability.

**Fix:** Add a dedicated "Custom Prompt" textarea that's always visible (not hidden behind a dropdown selection), similar to the "Additional Context" field but more prominent.

### 4. Image Studio Missing Options Compared to Section Image Dialog
`GenerateStudioImageDialog` is missing: aspect ratio selection, style as clickable badges (uses dropdown instead), custom concept/prompt option, and additional context field.

**Fix:** Add aspect ratio picker, convert style to badge selector, add a "Custom Prompt" textarea, and an "Additional Context" input -- matching the `GenerateSectionImageDialog` feature set.

### 5. Real PDF Binary Generation
**Fix:** Create a client-side PDF generation utility that:
- Takes the designed pages HTML and renders them to canvas using `html2canvas` patterns
- Uses `jsPDF` to create actual PDF pages at the correct dimensions
- Falls back to HTML-print for the server-side edge function path

Since `jsPDF` is already installed, we'll use it to render each page directly with text/image content rather than relying on html2canvas (which would need to be added as a dependency).

---

## Implementation Plan

### Step 1: Fix PDF Export to Generate Real PDF Binary (Edge Function)

**File: `supabase/functions/export-product/index.ts`**

When `page_layouts` exist for PDF format:
- Instead of returning HTML with `extension: "pdf"`, generate a real PDF binary using the page layout data
- Use a minimal PDF builder in Deno (manual PDF stream construction or a lightweight library)
- Alternatively, keep the HTML approach for the edge function but change the client-side download to use `jsPDF` for rendering

**Chosen approach: Client-side PDF generation using jsPDF**

The edge function will continue to return the structured page data. A new client-side function will use `jsPDF` to render each page as a real PDF.

**File: `src/lib/generatePDF.ts` (new)**
- Takes an array of `EbookPageData`, page dimensions, and style config
- Creates a `jsPDF` document with correct page size
- For each page, renders headings, body text, and images using jsPDF's API
- Returns a downloadable Blob

**File: `src/hooks/useProductExports.tsx`**
- Update `exportProduct.onSuccess`: for PDF format, if the response includes page layout data, use `generatePDF()` client-side to create and download a real PDF
- Update `downloadExport.onSuccess`: for PDF format, fetch the stored HTML, parse it, and re-generate via jsPDF, OR store the actual PDF binary in storage

**Simpler approach chosen:** Update the edge function to return page layout JSON for PDF, and have the client generate the PDF using jsPDF. For storage, store the HTML as before but on download, generate PDF client-side.

### Step 2: Fix Image Display in Export HTML

**File: `supabase/functions/export-product/index.ts`**
- In the page layout HTML renderer, stop using `escapeXml()` on image URLs
- Use a safe URL-only escaper that preserves `&`, `=`, etc. but escapes quotes and angle brackets

### Step 3: Enhance GenerateSectionImageDialog with Prominent Custom Prompt

**File: `src/components/content/GenerateSectionImageDialog.tsx`**
- Move the custom prompt textarea to always be visible (not just when "custom_concept" is selected)
- Relabel it as "Custom Instructions (optional)" so it works as additional context for any image type
- Keep the "Custom Concept" image type for fully custom prompts

### Step 4: Add Missing Options to Image Studio Dialog

**File: `src/components/images/GenerateStudioImageDialog.tsx`**
- Add aspect ratio selector (matching GenerateSectionImageDialog)
- Convert style selector from dropdown to clickable badge grid
- Add "Custom Concept" as an image type option
- Add "Custom Instructions / Additional Context" textarea
- Add "Custom Prompt" textarea for custom_concept type
- Pass `aspect_ratio` and `custom_context` / `custom_prompt` to the generate-image function

### Step 5: Update useProductExports for Direct PDF Download

**File: `src/hooks/useProductExports.tsx`**
- In `exportProduct.onSuccess` for PDF: use jsPDF to create a real PDF blob and trigger download
- In `downloadExport.onSuccess` for PDF: fetch the HTML, render it in a hidden iframe, use jsPDF to capture and download as real PDF
- Remove the print dialog logic entirely

---

## Technical Details

### New file: `src/lib/generatePDF.ts`
```typescript
import jsPDF from "jspdf";

export async function generatePDFFromPages(
  pages: EbookPageData[],
  dims: { width: number; height: number },
  pdfStyle: PDFStyleConfig,
  title: string
): Promise<Blob> {
  // Convert px to mm (72 DPI assumption: 1px = 0.3528mm)
  const pxToMm = 0.3528;
  const w = dims.width * pxToMm;
  const h = dims.height * pxToMm;
  
  const doc = new jsPDF({
    orientation: w > h ? "landscape" : "portrait",
    unit: "mm",
    format: [w, h],
  });

  for (let i = 0; i < pages.length; i++) {
    if (i > 0) doc.addPage([w, h]);
    const page = pages[i];
    // Render each layout type using doc.text(), doc.addImage(), etc.
    renderPageToJsPDF(doc, page, w, h, pdfStyle);
  }

  return doc.output("blob");
}
```

### Image URL fix in edge function
Replace: `${escapeXml(c.image)}`
With: `${c.image.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}`

### GenerateStudioImageDialog enhancements
- Add `ASPECT_RATIOS` constant (same as in GenerateSectionImageDialog)
- Add `customPrompt` and `extraContext` state
- Replace style `<Select>` with `<Badge>` grid
- Pass new params to `generateImage()`

### Files to Modify
1. `src/lib/generatePDF.ts` -- New: client-side PDF generation using jsPDF
2. `src/hooks/useProductExports.tsx` -- Use generatePDF for direct PDF download
3. `supabase/functions/export-product/index.ts` -- Fix image URL escaping, return page data for client-side PDF
4. `src/components/content/GenerateSectionImageDialog.tsx` -- Always-visible custom prompt
5. `src/components/images/GenerateStudioImageDialog.tsx` -- Add aspect ratio, badge styles, custom prompt, context
6. `src/hooks/useGeneratedImages.tsx` -- Pass new params (aspect_ratio, custom_prompt, custom_context) to generate-image function

