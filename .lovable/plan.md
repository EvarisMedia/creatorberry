

# Fix: auto-layout-ebook Edge Function Google API Error

## Problem

The "Build All Sections" process fails at the **Designing** phase because the `auto-layout-ebook` edge function sends a tool/function schema to Google's Gemini API that includes `additionalProperties` fields. Google's function calling API does not support this property and returns a 400 error.

## Root Cause

In the tool definition (`toolDef`), both the top-level `parameters` object and the nested `items` object contain `"additionalProperties": false`. When this schema is sent to the Google Generative AI API (for users with their own API key), it fails validation.

## Fix

**File: `supabase/functions/auto-layout-ebook/index.ts`**

Remove all `additionalProperties` fields from the tool definition schema. Specifically:

1. Remove `additionalProperties: false` from the `items` object inside `pages` (the per-page schema)
2. Remove `additionalProperties: false` from the top-level `parameters` object

This is a two-line removal. No other changes needed -- the Lovable gateway path (OpenAI-compatible) tolerates the field, but removing it there too keeps the schema consistent.

## Technical Detail

Current schema (simplified):
```typescript
parameters: {
  type: "object",
  properties: { pages: { type: "array", items: { ..., additionalProperties: false } } },
  required: ["pages"],
  additionalProperties: false,  // REMOVE
}
```

Fixed schema:
```typescript
parameters: {
  type: "object",
  properties: { pages: { type: "array", items: { ... } } },
  required: ["pages"],
}
```

Only the `supabase/functions/auto-layout-ebook/index.ts` file needs to be modified.
