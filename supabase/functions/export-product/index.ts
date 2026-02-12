import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as JSZip from "https://esm.sh/jszip@3.10.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

async function fetchOutlineWithContent(supabase: any, outlineId: string, userId: string) {
  const { data: outline, error: outlineError } = await supabase
    .from("product_outlines")
    .select("*")
    .eq("id", outlineId)
    .eq("user_id", userId)
    .single();

  if (outlineError || !outline) throw new Error("Outline not found");

  const { data: sections, error: sectionsError } = await supabase
    .from("outline_sections")
    .select("*")
    .eq("outline_id", outlineId)
    .order("sort_order", { ascending: true });

  if (sectionsError) throw new Error("Failed to fetch sections");

  const sectionIds = sections.map((s: any) => s.id);
  const { data: expandedContent } = await supabase
    .from("expanded_content")
    .select("*")
    .in("outline_section_id", sectionIds.length > 0 ? sectionIds : ["none"])
    .order("version", { ascending: false });

  const contentMap: Record<string, any> = {};
  for (const ec of (expandedContent || [])) {
    if (!contentMap[ec.outline_section_id]) {
      contentMap[ec.outline_section_id] = ec;
    }
  }

  const { data: sectionImages } = await supabase
    .from("generated_images")
    .select("*")
    .in("section_id", sectionIds.length > 0 ? sectionIds : ["none"])
    .order("created_at", { ascending: true });

  const imagesMap: Record<string, any[]> = {};
  for (const img of (sectionImages || [])) {
    if (!imagesMap[img.section_id]) {
      imagesMap[img.section_id] = [];
    }
    imagesMap[img.section_id].push(img);
  }

  return { outline, sections, contentMap, imagesMap };
}

function generateMarkdown(outline: any, sections: any[], contentMap: Record<string, any>, imagesMap: Record<string, any[]>, settings: any) {
  let md = `# ${outline.title}\n\n`;

  if (settings.includeToc) {
    md += `## Table of Contents\n\n`;
    sections.forEach((section: any, i: number) => {
      md += `${i + 1}. [${section.title}](#chapter-${i + 1})\n`;
    });
    md += `\n---\n\n`;
  }

  sections.forEach((section: any, i: number) => {
    md += `## Chapter ${i + 1}: ${section.title}\n\n`;
    
    if (section.description) {
      md += `*${section.description}*\n\n`;
    }

    const content = contentMap[section.id];
    if (content) {
      md += `${content.content}\n\n`;
    } else {
      md += `*(Content not yet expanded)*\n\n`;
    }

    const sectionImgs = imagesMap[section.id] || [];
    for (const img of sectionImgs) {
      md += `![${img.image_type === 'chapter_illustration' ? 'Chapter Illustration' : 'Section Infographic'}](${img.image_url})\n\n`;
    }

    if (section.subsections) {
      const subs = typeof section.subsections === 'string' 
        ? JSON.parse(section.subsections) 
        : section.subsections;
      if (Array.isArray(subs) && subs.length > 0) {
        subs.forEach((sub: any) => {
          md += `### ${sub.title || sub}\n\n`;
          if (sub.description) md += `${sub.description}\n\n`;
        });
      }
    }

    md += `---\n\n`;
  });

  return md;
}

function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function markdownToDocxXml(markdown: string): string {
  const lines = markdown.split('\n');
  let xml = '';
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    if (trimmed.startsWith('# ')) {
      xml += `<w:p><w:pPr><w:pStyle w:val="Title"/></w:pPr><w:r><w:t>${escapeXml(trimmed.slice(2))}</w:t></w:r></w:p>`;
    } else if (trimmed.startsWith('## ')) {
      xml += `<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>${escapeXml(trimmed.slice(3))}</w:t></w:r></w:p>`;
    } else if (trimmed.startsWith('### ')) {
      xml += `<w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr><w:r><w:t>${escapeXml(trimmed.slice(4))}</w:t></w:r></w:p>`;
    } else if (trimmed.startsWith('---')) {
      xml += `<w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="4" w:space="1" w:color="auto"/></w:pBdr></w:pPr></w:p>`;
    } else if (trimmed.startsWith('![')) {
      // Skip images in DOCX for simplicity
      continue;
    } else {
      // Handle bold and italic
      let text = trimmed.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1');
      xml += `<w:p><w:r><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`;
    }
  }
  
  return xml;
}

async function generateDocx(markdown: string, title: string): Promise<string> {
  const zip = new JSZip.default();
  
  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`;
  
  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;
  
  const documentRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;
  
  const bodyXml = markdownToDocxXml(markdown);
  
  const document = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>${bodyXml}<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr></w:body>
</w:document>`;
  
  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:rPr><w:b/><w:sz w:val="56"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:rPr><w:b/><w:sz w:val="36"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:rPr><w:b/><w:sz w:val="28"/></w:rPr></w:style>
</w:styles>`;
  
  zip.file("[Content_Types].xml", contentTypes);
  zip.file("_rels/.rels", rels);
  zip.file("word/document.xml", document);
  zip.file("word/_rels/document.xml.rels", documentRels);
  zip.file("word/styles.xml", styles);
  
  const blob = await zip.generateAsync({ type: "base64" });
  return blob;
}

function markdownToXhtml(markdown: string): string {
  let html = markdown
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^---$/gm, '<hr/>')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1"/>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  
  // Wrap loose text in paragraphs
  const lines = html.split('\n');
  const result: string[] = [];
  for (const line of lines) {
    const t = line.trim();
    if (!t) continue;
    if (t.startsWith('<h') || t.startsWith('<hr') || t.startsWith('<img') || t.startsWith('<a')) {
      result.push(t);
    } else {
      result.push(`<p>${t}</p>`);
    }
  }
  return result.join('\n');
}

async function generateEpub(markdown: string, title: string, sections: any[], contentMap: Record<string, any>, imagesMap: Record<string, any[]>): Promise<string> {
  const zip = new JSZip.default();
  
  // mimetype must be first and uncompressed
  zip.file("mimetype", "application/epub+zip", { compression: "STORE" });
  
  zip.file("META-INF/container.xml", `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`);
  
  // Build chapters
  const chapterFiles: string[] = [];
  const spineItems: string[] = [];
  const manifestItems: string[] = [];
  const navPoints: string[] = [];
  
  // Title page
  zip.file("OEBPS/title.xhtml", `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>${escapeXml(title)}</title>
<style>body{font-family:serif;text-align:center;padding-top:40%;} h1{font-size:2em;}</style>
</head>
<body><h1>${escapeXml(title)}</h1></body>
</html>`);
  manifestItems.push(`<item id="title" href="title.xhtml" media-type="application/xhtml+xml"/>`);
  spineItems.push(`<itemref idref="title"/>`);
  
  sections.forEach((section: any, i: number) => {
    const chapterId = `chapter-${i + 1}`;
    const fileName = `${chapterId}.xhtml`;
    
    let chapterContent = '';
    if (section.description) {
      chapterContent += `<p><em>${escapeXml(section.description)}</em></p>\n`;
    }
    
    const content = contentMap[section.id];
    if (content) {
      chapterContent += markdownToXhtml(content.content);
    } else {
      chapterContent += '<p><em>(Content not yet expanded)</em></p>';
    }
    
    const sectionImgs = imagesMap[section.id] || [];
    for (const img of sectionImgs) {
      chapterContent += `<p><img src="${escapeXml(img.image_url)}" alt="Illustration" style="max-width:100%;"/></p>\n`;
    }
    
    zip.file(`OEBPS/${fileName}`, `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>Chapter ${i + 1}: ${escapeXml(section.title)}</title>
<style>body{font-family:serif;line-height:1.6;margin:1em;} h2{font-size:1.5em;} img{max-width:100%;}</style>
</head>
<body>
<h2>Chapter ${i + 1}: ${escapeXml(section.title)}</h2>
${chapterContent}
</body>
</html>`);
    
    manifestItems.push(`<item id="${chapterId}" href="${fileName}" media-type="application/xhtml+xml"/>`);
    spineItems.push(`<itemref idref="${chapterId}"/>`);
    navPoints.push(`<navPoint id="nav-${chapterId}" playOrder="${i + 2}"><navLabel><text>Chapter ${i + 1}: ${escapeXml(section.title)}</text></navLabel><content src="${fileName}"/></navPoint>`);
  });
  
  // content.opf
  zip.file("OEBPS/content.opf", `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="bookid" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${escapeXml(title)}</dc:title>
    <dc:language>en</dc:language>
    <dc:identifier id="bookid">urn:uuid:${crypto.randomUUID()}</dc:identifier>
    <meta property="dcterms:modified">${new Date().toISOString().split('.')[0]}Z</meta>
  </metadata>
  <manifest>
    ${manifestItems.join('\n    ')}
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
  </manifest>
  <spine toc="ncx">
    ${spineItems.join('\n    ')}
  </spine>
</package>`);
  
  // toc.ncx
  zip.file("OEBPS/toc.ncx", `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head><meta name="dtb:uid" content="urn:uuid:00000000-0000-0000-0000-000000000000"/></head>
  <docTitle><text>${escapeXml(title)}</text></docTitle>
  <navMap>
    <navPoint id="nav-title" playOrder="1"><navLabel><text>Title Page</text></navLabel><content src="title.xhtml"/></navPoint>
    ${navPoints.join('\n    ')}
  </navMap>
</ncx>`);
  
  const blob = await zip.generateAsync({ type: "base64" });
  return blob;
}

async function generateFormattedExport(
  markdown: string, 
  format: string, 
  title: string,
  model: string,
  sections?: any[],
  contentMap?: Record<string, any>,
  imagesMap?: Record<string, any[]>
) {
  if (format === "markdown") {
    return { content: markdown, mimeType: "text/markdown", extension: "md" };
  }

  if (format === "html" || format === "pdf") {
    const printCss = format === "pdf" ? `
      @media print { h2 { page-break-before: always; } }
      @page { margin: 2cm; }` : '';
    
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: `Convert the given Markdown into a complete, self-contained HTML document with professional styling. Include:
- Clean typography with a serif font for body, sans-serif for headings
- Responsive layout with max-width 800px centered
- Table of contents with clickable links
- Page break hints for printing (page-break-before on h2)
- Professional color scheme
- Print-friendly styles
${printCss ? '- Extra print CSS: ' + printCss : ''}
- Keep all image tags with their original URLs
Return ONLY the HTML, no explanation.`
          },
          { role: "user", content: markdown }
        ],
      }),
    });

    if (!response.ok) throw new Error("Failed to generate HTML");
    const data = await response.json();
    const html = data.choices?.[0]?.message?.content || "";
    
    if (format === "pdf") {
      return { content: html, mimeType: "text/html", extension: "pdf" };
    }
    return { content: html, mimeType: "text/html", extension: "html" };
  }

  if (format === "txt") {
    const plainText = markdown
      .replace(/^#{1,6}\s+/gm, "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/---/g, "\n" + "=".repeat(50) + "\n")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, "[$1]");
    return { content: plainText, mimeType: "text/plain", extension: "txt" };
  }

  if (format === "json") {
    return { 
      content: JSON.stringify({ title, markdown }, null, 2), 
      mimeType: "application/json", 
      extension: "json" 
    };
  }

  if (format === "docx") {
    const base64 = await generateDocx(markdown, title);
    return {
      content: base64,
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      extension: "docx",
      encoding: "base64",
    };
  }

  if (format === "epub") {
    const base64 = await generateEpub(markdown, title, sections || [], contentMap || {}, imagesMap || {});
    return {
      content: base64,
      mimeType: "application/epub+zip",
      extension: "epub",
      encoding: "base64",
    };
  }

  throw new Error(`Unsupported format: ${format}`);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { outlineId, format, settings = {} } = await req.json();

    if (!outlineId || !format) {
      throw new Error("outlineId and format are required");
    }

    const validFormats = ["markdown", "html", "txt", "json", "pdf", "docx", "epub"];
    if (!validFormats.includes(format)) {
      throw new Error(`Invalid format. Supported: ${validFormats.join(", ")}`);
    }

    console.log(`Exporting outline ${outlineId} as ${format}`);

    const { outline, sections, contentMap, imagesMap } = await fetchOutlineWithContent(
      supabase, outlineId, user.id
    );

    const markdown = generateMarkdown(outline, sections, contentMap, imagesMap, {
      includeToc: settings.includeToc !== false,
      ...settings,
    });

    let model = "google/gemini-2.5-flash-lite";
    try {
      const { data: modelSetting } = await supabase
        .from("ai_settings")
        .select("setting_value")
        .eq("setting_key", "model_content")
        .single();
      if (modelSetting?.setting_value) model = modelSetting.setting_value;
    } catch { /* use default */ }

    const result = await generateFormattedExport(markdown, format, outline.title, model, sections, contentMap, imagesMap);

    const fileSize = result.encoding === "base64" 
      ? Math.ceil(result.content.length * 0.75) 
      : new Blob([result.content]).size;

    const { data: exportRecord, error: insertError } = await supabase
      .from("product_exports")
      .insert({
        user_id: user.id,
        product_outline_id: outlineId,
        brand_id: outline.brand_id,
        format,
        title: outline.title,
        status: "completed",
        file_size: fileSize,
        export_settings: settings,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to save export record:", insertError);
    }

    const responseBody: any = {
      content: result.content,
      mimeType: result.mimeType,
      extension: result.extension,
      title: outline.title,
      fileSize,
      exportId: exportRecord?.id,
    };
    
    if (result.encoding) {
      responseBody.encoding = result.encoding;
    }

    return new Response(
      JSON.stringify(responseBody),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Export error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
