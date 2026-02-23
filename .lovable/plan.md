

# Unified Plan: BYOK Fix + Fabric.js Designer + One-Click Ebook Pipeline

This plan combines three major initiatives into a phased implementation roadmap.

---

## Phase 1: BYOK API Key Enforcement (All Edge Functions + Frontend Gate)

### Problem
4 edge functions (`auto-layout-ebook`, `export-product`, `generate-pin-image`, `generate-embedding`) only use the system `LOVABLE_API_KEY` and ignore the user's own Gemini API key. No frontend gate prevents users from triggering AI features without a configured key.

### 1A. Frontend API Key Gate

**New file: `src/hooks/useRequireApiKey.tsx`**
- Wraps `useUserApiKeys` to expose a `requireKey()` function
- If no API key is configured, shows a toast ("Please add your Gemini API key in Settings") and navigates to `/settings`
- Returns `false` to abort the calling action

**New file: `src/components/ApiKeyGate.tsx`**
- A banner component that renders at the top of the app when `isConfigured` is false
- Shows: "Configure your Gemini API key to use AI features" with a Settings link

**Modified: `src/components/layout/AppLayout.tsx`**
- Import and render `ApiKeyGate` between the header and `{children}`

**Modified AI-triggering components** (add `useRequireApiKey` guard before AI calls):
- `GenerateOutlineDialog.tsx` -- guard `handleGenerate`
- `BuildAllSectionsDialog.tsx` -- guard `startBuild`
- `GeneratePostsDialog.tsx`
- `GenerateIdeasDialog.tsx`
- `GenerateImageDialog.tsx`
- `GenerateStudioImageDialog.tsx`
- `GeneratePinImageDialog.tsx`
- `GeneratePinsDialog.tsx`
- `GenerateSectionImageDialog.tsx`
- `CopilotChat.tsx`
- `AIEditToolbar.tsx`
- `useProductExports.tsx` (for export triggers)

Each gets a simple guard:
```
const { requireKey } = useRequireApiKey();
// In the handler:
if (!requireKey()) return;
```

### 1B. Edge Function BYOK Pattern

Apply the same BYOK pattern already used in `expand-content` and `generate-outline` to the 4 remaining functions.

**Pattern (same for all 4):**
1. Extract `Authorization` header
2. Create user-scoped client, authenticate user
3. Query `user_api_keys` table for `gemini_api_key` and `preferred_text_model` / `preferred_image_model`
4. If user key exists: call Google's `generativelanguage.googleapis.com` API directly
5. Fall back to `LOVABLE_API_KEY` + Lovable gateway only if no user key
6. Parse response from whichever endpoint was used

**`supabase/functions/auto-layout-ebook/index.ts`**
- Add auth extraction and user key lookup
- For user's key with tool calling: Google's API uses `functionDeclarations` format inside `tools` array (different from OpenAI's `tools` format). Convert the existing tool definition to Google's format when using direct API
- Fall back to existing Lovable gateway path

**`supabase/functions/export-product/index.ts`**
- Already has auth. Add user key lookup after line ~616
- Pass user key into `generateFormattedExport()` as a parameter
- In the HTML generation AI call (~line 488), use user's key with Google endpoint when available

**`supabase/functions/generate-pin-image/index.ts`**
- Add auth header extraction (currently has none)
- Fetch user's API key and `preferred_image_model`
- When using user's key: call Google's image generation endpoint directly with the user's preferred image model
- Fall back to Lovable gateway

**`supabase/functions/generate-embedding/index.ts`**
- Add auth header extraction
- Fetch user's API key
- Modify `generateEmbedding()` to accept an optional API key parameter
- When user key exists: call Google's API directly
- Fall back to Lovable gateway

### No Database Changes Required
The `user_api_keys` table already exists with `gemini_api_key`, `preferred_text_model`, and `preferred_image_model` columns.

---

## Phase 2: Fabric.js Canvas-Based Ebook Designer

### Problem
The current designer uses React DOM elements (`contentEditable` divs, CSS flexbox) rendered via `EbookPage.tsx` and `FreeformPageRenderer.tsx`. This causes:
- Export fidelity issues (what you see in the browser does not match the PDF)
- Limited drag-and-drop (custom React state management vs native canvas)
- No rotation, skewing, or advanced object manipulation

### Architecture

Replace the DOM-based page renderer with a Fabric.js canvas that becomes the single source of truth for each page.

```text
+---------------------------+
|   EbookPageDesigner.tsx    |  (orchestrator - mostly unchanged)
+---------------------------+
          |
          v
+---------------------------+
|  FabricPageCanvas.tsx      |  NEW - wraps fabric.Canvas per page
+---------------------------+
          |
    +-----------+-----------+
    |           |           |
  Text       Image       Shape
  objects    objects     objects
    |           |           |
    v           v           v
  canvas.toJSON()  -->  saved to page_layouts
  canvas.toDataURL() --> used for PDF export & thumbnails
```

### What Changes

**New file: `src/components/content/FabricPageCanvas.tsx`**
- Core wrapper component around `fabric.Canvas`
- Accepts `EbookPageData` and renders it as Fabric objects (text, images, shapes)
- Exposes methods: `toJSON()`, `toDataURL()`, `loadFromJSON()`
- Handles: object selection, drag, resize, rotation, text editing
- Applies theme backgrounds as Fabric objects (rects, circles, paths) behind content
- Emits `onChange` callback that triggers debounced save

**New file: `src/lib/fabricPageSerializer.ts`**
- `pageDataToFabricJSON(page: EbookPageData)` -- converts existing page data to Fabric canvas JSON
- `fabricJSONToPageData(json)` -- converts Fabric canvas state back to `EbookPageData` for backward compatibility
- Handles migration: existing pages without Fabric data get converted on first load

**Modified: `src/components/content/EbookPageDesigner.tsx`**
- Replace `<EbookPage>` in main view with `<FabricPageCanvas>` when in edit mode
- Keep `<EbookPage>` for thumbnail rendering (lightweight, read-only)
- Remove the `freeformMode` toggle (Fabric is always freeform)
- Update save flow: `canvas.toJSON()` saved to `page_layouts` alongside existing content data

**Modified: `src/components/content/EbookPage.tsx`**
- Keep as a lightweight read-only renderer for thumbnails
- Optionally add a "rendered image" mode that shows `canvas.toDataURL()` output

**Modified: `src/lib/generatePDF.ts`**
- For each page, render a pre-generated PNG from `canvas.toDataURL()` into the PDF using `doc.addImage()`
- This ensures pixel-perfect export fidelity (canvas = source of truth)
- Fall back to the existing jsPDF drawing for pages without canvas data

**Modified: `src/hooks/useProductExports.tsx`**
- Before exporting, trigger canvas rendering for each page to get PNG data URLs
- Pass these data URLs to the PDF generator

**Modified: `src/components/content/ebookLayouts.tsx`**
- Add optional `fabricJSON` field to `EbookPageData` type for storing canvas state
- Keep existing content fields for backward compatibility

### Fabric.js Toolbar
- Object properties panel: font size, color, alignment, opacity
- Layer controls: bring forward, send back
- Add elements: text box, image, shape (rect, circle, line)
- Snap-to-grid and alignment guides

### Migration Path
- Existing pages load normally via `EbookPage.tsx` (thumbnails)
- On first edit, `pageDataToFabricJSON()` converts to Fabric objects
- Once edited in Fabric, the `fabricJSON` field is populated and takes precedence
- Old `content` fields remain populated for backward compatibility with markdown exports

### Package Addition
- `fabric` (v6.x) -- the Fabric.js library

---

## Phase 3: One-Click Ebook Generation Pipeline

### Problem
Currently, building an ebook requires manually triggering expansion and design for each section. The existing `BuildAllSectionsDialog` does sequential expand + design but lacks context accumulation between chapters.

### Architecture

```text
  [Start Build]
       |
       v
  +------------------+
  | For each section: |
  |  1. Expand with   |
  |     full context   |  <-- TOC + prior chapter summaries
  |  2. Auto-layout    |
  |  3. Store summary  |  <-- for next chapter's context
  +------------------+
       |
       v
  [Build Complete]
  -> Open Content Editor
```

### What Changes

**New file: `src/hooks/useBookBuilder.tsx`**
- Pipeline orchestrator hook
- Manages sequential expansion with context accumulation
- For each section: expand -> collect summary -> design pages
- Tracks state: `{ phase, currentSection, completedSections, errors }`
- Passes accumulated chapter summaries to each `expand-content` call
- Supports cancel/resume

**Modified: `supabase/functions/expand-content/index.ts`**
- Accept new optional parameters:
  - `tableOfContents`: full outline structure (section titles + descriptions)
  - `previousChapters`: array of `{ title, summary }` from prior sections
- Incorporate into the prompt so Gemini maintains narrative coherence:
  ```
  ## Book Structure (Table of Contents)
  ${tableOfContents}

  ## Previously Written Chapters (summaries)
  ${previousChapters.map(c => `- ${c.title}: ${c.summary}`).join('\n')}

  Write this chapter with awareness of what came before.
  Do not repeat concepts already covered. Reference prior chapters naturally.
  ```
- After generating content, extract a ~100-word summary at the end (ask AI to append `[CHAPTER_SUMMARY]: ...`) for feeding into the next chapter
- Parse and strip the summary before saving, store it separately in the response

**Modified: `supabase/functions/auto-layout-ebook/index.ts`**
- Accept `content` directly (text) instead of requiring a re-fetch
- When structured content (typed paragraphs) is available, use deterministic layout mapping instead of AI:
  - Intro paragraphs -> `chapter-opener`
  - Body text -> `full-text` (split at ~200 words)
  - Lists -> `key-takeaways` or `checklist`
  - Quotes -> `quote`
- Fall back to AI layout assignment for unstructured markdown

**Modified: `src/components/outlines/BuildAllSectionsDialog.tsx`**
- Use `useBookBuilder` hook instead of inline logic
- Add a "Context-aware" toggle (on by default) that enables chapter-to-chapter context passing
- Show richer progress: "Writing Chapter 3 of 8 (with context from chapters 1-2)"
- Add estimated time remaining based on average per-section time
- After completion, offer "Export PDF" button in addition to "Open Content Editor"

**Modified: `supabase/functions/generate-outline/index.ts`**
- Switch to tool calling (like `auto-layout-ebook` already does) for more reliable structured output
- Add richer metadata per section: `estimated_reading_time`, `key_topics`, `difficulty_level`

### No Database Changes Required
- Chapter summaries are passed in-memory during the pipeline, not stored in the database
- The existing `expanded_content.content` and `page_layouts` columns handle all data

---

## Implementation Order

| Step | What | Files |
|------|------|-------|
| 1 | BYOK frontend gate | `useRequireApiKey.tsx`, `ApiKeyGate.tsx`, `AppLayout.tsx` |
| 2 | BYOK guards in dialogs | ~12 dialog/component files |
| 3 | BYOK in `auto-layout-ebook` | Edge function |
| 4 | BYOK in `generate-pin-image` | Edge function |
| 5 | BYOK in `generate-embedding` | Edge function |
| 6 | BYOK in `export-product` | Edge function |
| 7 | Context-aware `expand-content` | Edge function |
| 8 | `useBookBuilder` hook | New hook |
| 9 | Upgraded `BuildAllSectionsDialog` | Component |
| 10 | Tool calling in `generate-outline` | Edge function |
| 11 | Install Fabric.js + `FabricPageCanvas` | New component |
| 12 | `fabricPageSerializer` | New utility |
| 13 | Integrate Fabric into `EbookPageDesigner` | Component |
| 14 | Canvas-to-PDF export | `generatePDF.ts`, `useProductExports.tsx` |

### Files Summary

**New Files (5):**
1. `src/hooks/useRequireApiKey.tsx`
2. `src/components/ApiKeyGate.tsx`
3. `src/hooks/useBookBuilder.tsx`
4. `src/components/content/FabricPageCanvas.tsx`
5. `src/lib/fabricPageSerializer.ts`

**Modified Edge Functions (5):**
1. `supabase/functions/auto-layout-ebook/index.ts`
2. `supabase/functions/export-product/index.ts`
3. `supabase/functions/generate-pin-image/index.ts`
4. `supabase/functions/generate-embedding/index.ts`
5. `supabase/functions/expand-content/index.ts`

**Modified Frontend Files (15+):**
1. `src/components/layout/AppLayout.tsx`
2. `src/components/outlines/BuildAllSectionsDialog.tsx`
3. `src/components/content/EbookPageDesigner.tsx`
4. `src/components/content/EbookPage.tsx`
5. `src/components/content/ebookLayouts.tsx`
6. `src/lib/generatePDF.ts`
7. `src/hooks/useProductExports.tsx`
8. `supabase/functions/generate-outline/index.ts`
9. ~10 AI-triggering dialog components (BYOK guard)

**New Package:**
- `fabric` (v6.x)

**No Database Changes Required**

