

# Fix Build Errors + Visual Editor Improvements Inspired by Designrr

## Part 1: Fix All Build Errors (Critical)

The ContentEditor.tsx has 9 type errors from the recent AppLayout refactor where prop interfaces changed but the usage wasn't updated.

### Error-by-Error Fixes

**1. `GenerateSectionImageDialog` -- `onGenerated` prop doesn't exist (line 345)**
The component's interface has `onImageGenerated` (no-arg callback) and `onInsertImage` (url callback). Fix: replace `onGenerated` with the correct props.

**2. `EXPANSION_MODES` uses `.value` but the type has `.mode` (lines 472-490)**
`EXPANSION_MODES` is defined as `{ mode, label, description, icon }` but ContentEditor references `.value`. Fix: change all `.value` references to `.mode`.

**3. `ContentToolbar` missing required props (line 537)**
ContentToolbar requires `onInsertImage, onUploadImage, onGalleryImage, onAIEdit, hasSelection`. Fix: pass all required props using existing handlers.

**4. `AIEditToolbar` wrong props (line 541)**
AIEditToolbar expects `{ selectedText, fullContent, brandContext, onApplyEdit, onClose }` but receives `{ selectedText, brandId, sectionId, onApply }`. Fix: pass the correct prop names and values.

**5. `EbookPageDesigner` wrong props (line 573)**
The component doesn't accept `sectionImages`, `savedPages`, or `onInsertImageRef`. Its actual interface has `pageSize`, `brandContext`, `brand`, `section`, `onPagesChange`, `onRegisterInsertImage`. Fix: align props to the actual interface.

---

## Part 2: Designrr-Inspired Visual Editor Improvements

After analyzing Designrr's workflow, here are the key UX patterns worth adopting:

### What Designrr Does Well
1. **Template-First Approach**: Users pick a full-page template BEFORE content is placed, giving immediate visual satisfaction
2. **One-Click Content Flow**: Content auto-fills into chosen templates -- no manual copy-paste
3. **Drag-and-Drop Element Editing**: Individual elements (text blocks, images) can be moved/resized on-page
4. **Live Preview While Editing**: Changes appear in real-time on the actual page, not in a separate textarea
5. **100+ Professional Templates**: Rich template library with categories (Minimal, Bold, Elegant, etc.)

### Improvements We Can Apply

**A. Template Gallery for New Pages (instead of blank "full-text" default)**
When users click "Add Page", show the PageLayoutPicker dialog instead of silently adding a blank page. This mirrors Designrr's template-first UX.

**B. Inline WYSIWYG Editing on the Page (instead of contentEditable plain text)**
Currently, clicking text on a page makes it editable via `contentEditable` divs. Enhance this with:
- Visual formatting toolbar that appears above the selected text block
- Clear visual borders around the active text block
- Better placeholder text for empty fields

**C. Image Slot Improvements**
When an image slot is empty, show a prominent placeholder with clear action buttons (Generate / Upload / Browse Gallery) -- similar to Designrr's image placeholder cards.

**D. Template Style Themes**
Add a "Theme" selector that applies coordinated color schemes, fonts, and background styles across all pages at once -- similar to Designrr's template categories.

---

## Technical Details

### ContentEditor.tsx Fixes

```typescript
// Fix 1: GenerateSectionImageDialog props
<GenerateSectionImageDialog
  section={section}
  brand={currentBrand}
  onImageGenerated={() => loadSectionImages()}
  onInsertImage={(url) => handleImageInsertRouted(url)}
/>

// Fix 2: EXPANSION_MODES -- change .value to .mode
{EXPANSION_MODES.map((m) => (
  <Button key={m.mode} variant={activeMode === m.mode ? "default" : "outline"} ...>
    {m.label}
    {getContentByMode(m.mode).length > 0 && ...}
  </Button>
))}

// Fix 3: ContentToolbar -- pass all required props
<ContentToolbar
  onFormat={handleFormat}
  onInsertImage={() => { /* trigger generate dialog */ }}
  onUploadImage={() => fileInputRef.current?.click()}
  onGalleryImage={() => setShowGallery(true)}
  onAIEdit={() => setShowAIEdit(true)}
  hasSelection={selectedText.length > 0}
/>

// Fix 4: AIEditToolbar -- use correct prop names
<AIEditToolbar
  selectedText={selectedText}
  fullContent={editContent}
  brandContext={{
    name: currentBrand?.name,
    tone: currentBrand?.tone,
    writing_style: currentBrand?.writing_style,
    about: currentBrand?.about,
    target_audience: currentBrand?.target_audience,
  }}
  onApplyEdit={handleApplyAIEdit}
  onClose={() => setShowAIEdit(false)}
/>

// Fix 5: EbookPageDesigner -- use actual interface props
<EbookPageDesigner
  content={currentModeContents[0].content}
  contentId={currentModeContents[0].id}
  sectionTitle={section.title}
  pageSize={pdfStyleConfig.pageSize as PageSizeKey}
  pdfStyle={pdfStyleConfig}
  brand={currentBrand}
  section={section}
  isFullscreen={isDesignerFullscreen}
  onToggleFullscreen={() => setIsDesignerFullscreen(!isDesignerFullscreen)}
  onPagesChange={setDesignedPages}
  onRegisterInsertImage={(fn) => { designerInsertImageRef.current = fn; }}
/>
```

### EbookPageDesigner.tsx -- Template-First Add Page

Change `addPage()` to open the layout picker instead of silently adding a blank page:

```typescript
const addPage = (layout: LayoutType = "full-text") => {
  const newPage: EbookPageData = {
    id: crypto.randomUUID(),
    layout,
    content: { heading: "New Page", body: "" },
    order: pages.length,
  };
  // ... insert after selected page
};
```

Show the layout picker when "Add Page" is clicked, then call `addPage(selectedLayout)`.

### EbookPageDesigner.tsx -- Better Image Placeholders

In ebookLayouts.tsx, update image slot rendering to show a styled placeholder card with action buttons when no image URL is set:

```tsx
{content.image ? (
  <img src={content.image} ... />
) : (
  <div className="flex flex-col items-center justify-center h-full bg-muted/30 border-2 border-dashed border-border rounded-lg gap-2 p-4">
    <ImagePlus className="w-8 h-8 text-muted-foreground/40" />
    <span className="text-xs text-muted-foreground">Click to add image</span>
    {editable && onImageAction && (
      <div className="flex gap-2">
        <button onClick={() => onImageAction("generate")}>Generate</button>
        <button onClick={() => onImageAction("upload")}>Upload</button>
      </div>
    )}
  </div>
)}
```

---

## Files to Modify

1. **`src/pages/ContentEditor.tsx`** -- Fix all 9 build errors (prop mismatches)
2. **`src/components/content/EbookPageDesigner.tsx`** -- Template-first add page, better image placeholders
3. **`src/components/content/ebookLayouts.tsx`** -- Enhanced image placeholder rendering with action buttons

