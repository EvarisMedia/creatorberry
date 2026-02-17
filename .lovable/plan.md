

# Fix: Download Button in Export History Re-generates Instead of Downloading

## Problem
The "Download" button in Export History (line 407 of `ExportCenter.tsx`) calls `exportProduct.mutate(...)`, which triggers a full re-generation of the export via the edge function. This is slow, wasteful, and confusing -- the user expects an instant download of the already-generated file.

Additionally, since `exportProduct.isPending` is a single boolean shared across all rows, clicking download on one row makes ALL download buttons show the spinning loader.

## Root Cause
Exports are generated on-the-fly and streamed back as content in the response. The `file_url` column in `product_exports` is always `null` -- no file is actually stored for later retrieval.

## Solution

### Approach: Store export content in file storage on first generation, download from storage on subsequent clicks

1. **Edge function change** (`supabase/functions/export-product/index.ts`):
   - After generating the export content, upload the file to a `product-exports` storage bucket
   - Update the `product_exports` row with the storage path in `file_url` and actual `file_size`
   - Continue returning content in the response for the initial download (no behavior change for first export)

2. **Add a `downloadExport` mutation** (`src/hooks/useProductExports.tsx`):
   - New mutation that checks if the export has a `file_url`
   - If yes: generate a signed URL from storage and trigger download directly (instant)
   - If no (legacy exports): fall back to calling `exportProduct.mutate()` to re-generate

3. **Update Export History UI** (`src/pages/ExportCenter.tsx`):
   - Replace the download button's `onClick` to call `downloadExport` instead of `exportProduct`
   - Track per-row loading state (e.g., `downloadingId`) so only the clicked row shows a spinner

### Files to Modify

1. **`supabase/functions/export-product/index.ts`**
   - Create `product-exports` bucket if not exists (or use migration)
   - After generating content, upload blob to storage at path `{user_id}/{export_id}.{extension}`
   - Update the DB row with `file_url` and `file_size`

2. **`src/hooks/useProductExports.tsx`**
   - Add `downloadExport` mutation that:
     - Takes an export record
     - If `file_url` exists: call `supabase.storage.from('product-exports').createSignedUrl(file_url, 3600)` and trigger download
     - If not: fall back to `exportProduct.mutate()`

3. **`src/pages/ExportCenter.tsx`**
   - Wire the download button to call `downloadExport.mutate(exp)` instead of `exportProduct.mutate(...)`
   - Track `downloadingId` state so only the active row shows the spinner

### Database Migration
- Create a storage bucket `product-exports` (private) with appropriate RLS policies so users can only access their own exports

## Technical Details

### Storage bucket setup (migration):
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-exports', 'product-exports', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can read own exports"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-exports' AND (storage.foldername(name))[1] = auth.uid()::text);
```

### Download mutation (useProductExports.tsx):
```typescript
const downloadExport = useMutation({
  mutationFn: async (exp: ProductExport) => {
    if (!exp.file_url) {
      // Legacy: re-generate
      throw new Error("NO_FILE");
    }
    const { data, error } = await supabase.storage
      .from("product-exports")
      .createSignedUrl(exp.file_url, 3600);
    if (error) throw error;
    return { url: data.signedUrl, title: exp.title, format: exp.format };
  },
  onSuccess: (data) => {
    const a = document.createElement("a");
    a.href = data.url;
    a.download = `${data.title.replace(/[^a-zA-Z0-9]/g, "_")}.${data.format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("Download started!");
  },
  onError: (error, exp) => {
    if (error.message === "NO_FILE") {
      // Fallback: re-export
      exportProduct.mutate({ outlineId: exp.product_outline_id, format: exp.format, settings: exp.export_settings || {} });
    } else {
      toast.error("Download failed: " + error.message);
    }
  },
});
```

### Edge function upload snippet:
```typescript
// After generating content, upload to storage
const filePath = `${userId}/${exportId}.${extension}`;
const { error: uploadError } = await supabaseAdmin.storage
  .from("product-exports")
  .upload(filePath, contentBlob, { contentType: mimeType, upsert: true });

if (!uploadError) {
  await supabaseAdmin.from("product_exports")
    .update({ file_url: filePath, file_size: contentBlob.size })
    .eq("id", exportId);
}
```

