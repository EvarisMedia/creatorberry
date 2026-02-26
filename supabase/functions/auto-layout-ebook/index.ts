import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    // Fetch user's API key
    let userApiKey: string | null = null;
    let userTextModel: string | null = null;
    try {
      const { data: keyData } = await supabase
        .from("user_api_keys")
        .select("gemini_api_key, preferred_text_model")
        .eq("user_id", user.id)
        .maybeSingle();
      if (keyData?.gemini_api_key) {
        userApiKey = keyData.gemini_api_key;
        userTextModel = keyData.preferred_text_model;
      }
    } catch (e) { console.log("No user API key found"); }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!userApiKey && !LOVABLE_API_KEY) throw new Error("No API key configured. Please add your Gemini API key in Settings.");

    const { content, pageSize, brandContext, sectionTitle } = await req.json();

    if (!content || !content.trim()) {
      return new Response(JSON.stringify({ error: "No content provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const availableLayouts = [
      { name: "title", description: "Title page with large centered title, subtitle, and optional author name. Use for the very first page of a chapter or book." },
      { name: "chapter-opener", description: "Chapter opener with chapter number/label, title, decorative divider, and intro paragraph. Great for the beginning of a section." },
      { name: "full-text", description: "Clean single-column body text with an optional heading. Best for regular content paragraphs." },
      { name: "text-image", description: "Text on the left (60%) with an image on the right (40%). Use when an image accompanies the text." },
      { name: "image-text", description: "Image on the left (40%) with text on the right (60%). Alternative image+text layout." },
      { name: "full-image", description: "Full-bleed image with optional caption below. Use for standalone images or visual breaks." },
      { name: "two-column", description: "Body text split into two columns with optional heading. Good for dense informational content." },
      { name: "quote", description: "Large centered blockquote with attribution. Use for notable quotes, testimonials, or key statements." },
      { name: "checklist", description: "A heading followed by actionable checklist items. Perfect for workbook exercises or action steps." },
      { name: "key-takeaways", description: "Numbered summary points with a heading. Great for chapter summaries or key lessons." },
      { name: "call-to-action", description: "CTA block with heading, description, and button text. Use at the end of sections to drive action." },
      { name: "blank", description: "Empty page for freeform content. Use sparingly." },
    ];

    const systemPrompt = `You are an expert ebook page layout designer. Given markdown content for a section of an ebook, analyze its structure and assign the best page layout template to each logical page.

Rules:
- Split content into logical pages. Each page should contain a reasonable amount of text (roughly 150-250 words for full-text pages).
- The first page should typically be a "chapter-opener" layout.
- Detect blockquotes and use the "quote" layout for them.
- Detect bullet/numbered lists and use "key-takeaways" or "checklist" layouts.
- If the content references images (markdown image syntax), pair them with adjacent text using "text-image" or "image-text" layouts.
- Long text sections should be split across multiple "full-text" pages.
- End sections with "key-takeaways" or "call-to-action" if appropriate.
- Page size is ${pageSize || "6x9"} inches.
${brandContext?.name ? `- Brand: ${brandContext.name}` : ""}
${brandContext?.tone ? `- Tone: ${brandContext.tone}` : ""}

Available layouts and when to use them:
${availableLayouts.map(l => `- "${l.name}": ${l.description}`).join("\n")}

Section title: "${sectionTitle || "Untitled"}"

Analyze the content and return the optimal page-by-page layout assignment.`;

    const toolDef = {
      name: "design_ebook_pages",
      description: "Return the page-by-page layout design for the ebook section.",
      parameters: {
        type: "object",
        properties: {
          pages: {
            type: "array",
            items: {
              type: "object",
              properties: {
                layout: { type: "string", enum: availableLayouts.map(l => l.name) },
                heading: { type: "string", description: "Page heading or title" },
                subheading: { type: "string", description: "Subtitle, chapter label, or button text for CTA" },
                body: { type: "string", description: "Main body text for this page" },
                image: { type: "string", description: "Image URL if found in content" },
                items: { type: "array", items: { type: "string" }, description: "List items for checklist or key-takeaways layouts" },
                quote: { type: "string", description: "Quote text for quote layout" },
                attribution: { type: "string", description: "Quote attribution or author name" },
              },
              required: ["layout"],
            },
          },
        },
        required: ["pages"],
      },
    };

    let result: any;

    if (userApiKey) {
      // Direct Google API with tool calling
      const geminiModel = userTextModel || "gemini-2.5-flash";
      const googleToolDef = {
        functionDeclarations: [{
          name: toolDef.name,
          description: toolDef.description,
          parameters: toolDef.parameters,
        }],
      };

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${userApiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: systemPrompt + "\n\n" + content }] }],
            tools: [googleToolDef],
            toolConfig: { functionCallingConfig: { mode: "ANY", allowedFunctionNames: ["design_ebook_pages"] } },
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const errText = await response.text();
        console.error("Google API error:", response.status, errText);
        throw new Error(`AI generation failed: ${response.status}`);
      }

      const data = await response.json();
      const functionCall = data.candidates?.[0]?.content?.parts?.find((p: any) => p.functionCall);
      if (!functionCall?.functionCall?.args) {
        throw new Error("No structured output from AI");
      }
      result = functionCall.functionCall.args;
    } else {
      // Lovable gateway fallback
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content },
          ],
          tools: [{
            type: "function",
            function: toolDef,
          }],
          tool_choice: { type: "function", function: { name: "design_ebook_pages" } },
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "AI credits required. Please add credits to continue." }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const errText = await response.text();
        console.error("AI gateway error:", response.status, errText);
        throw new Error(`AI gateway error: ${response.status}`);
      }

      const data = await response.json();
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall?.function?.arguments) {
        throw new Error("No structured output from AI");
      }
      result = JSON.parse(toolCall.function.arguments);
    }

    return new Response(JSON.stringify({ pages: result.pages || [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("auto-layout-ebook error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
