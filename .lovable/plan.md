

# Settings Update: API Keys & AI Configuration

## Overview
Add a new "AI Configuration" section to the Settings page where users can store their own Gemini API key and select preferred AI models for text and image generation. Also add the API key storage infrastructure (database table + RLS) and update all edge functions to use user-provided keys.

## What Changes

### 1. Database: `user_api_keys` table
Create a new table to securely store per-user API keys:
- `id` (uuid, PK)
- `user_id` (uuid, unique, references auth.users)
- `gemini_api_key` (text, encrypted at rest by Supabase)
- `preferred_text_model` (text, default `gemini-2.5-flash`)
- `preferred_image_model` (text, default `gemini-2.5-flash-image-preview`)
- `created_at`, `updated_at` (timestamps)

RLS policies: users can only read/update/insert their own row.

### 2. New Hook: `useUserApiKeys`
A React hook to:
- Fetch the user's API key record (masked display -- only show last 4 chars)
- Save/update API key and model preferences
- Provide helper to check if a key is configured

### 3. Settings Page: New "AI Configuration" Card
Add a new card section between "Profile" and "Content Generation" with:
- **Gemini API Key** -- password-type input field with save button. Shows masked value if already set, with a "Change" button.
- **Instructions link** -- brief note on how to get a key from Google AI Studio (https://aistudio.google.com/apikey)
- **Preferred Text Model** -- dropdown with options: Gemini 2.5 Flash (default), Gemini 2.5 Pro, Gemini 2.5 Flash Lite
- **Preferred Image Model** -- dropdown with options: Gemini 2.5 Flash Image (default)
- **Connection test** button -- calls a lightweight edge function to verify the key works

### 4. Edge Function: `verify-api-key`
A small edge function that takes the user's stored Gemini key and makes a minimal API call to verify it works, returning success/failure.

### 5. Update Existing Edge Functions
Modify all AI-calling edge functions (generate-posts, generate-image, generate-outline, copilot-chat, etc.) to:
1. Look up the calling user's `gemini_api_key` from `user_api_keys`
2. Use the user's key to call Google Gemini API directly (not Lovable AI gateway)
3. Respect the user's `preferred_text_model` / `preferred_image_model` selection
4. Fall back to `LOVABLE_API_KEY` + Lovable gateway if no user key is configured

---

## Technical Details

### Database Migration SQL
```sql
CREATE TABLE public.user_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gemini_api_key text,
  preferred_text_model text DEFAULT 'gemini-2.5-flash',
  preferred_image_model text DEFAULT 'gemini-2.5-flash-image-preview',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own keys" ON public.user_api_keys
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_user_api_keys_updated_at
  BEFORE UPDATE ON public.user_api_keys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Edge Function Pattern (per function update)
```typescript
// Inside each edge function, after auth:
const { data: keyData } = await supabaseClient
  .from('user_api_keys')
  .select('gemini_api_key, preferred_text_model')
  .eq('user_id', userId)
  .maybeSingle();

let apiUrl, apiKey, model;
if (keyData?.gemini_api_key) {
  apiUrl = 'https://generativelanguage.googleapis.com/v1beta/...';
  apiKey = keyData.gemini_api_key;
  model = keyData.preferred_text_model;
} else {
  apiUrl = 'https://ai.gateway.lovable.dev/v1/chat/completions';
  apiKey = Deno.env.get('LOVABLE_API_KEY');
  model = 'google/gemini-2.5-flash';
}
```

### Files to Create
- `src/hooks/useUserApiKeys.tsx`
- `supabase/functions/verify-api-key/index.ts`

### Files to Modify
- `src/pages/Settings.tsx` -- add AI Configuration card
- `src/hooks/useUserSettings.tsx` -- minor type updates if needed
- `supabase/config.toml` -- register verify-api-key function
- All 12+ edge functions in `supabase/functions/` -- add user key lookup logic

### Model Options Presented in Settings
**Text Models:**
| Value | Label |
|-------|-------|
| `gemini-2.5-flash` | Gemini 2.5 Flash (Recommended) |
| `gemini-2.5-pro` | Gemini 2.5 Pro (Best quality) |
| `gemini-2.5-flash-lite` | Gemini 2.5 Flash Lite (Fastest) |

**Image Models:**
| Value | Label |
|-------|-------|
| `gemini-2.5-flash-image-preview` | Gemini 2.5 Flash Image |

