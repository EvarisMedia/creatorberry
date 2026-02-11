

# Add New Gemini Models to Settings

## Problem
The model selection dropdowns in Settings only show three older models. The newer Gemini 3.x models are missing from both the text and image model selectors.

## Changes

### File: `src/pages/Settings.tsx`

**Text Model dropdown (around line 425-429)** -- Add two new options:
- `gemini-3-pro-preview` -- "Gemini 3 Pro Preview (Latest)"
- `gemini-3-flash-preview` -- "Gemini 3 Flash Preview (Fast + New)"

**Image Model dropdown (around line 441-445)** -- Add one new option:
- `gemini-3-pro-image-preview` -- "Gemini 3 Pro Image Preview (Latest)"

### No other changes needed
- The database `user_api_keys` table stores models as plain text, so it already supports any model string.
- The edge functions pass the model value through to the API, so they'll work with the new model names automatically.
- The `useUserApiKeys` hook doesn't validate model names, so no changes needed there either.

This is a one-file, ~5-line addition.
