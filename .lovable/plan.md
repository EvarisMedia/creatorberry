

# Add Document Upload for Product Idea Generation

## Overview
Add file upload (PDF, DOCX, TXT) capability to both the **Generate Ideas** and **Add Manually** dialogs. Uploaded documents will be parsed and their text content sent to the AI as context for generating product ideas, or used to auto-fill the manual idea form.

## Approach

### 1. Generate Ideas Dialog — Add document upload
**File:** `src/components/product-ideas/GenerateIdeasDialog.tsx`

- Add a file input area (drag-and-drop or click) below the seed prompt field
- Accept PDF, DOCX, TXT files
- Read file content client-side: for TXT use `FileReader.readAsText()`, for PDF/DOCX read as base64 and send to edge function for extraction
- Pass the extracted text as a `documentContext` parameter alongside `seedPrompt`
- Show selected file name with a remove button

### 2. Add Manually Dialog — Add document upload  
**File:** `src/components/product-ideas/AddIdeaDialog.tsx`

- Add a file upload area that says "Upload a document to auto-fill"
- When a file is uploaded, send it to the edge function which uses AI to extract a title, description, format, and target audience from the document
- Auto-populate the form fields with AI-extracted data, allowing the user to edit before saving

### 3. Update edge function to accept document context
**File:** `supabase/functions/generate-product-ideas/index.ts`

- Accept a new optional `documentContext` field in the request body
- Append document text (truncated to ~8000 words to avoid token limits) to the user prompt as `UPLOADED DOCUMENT CONTENT`
- The AI will use this as primary context for generating ideas

### 4. New edge function for document parsing
**File:** `supabase/functions/parse-document-for-ideas/index.ts`

- Accept a base64-encoded file + file type
- For TXT: decode directly
- For PDF: use a lightweight text extraction approach (split on common markers)
- For DOCX: extract text from the XML content
- Return extracted text
- Also support a `mode: "extract-idea"` parameter that uses AI to return structured idea fields (title, description, format, target_audience) from the document

### 5. Update hook to pass document context
**File:** `src/hooks/useProductIdeas.tsx`

- Update `generateIdeas()` signature to accept optional `documentContext: string`
- Pass it through to the edge function call

## Files to Modify

| File | Change |
|------|--------|
| `src/components/product-ideas/GenerateIdeasDialog.tsx` | Add file upload UI, read file, pass content |
| `src/components/product-ideas/AddIdeaDialog.tsx` | Add file upload UI, call AI to extract idea fields |
| `src/hooks/useProductIdeas.tsx` | Add `documentContext` param to `generateIdeas()` |
| `supabase/functions/generate-product-ideas/index.ts` | Accept and use `documentContext` in prompt |
| `supabase/functions/parse-document-for-ideas/index.ts` | New edge function for document text extraction and idea extraction |
| `supabase/config.toml` | Register new edge function |

## Technical Sequence
1. Create `parse-document-for-ideas` edge function
2. Update `generate-product-ideas` edge function to accept document context
3. Update `useProductIdeas` hook
4. Update `GenerateIdeasDialog` with file upload + document context flow
5. Update `AddIdeaDialog` with file upload + AI auto-fill flow

