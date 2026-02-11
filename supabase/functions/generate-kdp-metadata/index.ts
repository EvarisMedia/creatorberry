import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

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

    const { outlineId, brandId, action } = await req.json();

    if (!outlineId || !brandId) {
      throw new Error("outlineId and brandId are required");
    }

    // Fetch outline details
    const { data: outline, error: outlineError } = await supabase
      .from("product_outlines")
      .select("*")
      .eq("id", outlineId)
      .eq("user_id", user.id)
      .single();

    if (outlineError || !outline) throw new Error("Outline not found");

    // Fetch brand for context
    const { data: brand } = await supabase
      .from("brands")
      .select("name, niche, target_audience, about")
      .eq("id", brandId)
      .single();

    // Fetch sections for content context
    const { data: sections } = await supabase
      .from("outline_sections")
      .select("title, description")
      .eq("outline_id", outlineId)
      .order("sort_order", { ascending: true });

    const sectionTitles = (sections || []).map((s: any) => s.title).join(", ");

    // Fetch AI model
    let model = "google/gemini-2.5-flash";
    try {
      const { data: modelSetting } = await supabase
        .from("ai_settings")
        .select("setting_value")
        .eq("setting_key", "model_content")
        .single();
      if (modelSetting?.setting_value) model = modelSetting.setting_value;
    } catch { /* use default */ }

    const systemPrompt = `You are an Amazon KDP publishing expert. You help authors optimize their book metadata for maximum discoverability and sales on Amazon Kindle Direct Publishing.

Book context:
- Title: ${outline.title}
- Brand/Author: ${brand?.name || "Unknown"}
- Niche: ${brand?.niche || "General"}
- Target Audience: ${brand?.target_audience || "General readers"}
- About: ${brand?.about || ""}
- Chapters: ${sectionTitles}

You must respond using the provided tool/function format.`;

    if (action === "generate_metadata") {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: `Generate optimized Amazon KDP metadata for this book. Include:
1. An SEO-optimized title (compelling, keyword-rich, under 200 chars)
2. A subtitle that adds keywords not in the title
3. A compelling book description (4000 chars max, with HTML formatting for Amazon)
4. Exactly 7 backend keywords (each under 50 chars, no commas within keywords)
5. 2 recommended BISAC categories
6. Recommended royalty tier (35% or 70%) with reasoning
7. Suggested ebook price and print price`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "kdp_metadata",
                description: "Return optimized KDP metadata",
                parameters: {
                  type: "object",
                  properties: {
                    title: { type: "string", description: "SEO-optimized book title" },
                    subtitle: { type: "string", description: "Keyword-rich subtitle" },
                    description: { type: "string", description: "Book description with HTML formatting" },
                    keywords: {
                      type: "array",
                      items: { type: "string" },
                      description: "Exactly 7 backend keywords",
                    },
                    categories: {
                      type: "array",
                      items: { type: "string" },
                      description: "2 BISAC categories",
                    },
                    royalty_tier: { type: "string", enum: ["35", "70"] },
                    royalty_reasoning: { type: "string" },
                    ebook_price: { type: "number" },
                    print_price: { type: "number" },
                  },
                  required: ["title", "subtitle", "description", "keywords", "categories", "royalty_tier", "royalty_reasoning", "ebook_price", "print_price"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "kdp_metadata" } },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("AI error:", response.status, errText);
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error("AI generation failed");
      }

      const data = await response.json();
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall) throw new Error("No metadata generated");

      const metadata = JSON.parse(toolCall.function.arguments);

      return new Response(JSON.stringify({ metadata }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("KDP metadata error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
