

# Add & Delete Sections in Outline Detail View

## Overview

Add the ability to delete individual sections and add new sections directly from the outline detail page. Currently you can only edit existing sections -- this adds full section management.

## Changes

### 1. `src/hooks/useProductOutlines.tsx` -- Add two new functions

- **`deleteSection(sectionId: string)`** -- Deletes a section from the `outline_sections` table by ID. Shows a toast on success/error.
- **`addSection(outlineId: string, title: string, description: string, wordCountTarget: number)`** -- Inserts a new row into `outline_sections` with `sort_order` set to the next available number (max existing + 1). Defaults: `section_number` = sort_order + 1, `subsections` = empty array.

Both functions are returned from the hook alongside existing ones.

### 2. `src/components/outlines/OutlineSectionCard.tsx` -- Add delete button

- Add a `Trash2` icon button next to the existing Edit (pencil) button on each section card
- Add an `onDelete` prop: `(sectionId: string) => Promise<void>`
- Clicking the delete button calls `onDelete(section.id)` (with a confirmation dialog to prevent accidental deletion)

### 3. `src/pages/ProductOutline.tsx` -- Add section button + wire up delete

- Add an "Add Section" button (`Plus` icon) below the sections list
- Clicking it shows a simple inline form or small dialog with fields: Title, Description (optional), Word Count Target (default 1000)
- Wire the new `deleteSection` from the hook into `OutlineSectionCard` via an `onDelete` prop
- After adding or deleting a section, re-fetch the outline detail to refresh the list

## Technical Details

### Delete Section Handler (in ProductOutline.tsx)

```typescript
const handleSectionDelete = async (sectionId: string) => {
  await deleteSection(sectionId);
  const updated = await fetchOutlineWithSections(activeOutline.id);
  setActiveOutline(updated);
};
```

### Add Section (in useProductOutlines.tsx)

```typescript
const addSection = async (outlineId: string, title: string, description: string, wordCountTarget: number) => {
  // Get next sort_order
  const { data: existing } = await supabase
    .from("outline_sections")
    .select("sort_order")
    .eq("outline_id", outlineId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1;

  const { error } = await supabase.from("outline_sections").insert({
    outline_id: outlineId,
    title,
    description: description || null,
    word_count_target: wordCountTarget,
    sort_order: nextOrder,
    section_number: nextOrder + 1,
    subsections: [],
  });

  if (error) {
    toast({ title: "Error", description: "Failed to add section.", variant: "destructive" });
    return false;
  }
  toast({ title: "Section Added", description: `"${title}" added to outline.` });
  return true;
};
```

### Files Modified

| File | Change |
|------|--------|
| `src/hooks/useProductOutlines.tsx` | Add `addSection` and `deleteSection` functions |
| `src/components/outlines/OutlineSectionCard.tsx` | Add delete button with `onDelete` prop |
| `src/pages/ProductOutline.tsx` | Add "Add Section" button/form, wire delete to section cards |

No database or backend changes needed -- the `outline_sections` table already supports insert and delete.

