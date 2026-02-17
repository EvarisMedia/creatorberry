

# Fix: Image Dialog Scrollability, Aspect Ratio, Custom Prompts, and PDF Export

## Issues Identified

### 1. Image Generation Dialog Not Scrollable
The `GenerateSectionImageDialog` uses `DialogContent` with `max-w-lg` but no scroll container. When the generated image preview appears at the bottom, the dialog overflows the viewport and users cannot scroll to see the generate button or the image.

### 2. Aspect Ratio Not Applied
The `aspect_ratio` value is sent to the edge function and included in the prompt text, but image generation models (Gemini) do not reliably follow aspect ratio instructions from prompt text alone. The aspect ratio is only a suggestion in the prompt, not enforced via API parameters.

### 3. No Custom Prompt Option
Users can only generate images based on predefined types (infographic, illustration, diagram, etc.). There is no way to enter a completely custom concept or idea for the image.

### 4. PDF Export Fails with "Failed to generate HTML"
The PDF export path (lines 328-368 in `export-product/index.ts`) sends the full markdown (which includes massive base64 image data URLs) to the AI model to convert to HTML. The base64 images in the content make the payload enormous, causing the AI API call to fail. The error message "Failed to generate HTML" is thrown at line 360.

### 5. Page Design in Exports
Currently, the export function generates content from raw markdown stored in `expanded_content`. It does not use the page layouts from the Designer tab. The page layouts (stored as `page_layouts` JSONB) are a separate visual representation. The current export will reflect the written content but NOT the visual page designs.

---

## Fixes

### Fix 1: Make Dialog Scrollable
**File: `src/components/content/GenerateSectionImageDialog.tsx`**
- Wrap the dialog body content in a `ScrollArea` component with `max-h-[70vh]` so the content scrolls when the dialog is too tall (especially after an image is generated).

### Fix 2: Custom Prompt Image Type
**File: `src/components/content/GenerateSectionImageDialog.tsx`**
- Add a new image type `custom_concept` with label "Custom Concept" and description "Generate from your own idea or prompt"
- When this type is selected, show a `Textarea` field for the user to enter their custom prompt/concept
- Pass the custom prompt to the edge function

**File: `supabase/functions/generate-image/index.ts`**
- Add a `custom_concept` handler that builds a prompt combining the user's custom prompt with brand colors and style settings

### Fix 3: Fix PDF Export
**File: `supabase/functions/export-product/index.ts`**
- Before sending markdown to the AI for HTML conversion, strip out base64 image data URLs and replace them with placeholder references
- After getting the HTML back, restore the image references
- This prevents the massive payload from breaking the AI API call
- Add better error handling with response content-type checking

### Fix 4: Aspect Ratio Note
The aspect ratio limitation is inherent to how AI image generation works -- text prompts cannot enforce exact pixel ratios. The current implementation already includes the ratio in the prompt, which is the best approach available. No code change needed, but we should note this is a best-effort setting in the UI.

---

## Technical Details

### Scrollable Dialog
```tsx
<DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
```

### Custom Concept Image Type
Add to `IMAGE_TYPES` array:
```typescript
{ value: "custom_concept", label: "Custom Concept", description: "Generate from your own idea or prompt" }
```

Add a `Textarea` that appears when `imageType === "custom_concept"`, and send its value as `custom_prompt` to the edge function.

In the edge function, add before the existing `custom_prompt` fallback:
```typescript
else if (image_type === "custom_concept") {
  prompt = `Create a professional image based on the following concept:
  "${custom_context || custom_prompt}"
  Brand colors: ${brand.primary_color}, ${brand.secondary_color}
  Style: ${style}
  ${aspect_ratio ? `Aspect ratio: ${aspect_ratio}` : ''}`;
}
```

### PDF Export Fix
Strip base64 images before AI conversion:
```typescript
// Before sending to AI
const imageRefs: Record<string, string> = {};
let cleanMarkdown = markdown.replace(
  /!\[([^\]]*)\]\(data:image\/[^)]+\)/g,
  (match, alt, offset) => {
    const key = `__IMG_${Object.keys(imageRefs).length}__`;
    imageRefs[key] = match;
    return `![${alt}](${key})`;
  }
);

// Send cleanMarkdown to AI...
// After getting HTML back, restore images
let html = data.choices?.[0]?.message?.content || "";
for (const [key, original] of Object.entries(imageRefs)) {
  const srcMatch = original.match(/\(([^)]+)\)/);
  if (srcMatch) html = html.replaceAll(key, srcMatch[1]);
}
```

### Files to Modify
1. `src/components/content/GenerateSectionImageDialog.tsx` -- scrollable dialog, custom concept type
2. `supabase/functions/generate-image/index.ts` -- custom_concept handler
3. `supabase/functions/export-product/index.ts` -- strip base64 before AI call, restore after

### Regarding Page Design in Exports
The page layouts from the Designer tab are stored separately as JSONB and are not currently used in exports. Integrating them would be a larger feature (rendering each designed page to HTML/PDF). This can be addressed as a follow-up task.

