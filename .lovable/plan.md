

# Fix: Remove Sources from Dashboard + Clarify Product Location

## Issue 1: "Add Source" Still Showing on Dashboard

Sources was removed from the sidebar but still appears in three places on the dashboard main content area:

1. **Quick Actions grid** -- "Add Source" card linking to `/sources`
2. **Stats grid** -- "Content Sources" stat card showing `sources.length`
3. **Getting Started checklist** -- Step 2 "Add a content source" linking to `/sources`

### Fix

- Remove the "Add Source" quick action card (replace with a more relevant action, e.g., "KDP Publisher" or "Export Center")
- Remove the "Content Sources" stat card (replace with something useful like "Exports" or "Images")
- Remove the "Add a content source" getting started step (renumber remaining steps to 1-3)
- Remove the `useContentSources` import and `sources` variable since they're no longer needed
- Remove the `Rss` icon import

### Updated Quick Actions (4 cards)
1. Generate Ideas (keep)
2. Create Outline (keep)
3. Image Studio (keep)
4. Export Center (new -- replaces "Add Source")

### Updated Stats Grid (4 cards)
1. Product Ideas (keep)
2. Outlines (keep)
3. Brands (keep)
4. Exports or Images (replaces "Content Sources")

### Updated Getting Started (3 steps)
1. Set up your brand profile
2. Generate product ideas
3. Create your first outline

## Issue 2: Where Created Products Appear

Currently, products created under a brand appear across separate pages:
- **Product Ideas** at `/product-ideas`
- **Outlines** at `/outlines`
- **Exports** at `/export-center`

No changes needed here for now -- the sidebar navigation already provides access to each. The dashboard stats and quick actions will guide users to the right pages.

## Files Modified

| File | Change |
|------|--------|
| `src/pages/Dashboard.tsx` | Remove Sources references from quick actions, stats, getting started; remove `useContentSources` import; replace with Export Center action |

