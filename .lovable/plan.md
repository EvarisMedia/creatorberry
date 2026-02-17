

# Fix Page Size Persistence, PDF Export with Designs, and Design Editor Improvements

## Problems Identified

### 1. Page size (and all PDF style settings) not saving
The `pdfStyleConfig` state in `ContentEditor.tsx` is purely local React state initialized to defaults on every page load. When you change to "16:9" and click Save, nothing persists it to the database -- it resets on refresh.

### 2. PDF export ignores page designs
The `export-product` edge function generates exports from raw markdown only. The visual page layouts created in the Design tab (stored in `page_layouts` JSONB) are completely unused during export.

### 3. Design Editor UX issues
- No add/delete/reorder pages
- No drag-to-reorder thumbnails
- Thumbnail sidebar too narrow for landscape layouts
- No page number display on main view
- No duplicate page option

---

## Solution

### Fix 1: Persist PDF Style Config to Database

Add a `pdf_style_config` JSONB column to the `product_outlines` table. Load it on page open, save it whenever it changes.

**Database migration:**
```sql
ALTER TABLE product_outlines 
ADD COLUMN pdf_style_config jsonb DEFAULT '{}';
```

**ContentEditor.tsx changes:**
- On load, read `pdf_style_config` from the outline and use it to initialize `pdfStyleConfig` state
- Add a debounced save that writes config changes back to `product_outlines`
- This ensures page size, font, colors, cover/ToC toggles all persist

### Fix 2: PDF Export Using Page Designs

Update the `export-product` edge function to check if `page_layouts` exist in `expanded_content`. If they do, build the HTML from the structured page data instead of raw markdown. This means the visual layouts, image placements, and page structures from the Design tab will be reflected in PDF exports.

**Edge function changes (`export-product/index.ts`):**
- When format is "pdf", check each section's `expanded_content.page_layouts`
- If page layouts exist, render them as styled HTML pages (using the same layout logic as the frontend designer)
- If no page layouts exist, fall back to the current markdown-to-HTML conversion
- Also read the `pdf_style_config` from the outline to apply correct fonts, colors, and page dimensions

### Fix 3: Design Editor Improvements

**EbookPageDesigner.tsx enhancements:**
- Add Page button: Insert a new blank page after the selected page
- Delete Page button: Remove selected page (with confirmation)
- Duplicate Page button: Clone the current page
- Move Up/Down buttons: Reorder pages
- Page counter display on the main view (e.g., "Page 3 of 12")
- Better thumbnail sizing for landscape layouts (auto-detect aspect ratio)
- Keyboard shortcuts: Arrow keys to navigate pages, Delete to remove

**EbookPage.tsx improvements:**
- Show page number overlay on the main editing view
- Better visual feedback when editing (subtle background highlight on editable fields)

---

## Technical Details

### Database Migration
```sql
ALTER TABLE product_outlines 
ADD COLUMN pdf_style_config jsonb DEFAULT '{}';
```

### ContentEditor.tsx -- Persist Style Config
```typescript
// Load on mount
useEffect(() => {
  if (outlineId) {
    supabase.from("product_outlines")
      .select("pdf_style_config")
      .eq("id", outlineId)
      .single()
      .then(({ data }) => {
        if (data?.pdf_style_config) {
          setPdfStyleConfig({ ...DEFAULT_PDF_STYLE_CONFIG, ...data.pdf_style_config });
        }
      });
  }
}, [outlineId]);

// Debounced save on change
useEffect(() => {
  if (!outlineId) return;
  const timeout = setTimeout(() => {
    supabase.from("product_outlines")
      .update({ pdf_style_config: pdfStyleConfig })
      .eq("id", outlineId);
  }, 500);
  return () => clearTimeout(timeout);
}, [pdfStyleConfig, outlineId]);
```

### Export Function -- Page Layout HTML Renderer
When `page_layouts` exist, render each page as a styled HTML div with print-specific CSS (`page-break-after`, fixed dimensions matching the configured page size). Each layout type maps to an HTML template mirroring the frontend designer's visual output.

### Designer Toolbar Additions
Add buttons to the existing toolbar bar:
- Plus icon -> Add blank page after current
- Copy icon -> Duplicate current page  
- Trash icon -> Delete current page
- ChevronUp/ChevronDown -> Reorder pages
- Arrow left/right for keyboard navigation between pages

### Files to Modify
1. **Database migration** -- Add `pdf_style_config` column to `product_outlines`
2. **`src/pages/ContentEditor.tsx`** -- Load/save PDF style config from DB
3. **`supabase/functions/export-product/index.ts`** -- Render page layouts as HTML for PDF export
4. **`src/components/content/EbookPageDesigner.tsx`** -- Add/delete/duplicate/reorder pages, keyboard nav, better UX
5. **`src/components/content/EbookPage.tsx`** -- Page number overlay, better edit indicators
