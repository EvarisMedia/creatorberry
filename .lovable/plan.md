

# Transform Content Editor into a Visual Rich Text Editor with Integrated AI and Image Tools

## Workflow Analysis -- What's Broken and Missing

### Current State (Problems)
1. **Editing is raw Markdown in a textarea** -- When you click "Edit", you see raw `![alt](url)` code, `**bold**`, `### headings` etc. This is unusable for non-technical creators.
2. **Image generation is disconnected** -- The "Generate Section Image" button sits alone in the header. There's no way to insert an image at a specific position within the content.
3. **No inline AI editing** -- You can only regenerate the entire section. Can't select a paragraph and say "rewrite this" or "make this simpler."
4. **No formatting toolbar** -- No quick buttons for bold, italic, headings, lists, etc.
5. **No section navigation** -- To edit a different section, you have to go back to the Outlines page and click "Expand" on another section. There's no sidebar or navigation within the editor.
6. **PDF styling panel is disconnected** -- It sits below the content with no visual preview of how settings affect the output.
7. **No image upload option** -- Only AI generation. Can't upload your own images.
8. **Insert Image always appends to the end** -- No cursor-position insertion.

---

## Plan

### 1. Visual Rich Text Editing (Replace Textarea with WYSIWYG)
**File:** `src/pages/ContentEditor.tsx`

Replace the raw `<Textarea>` edit mode with a visual editing experience:
- When user clicks "Edit", show the content in a `contentEditable` div that preserves the visual rendering (headings render as headings, images as images, bold as bold)
- Add a **floating formatting toolbar** that appears on text selection with: Bold, Italic, Heading (H1/H2/H3), Bullet List, Numbered List, Quote, Code
- Clicking a format button wraps the selected text with the appropriate markdown and re-renders
- Images remain visually rendered during editing -- clicking an image shows resize/delete/reposition controls
- Save converts the visual state back to markdown for storage

**New component:** `src/components/content/ContentToolbar.tsx`
- Sticky toolbar above the editor with formatting buttons
- "Insert Image" dropdown with two options: "Upload Image" and "Generate with AI"
- "AI Edit" button that opens AI editing options

### 2. Inline AI Editing Tools
**File:** `src/components/content/AIEditToolbar.tsx` (New)

When user selects text in the editor, show an AI floating menu with:
- **Rewrite** -- Rephrase the selected text
- **Expand** -- Make the selection longer with more detail
- **Simplify** -- Make it simpler and clearer
- **Change Tone** -- Dropdown: Professional, Casual, Academic, Storytelling
- **Custom Instruction** -- Free-text input for any AI edit request

**File:** `supabase/functions/ai-edit-content/index.ts` (New edge function)
- Accepts: `selectedText`, `instruction` (rewrite/expand/simplify/custom), `context` (surrounding content), `brandContext`
- Returns: edited text replacement
- Uses the Lovable AI gateway

### 3. Integrated Image Insertion at Cursor Position
**File:** `src/pages/ContentEditor.tsx`

Replace the disconnected header button with inline image tools:
- **Toolbar "Insert Image" button** with dropdown:
  - "Generate with AI" -- Opens the existing GenerateSectionImageDialog but inserts at cursor position instead of appending
  - "From Gallery" -- Shows existing section images in a popover for quick re-insertion
- Track cursor/caret position in the editor so images insert where the user's cursor is, not at the end
- After insertion, the image immediately renders visually in the editor

### 4. Section Navigation Sidebar
**File:** `src/pages/ContentEditor.tsx`

Add a section navigation panel (right sidebar or tabs) so creators can:
- See all sections of the current outline in a mini-list
- Click any section to switch to it without leaving the editor
- See which sections have content generated (checkmark) vs. empty
- "Generate All" button to batch-expand all remaining sections

### 5. Live PDF Preview Integration
**File:** `src/components/content/PDFStyleSettings.tsx`
**File:** `src/pages/ContentEditor.tsx`

Move PDF styling from a collapsed panel to a "Preview" tab:
- Add a **Tabs** component: "Edit" | "Preview"
- "Edit" tab shows the visual editor
- "Preview" tab shows a simulated page layout with the current PDF style settings applied (font, colors, layout, headers/footers)
- Changes to PDF settings instantly update the preview

### 6. Image Upload Support
**File:** `src/pages/ContentEditor.tsx`

Allow uploading custom images (not just AI-generated):
- Upload button in the toolbar triggers a file picker
- Image is uploaded to storage and the URL is inserted into content at cursor position
- Supports drag-and-drop onto the editor area

---

## Technical Details

### Content Toolbar Component
```
ContentToolbar
  [B] [I] [H1] [H2] [H3] [UL] [OL] [Quote] [---]  |  [Insert Image v] [AI Edit v]
                                                         - Generate AI
                                                         - Upload
                                                         - From Gallery
```

### AI Edit Edge Function
- Endpoint: `ai-edit-content`
- Method: POST
- Body: `{ selectedText, instruction, fullContent, brandContext }`
- Response: `{ editedText }`
- Uses Lovable AI gateway (no user API key needed)

### Cursor Position Tracking
- Use `window.getSelection()` in the contentEditable div to track caret position
- When inserting an image, calculate the markdown offset from the visual position
- Insert `![alt](url)` at the correct position in the markdown string
- Re-render the content

### Section Navigation Data
- Fetch all sections for the current outline (already available via `fetchOutlineWithSections`)
- For each section, check if `expanded_content` exists via a lightweight query
- Display as a mini sidebar list with status indicators

### Files to Create
- `src/components/content/ContentToolbar.tsx` -- Formatting toolbar
- `src/components/content/AIEditToolbar.tsx` -- AI editing floating menu
- `supabase/functions/ai-edit-content/index.ts` -- AI text editing endpoint

### Files to Modify
- `src/pages/ContentEditor.tsx` -- Major refactor: visual editor, section nav, preview tab, image upload, cursor tracking
- `src/components/content/RichContentRenderer.tsx` -- Make it editable (contentEditable mode)
- `src/components/content/PDFStyleSettings.tsx` -- Integrate into preview tab
- `src/components/content/GenerateSectionImageDialog.tsx` -- Accept cursor position for targeted insertion

### Approach
Since adding a full rich text library (Tiptap, Slate, etc.) is a large dependency, we'll use a pragmatic approach:
- Use `contentEditable` on the rendered HTML output from `RichContentRenderer`
- Intercept formatting commands via `document.execCommand` for basic formatting
- On save, serialize the HTML back to markdown
- This gives a visual editing feel without a heavy library dependency

### Section Navigation Shape
```
+------------------+----------------------------+
| Section Nav      | Content Editor             |
|                  |                            |
| [x] Ch 1: Intro | [Toolbar: B I H1 H2 ...]  |
| [x] Ch 2: Setup | [Visual content here...]   |
| [ ] Ch 3: Core  |                            |
| [ ] Ch 4: Tips   |                            |
|                  | [Preview tab shows PDF]    |
| [Generate All]  |                            |
+------------------+----------------------------+
```

## Summary of Changes
| Change | Impact |
|--------|--------|
| Visual WYSIWYG editing | Replaces raw textarea with rendered editable content |
| Formatting toolbar | Bold, italic, headings, lists with one click |
| Inline AI editing | Select text and rewrite/expand/simplify |
| Cursor-position image insertion | Images go where you want, not at the end |
| Image upload | Upload your own images, not just AI |
| Section navigation | Switch sections without leaving editor |
| PDF preview tab | See how your export will look while editing |
| New edge function | AI-powered text editing |

