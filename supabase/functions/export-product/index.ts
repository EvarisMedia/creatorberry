import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

async function fetchOutlineWithContent(supabase: any, outlineId: string, userId: string) {
  // Fetch outline
  const { data: outline, error: outlineError } = await supabase
    .from("product_outlines")
    .select("*")
    .eq("id", outlineId)
    .eq("user_id", userId)
    .single();

  if (outlineError || !outline) throw new Error("Outline not found");

  // Fetch sections
  const { data: sections, error: sectionsError } = await supabase
    .from("outline_sections")
    .select("*")
    .eq("outline_id", outlineId)
    .order("sort_order", { ascending: true });

  if (sectionsError) throw new Error("Failed to fetch sections");

  // Fetch expanded content for each section
  const sectionIds = sections.map((s: any) => s.id);
  const { data: expandedContent } = await supabase
    .from("expanded_content")
    .select("*")
    .in("outline_section_id", sectionIds.length > 0 ? sectionIds : ["none"])
    .order("version", { ascending: false });

  // Map content to sections (latest version per section)
  const contentMap: Record<string, any> = {};
  for (const ec of (expandedContent || [])) {
    if (!contentMap[ec.outline_section_id]) {
      contentMap[ec.outline_section_id] = ec;
    }
  }

  return { outline, sections, contentMap };
}

function generateMarkdown(outline: any, sections: any[], contentMap: Record<string, any>, settings: any) {
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

async function generateFormattedExport(
  markdown: string, 
  format: string, 
  title: string,
  model: string
) {
  if (format === "markdown") {
    return { content: markdown, mimeType: "text/markdown", extension: "md" };
  }

  if (format === "html") {
    // Use AI to convert markdown to styled HTML
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
Return ONLY the HTML, no explanation.`
          },
          { role: "user", content: markdown }
        ],
      }),
    });

    if (!response.ok) throw new Error("Failed to generate HTML");
    const data = await response.json();
    const html = data.choices?.[0]?.message?.content || "";
    return { content: html, mimeType: "text/html", extension: "html" };
  }

  if (format === "txt") {
    // Strip markdown formatting for plain text
    const plainText = markdown
      .replace(/^#{1,6}\s+/gm, "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/---/g, "\n" + "=".repeat(50) + "\n")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
    return { content: plainText, mimeType: "text/plain", extension: "txt" };
  }

  if (format === "json") {
    return { 
      content: JSON.stringify({ title, markdown }, null, 2), 
      mimeType: "application/json", 
      extension: "json" 
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

    // Get user from auth token
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

    const validFormats = ["markdown", "html", "txt", "json"];
    if (!validFormats.includes(format)) {
      throw new Error(`Invalid format. Supported: ${validFormats.join(", ")}`);
    }

    console.log(`Exporting outline ${outlineId} as ${format}`);

    // Fetch all content
    const { outline, sections, contentMap } = await fetchOutlineWithContent(
      supabase, outlineId, user.id
    );

    // Generate markdown first (base format)
    const markdown = generateMarkdown(outline, sections, contentMap, {
      includeToc: settings.includeToc !== false,
      ...settings,
    });

    // Fetch AI model
    let model = "google/gemini-2.5-flash-lite";
    try {
      const { data: modelSetting } = await supabase
        .from("ai_settings")
        .select("setting_value")
        .eq("setting_key", "model_content")
        .single();
      if (modelSetting?.setting_value) model = modelSetting.setting_value;
    } catch { /* use default */ }

    // Generate formatted export
    const result = await generateFormattedExport(markdown, format, outline.title, model);

    // Calculate approximate file size
    const fileSize = new Blob([result.content]).size;

    // Create export record
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

    return new Response(
      JSON.stringify({
        content: result.content,
        mimeType: result.mimeType,
        extension: result.extension,
        title: outline.title,
        fileSize,
        exportId: exportRecord?.id,
      }),
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
