

# Remove Lovable Gateway from Image Generation — Use Only User API Key

## Change

Strip out all Lovable AI gateway logic from `generate-image/index.ts`. The function will only use the user's own Gemini API key (from `user_api_keys` table). If no user key is found, return a clear error asking them to configure one in Settings.

### File: `supabase/functions/generate-image/index.ts`

1. **Remove** the `LOVABLE_API_KEY` variable lookup (line ~258)
2. **Remove** the `ai_settings` model fetch (lines 293-304) — no longer needed since we only use the direct Gemini path
3. **Change** the guard (line 289) from `if (!userApiKey && !LOVABLE_API_KEY)` to `if (!userApiKey)` with error message: "No Gemini API key configured. Please go to Settings and add your API key."
4. **Remove** the gateway `else` branch (lines 330-343) — the entire `fetch("https://ai.gateway.lovable.dev/...")` block
5. **Remove** the gateway response parsing branch (lines 379-381) — `data.choices?.[0]?.message?.images?...`
6. **Simplify** the response parsing to only handle the Gemini direct API format (inline base64 data)
7. **Remove** the 402 payment error handler (lines 352-356) — not applicable for direct Gemini API

Result: a cleaner function that exclusively uses `userApiKey` with `gemini-2.0-flash-exp-image-generation`.

