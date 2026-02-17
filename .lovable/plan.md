# Plan: PDF Download, Image Display, Image Generation UX, and Studio Parity

## Status: ✅ COMPLETED

### Changes Made

1. **✅ PDF Direct Download** — Created `src/lib/generatePDF.ts` using jsPDF for client-side binary PDF generation. Updated `useProductExports.tsx` to generate real PDF files instead of opening print dialogs. Supports both page-layout-based and markdown-fallback PDF generation.

2. **✅ Image URL Fix in Exports** — Fixed `export-product` edge function to stop using `escapeXml()` on image URLs in `src` attributes, which was breaking URLs with `&` query parameters.

3. **✅ Custom Prompt in Section Image Dialog** — Added always-visible "Custom Instructions" textarea in `GenerateSectionImageDialog.tsx` for non-custom-concept types, improving discoverability.

4. **✅ Image Studio Feature Parity** — Updated `GenerateStudioImageDialog.tsx` with: aspect ratio selector, style badges (replacing dropdown), custom concept type, custom prompt textarea, additional context field.

5. **✅ useGeneratedImages Updated** — Added `aspect_ratio`, `custom_prompt`, `custom_context` params to `GenerateImageParams` interface and passed them to the generate-image edge function.
