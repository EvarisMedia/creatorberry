
# Insert Section Images into Content and Include in Exports

## Overview
Three issues to fix: (1) generated images should be inserted into the expanded content so they appear inline, (2) the download workflow needs to use fetch+blob instead of broken cross-origin `<a download>`, and (3) the export function must include section images in the exported ebook.

## Changes

### 1. Insert Image into Expanded Content After Generation
**File:** `src/components/content/GenerateSectionImageDialog.tsx`

After a section image is successfully generated:
- Find the latest expanded content for this section from the database
- Insert a Markdown image tag (`![Section Image](url)`) at the end of the content (or at cursor position)
- Update the `expanded_content` record with the image embedded
- If no expanded content exists yet, show a toast telling the user to generate content first, then the image will be added to the gallery for manual insertion later

**File:** `src/pages/ContentEditor.tsx`
- Add an "Insert into Content" button on each image in the Section Images gallery
- Clicking it appends `![image alt](image_url)` to the latest expanded content for the active mode
- Refresh content display after insertion

### 2. Fix Download Workflow
**File:** `src/components/content/GenerateSectionImageDialog.tsx`
**File:** `src/pages/ContentEditor.tsx`

Replace the broken cross-origin `<a href download>` pattern with a proper fetch-and-save approach:
```
async function handleDownload(url, filename) {
  const response = await fetch(url);
  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(blobUrl);
}
```

### 3. Include Section Images in Export
**File:** `supabase/functions/export-product/index.ts`

Update `fetchOutlineWithContent` to also fetch images:
- Query `generated_images` where `section_id` is in the list of section IDs
- Group images by `section_id`

Update `generateMarkdown` to embed images:
- After inserting the section's text content, append any associated images as Markdown image references: `![Chapter illustration](image_url)`
- For HTML export, the AI conversion will naturally render these as `<img>` tags

### 4. Auto-Insert on Generation
**File:** `src/components/content/GenerateSectionImageDialog.tsx`

After successful image generation:
- Call a new prop `onInsertImage(imageUrl: string)` passed from ContentEditor
- ContentEditor implements this by appending the image markdown to the latest content version of the active mode

**File:** `src/pages/ContentEditor.tsx`
- Add `handleInsertImage(imageUrl: string)` function that:
  1. Gets the latest content for the active mode
  2. Appends `\n\n![Section Image](imageUrl)\n` to the content
  3. Calls `updateContent` to save
  4. Refreshes the content display
- Pass this as `onInsertImage` prop to `GenerateSectionImageDialog`
- Add an "Insert" button on each gallery image that calls the same function

## Technical Details

### Content Editor changes (ContentEditor.tsx)
- New function: `handleInsertImage(imageUrl: string, altText?: string)`
- New prop on GenerateSectionImageDialog: `onInsertImage`
- New "Insert into Content" button on gallery images (only shown when content exists for active mode)

### Export function changes (export-product/index.ts)
- New query in `fetchOutlineWithContent`: fetch from `generated_images` where `section_id IN (sectionIds)`
- New parameter `imagesMap` in `generateMarkdown` — maps section_id to array of image URLs
- Images appended after section text content as `![image](url)`

### Download fix
- Utility function `downloadImageBlob(url, filename)` used in both the dialog and gallery
- Replaces all `<a href download>` patterns

## User Flow After Changes
1. User expands a section (generates content)
2. User clicks "Generate Section Image" and creates an image
3. The image is automatically inserted at the end of the expanded content as a Markdown image
4. User can also manually insert gallery images via "Insert" button
5. When exporting the ebook, all section images are included inline in the output
