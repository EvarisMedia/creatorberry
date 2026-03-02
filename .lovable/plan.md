

# Fix: Image Generation, Auto-Layout Timeout, and PDF Pipeline

## Root Causes Identified

### 1. Image generation 404 (user-key path)
The user's stored `preferred_image_model` in the database is `gemini-2.5-flash-image-preview`, which is NOT a valid Gemini model name. The edge function on line 310 does `const geminiModel = userImageModel || "gemini-2.0-flash-exp"` -- since `userImageModel` is set (to the invalid name), the fallback never triggers. The logs confirm: `models/gemini-2.5-flash-image-preview is not found for API version v1beta`.

### 2. Auto-layout-ebook connection timeout
The error `error reading a body from connection` means the AI API call is timing out. The expanded content for each section is thousands of words, and the edge function sends ALL of it to the AI. Additionally, `16x9` is missing from the `wordLimits` map in the edge function (line 53-60), so it falls back to `6x9` limits which may not match.

### 3. No PDF Preview
The preview code exists and looks correct, but it depends on the upstream pipeline (images + layouts) working. Since images fail and layouts may be incomplete, the preview shows a broken result.

## Fix Plan

### Fix 1: Validate user image model name (generate-image/index.ts)

Add a whitelist of known working Gemini image-generation models. If the user's stored `preferred_image_model` is not in the whitelist, fall back to `gemini-2.0-flash-exp`.

**File:** `supabase/functions/generate-image/index.ts` (around line 310)

```typescript
// Known working Gemini models that support image generation via generateContent
const VALID_IMAGE_MODELS = [
  "gemini-2.0-flash-exp",
  "gemini-2.0-flash-preview-image-generation",
  "imagen-3.0-generate-002",
];
const geminiModel = (userImageModel && VALID_IMAGE_MODELS.includes(userImageModel))
  ? userImageModel
  : "gemini-2.0-flash-exp";
```

### Fix 2: Truncate content sent to auto-layout AI (auto-layout-ebook/index.ts)

- Limit the content sent to the AI to ~4000 words max to prevent timeouts
- Add `"16x9"` to the `wordLimits` map (currently missing, causing fallback to 6x9)
- Add `"letter-landscape"` and `"a4-landscape"` too

**File:** `supabase/functions/auto-layout-ebook/index.ts`

```typescript
// Add to wordLimits:
"16x9": { fullText: 180, bodyWithImage: 100, opener: 70 },
"a4-landscape": { fullText: 220, bodyWithImage: 120, opener: 80 },
"letter-landscape": { fullText: 200, bodyWithImage: 110, opener: 75 },
```

Also truncate content before sending to AI:
```typescript
// Limit content to prevent timeout
const MAX_CONTENT_WORDS = 4000;
const contentWords = content.split(/\s+/);
const truncatedContent = contentWords.length > MAX_CONTENT_WORDS
  ? contentWords.slice(0, MAX_CONTENT_WORDS).join(" ")
  : content;
```

### Fix 3: Update default image model in user settings hook (useUserApiKeys.tsx)

Change the default `preferred_image_model` from the invalid `gemini-2.5-flash-image-preview` to a working model.

**File:** `src/hooks/useUserApiKeys.tsx` (line 14)

```typescript
preferred_image_model: "gemini-2.0-flash-exp",
```

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/generate-image/index.ts` | Validate userImageModel against whitelist of working models |
| `supabase/functions/auto-layout-ebook/index.ts` | Add missing page sizes to wordLimits; truncate long content |
| `src/hooks/useUserApiKeys.tsx` | Fix default image model name |

## Technical Sequence

1. Fix `generate-image/index.ts` -- model validation (fixes the 404/500 error)
2. Fix `auto-layout-ebook/index.ts` -- add 16x9 + content truncation (fixes timeout)
3. Fix `useUserApiKeys.tsx` -- update default (prevents future users from getting invalid defaults)

