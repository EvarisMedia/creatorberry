
# Auto-Generate Outline on "Start Building"

## Problem
Currently, clicking "Start Building" only changes the idea status and navigates to the Outlines page. The user then has to manually click "Generate Outline" and select the idea again. This is redundant -- "Start Building" should trigger outline generation automatically.

## Changes

### 1. Update ProductIdeaCard to accept and call an `onStartBuilding` callback
**File:** `src/components/product-ideas/ProductIdeaCard.tsx`
- Add a new prop `onStartBuilding: (idea: ProductIdea) => void`
- On "Start Building" click, call `onStartBuilding(idea)` instead of just changing status and navigating
- Remove the "Continue Building" variant -- the button only shows for `saved` or `new` status ideas (once outline is generated, the idea moves to `outlined` status and won't show this button)
- Keep the button label as just "Start Building"

### 2. Wire up outline generation in ProductIdeas page
**File:** `src/pages/ProductIdeas.tsx`
- Import `useProductOutlines` hook
- Create a `handleStartBuilding` function that:
  1. Updates the idea status to `in_progress`
  2. Calls `generateOutline(idea, selectedBrand)` from the outlines hook
  3. On success, navigates to `/outlines` where the generated outline will be visible
- Pass `handleStartBuilding` as the `onStartBuilding` prop to each `ProductIdeaCard`
- Show a loading/generating state while the outline is being created (e.g., a toast or spinner overlay)

### 3. Remove redundant "in_progress" status display
**File:** `src/components/product-ideas/ProductIdeaCard.tsx`
- Since clicking "Start Building" now immediately generates the outline and the idea status becomes `outlined`, the `in_progress` status becomes a brief transitional state
- The button should be disabled/show a spinner while generation is in progress

## Expected Flow After Fix
1. User clicks "Start Building" on a product idea
2. A loading spinner appears on the button
3. The outline is generated via the AI backend function
4. User is automatically redirected to `/outlines` where the new outline appears
5. The idea status updates to `outlined`

## Technical Notes
- The `generateOutline` function from `useProductOutlines` already handles the API call, toast notifications, and error handling
- The `generate-outline` edge function already updates the idea status to `outlined` upon success
- No backend changes needed -- only frontend wiring
