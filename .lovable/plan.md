

# Fix: PDF Download Opens as HTML Code Page

## Problem
When clicking "Download" on a PDF export in Export History, the browser opens a page showing raw HTML code instead of a PDF.

## Root Cause
The PDF export pipeline generates styled HTML (not a real PDF binary). The edge function stores this HTML file in storage with `contentType: "text/html"` and extension `.pdf`. When the `downloadExport` mutation creates a signed URL and navigates to it, the browser renders the raw HTML source as text because the file extension says `.pdf` but the content is HTML.

The initial export path handles this correctly (line 87-97 in `useProductExports.tsx`) by opening the HTML in a new window and triggering the browser's print-to-PDF dialog. But the storage download path just creates a link with the signed URL, which doesn't work for this case.

## Fix

### File: `src/hooks/useProductExports.tsx`

Update the `downloadExport` mutation's `onSuccess` handler to check the format:

- **For PDF**: Fetch the signed URL content as text, open it in a new window, and trigger the print dialog (same behavior as initial export)
- **For binary formats (docx, epub)**: Keep the current signed URL download approach
- **For text formats (md, txt, html, json, csv)**: Fetch as blob and trigger download with correct MIME type

This ensures PDF exports always go through the print-to-PDF flow regardless of whether it's the first export or a re-download from history.

### Technical Details

```typescript
onSuccess: async (data) => {
  if (data.format === "pdf") {
    // PDF is stored as HTML - fetch and open print dialog
    const response = await fetch(data.url);
    const html = await response.text();
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
    toast.success("PDF print dialog opened!");
  } else {
    // All other formats: direct download via link
    const a = document.createElement("a");
    a.href = data.url;
    a.download = `${data.title.replace(/[^a-zA-Z0-9]/g, "_")}.${data.format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("Download started!");
  }
},
```

### Files to Modify
1. `src/hooks/useProductExports.tsx` -- Update `downloadExport.onSuccess` to handle PDF format specially

