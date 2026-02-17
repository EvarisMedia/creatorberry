

# Fix: Image Generation Edge Function - Missing Image Type Handlers

## Problem
The `GenerateSectionImageDialog` component offers 5 image types: `section_infographic`, `chapter_illustration`, `diagram`, `concept_map`, and `quote_card`. However, the `generate-image` edge function only has prompt templates for some of these. Specifically, `diagram` and `concept_map` have no matching case, so the prompt stays empty (`""`), causing the AI API to reject the request with "Input must have at least 1 token."

## Fix
Add prompt templates for `diagram` and `concept_map` image types in `supabase/functions/generate-image/index.ts`.

### File: `supabase/functions/generate-image/index.ts`

Add two new `else if` branches before the final `else if (custom_prompt)` fallback:

**`diagram` type**: Generate a clean process/concept diagram with labeled steps, flowchart elements, and brand colors. Uses section context (title, description, subsections) to inform the diagram structure.

**`concept_map` type**: Generate a visual concept map showing connections between ideas. Uses subsections as the key concepts to connect, with the section title as the central node.

Both templates will include the existing pattern of brand colors, style, aspect ratio, and section context.

## No other files need changes
## No database changes needed

