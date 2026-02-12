

# Add PDF, Word Document, and ePub Export Formats

## Overview
Extend the Export Center to support three new professional formats: **PDF**, **Word Document (.docx)**, and **ePub**. These complement the existing Markdown, HTML, Plain Text, and JSON options.

Since generating binary file formats (PDF, DOCX, EPUB) requires server-side libraries, the edge function will use AI to produce well-structured HTML, then convert it to the target format using Deno-compatible libraries. For formats where robust Deno libraries are limited (DOCX, EPUB), we'll generate the files as structured XML/ZIP archives directly.

## Changes

### 1. Update Export Center UI
**File:** `src/pages/ExportCenter.tsx`

Add three new format cards to `formatOptions`:
- **PDF** -- "Print-ready document, ideal for ebooks and handouts" (badge: "eBook")
- **Word Document** -- "Editable .docx file for Microsoft Word and Google Docs" (badge: "Editable")
- **ePub** -- "Standard ebook format for Kindle, Apple Books, and more" (badge: "eBook")

Import a couple extra icons from lucide-react (`BookOpen`, `FileText` or reuse existing ones).

### 2. Update Edge Function: `export-product/index.ts`

**Add to valid formats list:**
```
const validFormats = ["markdown", "html", "txt", "json", "pdf", "docx", "epub"];
```

**PDF generation:**
- Use AI to convert markdown to a complete, print-styled HTML document (reuse existing HTML logic)
- Return the HTML with a special flag so the client-side can render it to PDF using the already-installed `jspdf` library
- The response will include `content` (styled HTML), `mimeType: "application/pdf"`, and `extension: "pdf"`
- Alternatively, generate a clean HTML and let the client handle PDF conversion via `jspdf` or `window.print()`

**DOCX generation:**
- Generate a minimal DOCX file as a ZIP archive containing the required XML structure (Office Open XML)
- Use the content as the document body
- Return as base64-encoded content

**ePub generation:**
- Generate a minimal EPUB file (which is a ZIP archive with XHTML content, OPF manifest, and container.xml)
- Structure chapters from the outline sections
- Return as base64-encoded content

### 3. Update Client-Side Download Logic
**File:** `src/hooks/useProductExports.tsx`

Update `onSuccess` handler to detect binary formats:
- For text-based formats (md, html, txt, json): use existing Blob approach
- For binary formats (pdf, docx, epub): decode base64 content and create a binary Blob with the correct MIME type
- PDF: `application/pdf`
- DOCX: `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- EPUB: `application/epub+zip`

### 4. PDF Client-Side Approach (Preferred)
Since server-side PDF generation in Deno is limited, use a hybrid approach:
- The edge function returns styled HTML (same as the html format but with print-optimized CSS)
- The client uses the already-installed `jspdf` library to convert the HTML to a PDF
- This keeps the edge function simple and leverages the existing dependency

## Technical Details

### Edge Function Changes
- Add `generateDocx()` function: creates a minimal OOXML ZIP archive with the content as a Word document
- Add `generateEpub()` function: creates a valid EPUB 3 archive with chapters mapped to outline sections
- Both return base64-encoded strings to safely transmit binary data via JSON
- The response format adds a `encoding: "base64"` field for binary formats

### Client-Side Changes
- Detect `data.encoding === "base64"` in the download handler
- Convert base64 to Uint8Array, then to Blob for download
- For PDF: render the returned HTML into an iframe, then use `jspdf` to capture it

### EPUB Structure
```text
mimetype
META-INF/container.xml
OEBPS/content.opf
OEBPS/toc.ncx
OEBPS/chapter-1.xhtml
OEBPS/chapter-2.xhtml
...
```

### DOCX Structure
```text
[Content_Types].xml
_rels/.rels
word/document.xml
word/_rels/document.xml.rels
word/styles.xml
```

## Format Summary

| Format | Method | Output |
|--------|--------|--------|
| Markdown | Direct text | .md |
| HTML | AI-styled | .html |
| Plain Text | Strip markdown | .txt |
| JSON | Structured | .json |
| PDF | Client-side from styled HTML | .pdf |
| DOCX | Server-side OOXML ZIP | .docx |
| ePub | Server-side EPUB ZIP | .epub |

## User Flow
1. User selects an outline and picks PDF, DOCX, or ePub format
2. Clicks "Export" button
3. Edge function generates the content and returns it
4. Client downloads the file in the selected format

