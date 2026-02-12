

# Add "Generate Section Image" to Content Editor

## Overview
Add a "Generate Section Image" button inside the Content Editor that creates explainer/infographic-style images contextually tied to each outline section. The section's title, description, and content are used as AI context for the image prompt.

## Changes

### 1. Database Migration: Add `section_id` column to `generated_images`
- Add an optional `section_id` column (UUID, nullable) referencing `outline_sections(id)` with ON DELETE SET NULL
- This links generated images to specific outline sections

### 2. New Component: `GenerateSectionImageDialog`
**File:** `src/components/content/GenerateSectionImageDialog.tsx`

A dialog triggered from the Content Editor that:
- Accepts the current section (title, description, subsections) and brand as props
- Offers two image types: **Explainer/Infographic** and **Chapter Illustration**
- Offers style selection (Modern, Minimal, Bold, Elegant, Tech, Creative)
- Optionally lets the user provide additional context or a focus keyword
- Calls the existing `generate-image` edge function with `image_type: "chapter_illustration"` (already supported in the backend)
- Saves the generated image to `generated_images` with the `section_id` set
- Shows a preview of the generated image with download option

### 3. Update `generate-image` Edge Function
**File:** `supabase/functions/generate-image/index.ts`

- Add a new `image_type: "section_infographic"` prompt template that creates explainer-style visuals based on section context:
  - Takes section title, description, subsections as input
  - Generates a conceptual infographic/explainer image
- Accept an optional `section_context` field in the request body to enrich the prompt

### 4. Update `useGeneratedImages` Hook
**File:** `src/hooks/useGeneratedImages.tsx`

- Add `section_id` to the `GenerateImageParams` interface
- Pass `section_id` when saving to the database
- Add a `getImagesForSection(sectionId)` helper method to fetch images linked to a section

### 5. Update Content Editor Page
**File:** `src/pages/ContentEditor.tsx`

- Import and render `GenerateSectionImageDialog` in the header area (next to the section info card)
- Below the generated content cards, add a "Section Images" area that displays any images generated for this section
- Each image shows a thumbnail with options to view full size, download, or delete
- Images are fetched using `useGeneratedImages` filtered by `section_id`

## User Flow
1. User navigates to Content Editor for a section (via "Expand" on an outline)
2. They see a "Generate Section Image" button in the header
3. Clicking opens a dialog pre-filled with section context
4. User selects image type (Infographic or Chapter Illustration) and style
5. AI generates a contextual image using the section's topic
6. Image appears in the dialog preview and is saved to the section
7. All section images appear in a gallery below the expanded content

## Technical Notes
- Reuses the existing `generate-image` edge function -- just adds a new prompt template
- The `generated-images` storage bucket already exists and is public
- No new edge functions needed
- The `chapter_illustration` image type already exists in the backend; we add `section_infographic` for the new explainer style

