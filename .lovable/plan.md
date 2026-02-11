

# Refactor Brand Setup & Product Ideas Workflow

## Problem Summary
1. **Brand Voice (Step 3 in CreateBrand)** has social-media-era settings (tone, emoji usage, writing style) that don't serve digital product creation
2. **Product Ideas** only supports AI generation -- no way to manually add ideas
3. **Sources page** is disconnected from the product workflow and adds unnecessary complexity

## Recommended Workflow for Product Ideas

Sources as a separate page adds friction without clear value. Instead, the best workflow is:

1. **Brand profile provides the context** -- niche, expertise, target audience, offers (already captured in Step 4)
2. **Users can manually add their own product ideas** directly on the Product Ideas page
3. **AI generates ideas using the brand profile** (no separate sources needed)
4. **Optional: user adds a "seed prompt"** when generating -- a text field where they describe a rough idea, market trend, or topic they want AI to explore

This removes Sources as a required step and makes idea generation more direct.

---

## Changes

### 1. Refactor Brand Voice Step (CreateBrand.tsx, Step 3)

**Remove** the old social-media settings:
- Tone (professional/conversational/bold/opinionated)
- Emoji Usage (none/minimal/moderate)
- Writing Style (short_punchy/long_form/story_driven)

**Replace with** product-creation-relevant fields:
- **Niche / Industry** (text input) -- "What space do you operate in?"
- **Your Expertise** (textarea) -- "What topics are you an expert in?"
- **Content Style** (select: educational / inspirational / tactical / research-backed) -- How your products should feel
- **Preferred Product Formats** (multi-select checkboxes: Ebook, Course, Templates, Workbook, Coaching, Membership, Printables) -- What formats interest you

The brands table already has `niche`, `content_style` columns. No migration needed for those. The `tone`, `emoji_usage`, `writing_style` columns stay in the DB (backward compatible) but are no longer collected in the wizard.

### 2. Add Manual Idea Creation (Product Ideas Page)

Add an "Add Idea Manually" button next to "Generate Ideas" on the ProductIdeas page header.

**New component: `AddIdeaDialog.tsx`**
- Title (required)
- Description (required)
- Format (select from product formats)
- Target Audience (optional)
- Fields map directly to the existing `product_ideas` table -- no migration needed

**Update `useProductIdeas.tsx`** to add a `createIdea` function that inserts directly into the `product_ideas` table with status "new" and no PMF score.

### 3. Enhance Generate Ideas Dialog

Update `GenerateIdeasDialog.tsx` to include:
- Existing "Number of Ideas" selector
- **New: "Seed Prompt" textarea** (optional) -- "Describe a topic, trend, or rough idea you want AI to explore"
- Pass this seed prompt to the edge function

**Update `generate-product-ideas` edge function:**
- Accept optional `seedPrompt` parameter
- Include it in the AI prompt when provided: "The creator is particularly interested in: [seedPrompt]"
- Fix the existing bug where `supabase` and `user` are referenced before being defined

### 4. Remove Sources from Main Sidebar

Since Sources aren't integral to the digital product workflow:
- Remove "Sources" from `sidebarItems` in both `Dashboard.tsx` and `ProductIdeas.tsx`
- Keep the `/sources` route and page intact (accessible via URL if needed)
- This declutters navigation and focuses on the core workflow

---

## Files Modified

| File | Change |
|------|--------|
| `src/pages/CreateBrand.tsx` | Replace Step 3 voice settings with product-relevant fields (niche, expertise, content style, preferred formats) |
| `src/components/product-ideas/AddIdeaDialog.tsx` | **New file** -- Manual idea creation dialog |
| `src/components/product-ideas/GenerateIdeasDialog.tsx` | Add seed prompt textarea |
| `src/hooks/useProductIdeas.tsx` | Add `createIdea` mutation function |
| `src/pages/ProductIdeas.tsx` | Add "Add Manually" button, pass seed prompt to generate |
| `supabase/functions/generate-product-ideas/index.ts` | Accept `seedPrompt`, fix variable ordering bug |
| `src/pages/Dashboard.tsx` | Remove Sources from sidebar |

## No Database Migration Needed
All required columns (`niche`, `content_style`, `product_ideas.*`) already exist. The old brand voice columns (`tone`, `emoji_usage`, `writing_style`) remain in the schema but are simply no longer collected.

