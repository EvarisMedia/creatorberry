
# Update Admin Panel: Remove Old Pages, Add AI Model Access to Plans

## What Changes

### 1. Remove "AI Training" and "AI Settings" from Admin Sidebar
These are legacy features. Remove their links from the sidebar navigation. The pages and routes will remain in the codebase but won't be accessible from the admin panel navigation.

**File: `src/components/admin/AdminSidebar.tsx`**
- Remove the "AI Training" (`/admin/training`) and "AI Settings" (`/admin/settings`) sidebar items
- Final sidebar: Dashboard, Users, Plans

### 2. Add AI Model Access to Plan Features
Plans should control which AI models users can access. Add new feature toggles to the `PlanFeatures` interface and plan creation/edit dialog.

**File: `src/hooks/usePlans.tsx`**
- Add to `PlanFeatures` interface:
  - `ai_text_models: boolean` -- access to text generation AI models
  - `ai_image_models: boolean` -- access to image generation AI models

**File: `src/pages/AdminPlans.tsx`**
- Update `DEFAULT_FEATURES` to include `ai_text_models: false` and `ai_image_models: false`
- Add two new `FeatureBool` toggles under a new "AI Access" section in the create/edit dialog:
  - "AI Text Models"
  - "AI Image Models"
- Show AI model badges on plan cards alongside existing feature badges

### 3. Update Seeded Plans via Data Update
Update the three existing seeded plans to include the new AI model fields in their `features` JSON:
- Starter: `ai_text_models: true`, `ai_image_models: false`
- Pro: `ai_text_models: true`, `ai_image_models: true`
- Unlimited: `ai_text_models: true`, `ai_image_models: true`

This is a data update (not schema change) using the insert tool.

## Files Modified
- `src/components/admin/AdminSidebar.tsx` -- remove 2 sidebar items
- `src/hooks/usePlans.tsx` -- extend PlanFeatures interface
- `src/pages/AdminPlans.tsx` -- add AI toggles to dialog and card display

## No Database Migration Needed
The `features` column is already JSONB, so adding new keys requires no schema change -- just code and data updates.
