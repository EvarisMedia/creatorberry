import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    const { productIdea, brand } = await req.json();
    if (!productIdea || !brand) throw new Error("Missing productIdea or brand");

    const prompt = `You are a professional product outline generator for digital products.

Given this product idea and brand context, create a detailed outline with chapters/sections.

PRODUCT IDEA:
- Title: ${productIdea.title}
- Description: ${productIdea.description}
- Format: ${productIdea.format}
- Target Audience: ${productIdea.target_audience || "General"}

BRAND CONTEXT:
- Name: ${brand.name}
- Niche: ${brand.niche || "General"}
- Tone: ${brand.tone || "professional"}
- About: ${brand.about || ""}

Generate a structured outline with 6-12 sections. Each section should have:
- A clear, compelling title
- A brief description (1-2 sentences)
- 2-5 subsection titles
- An estimated word count target (300-2000 words per section)

Return ONLY valid JSON in this exact format:
{
  "title": "Product title",
  "total_word_count": 15000,
  "sections": [
    {
      "section_number": 1,
      "title": "Section Title",
      "description": "Brief description of what this section covers.",
      "subsections": ["Subsection 1", "Subsection 2", "Subsection 3"],
      "word_count_target": 1500
    }
  ]
}`;

    const aiResponse = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      throw new Error(`AI API error: ${errText}`);
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content || "";
    
    // Extract JSON from response
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No valid JSON in AI response");
    
    const outlineData = JSON.parse(jsonMatch[0]);

    // Create the outline record
    const { data: outline, error: outlineError } = await supabase
      .from("product_outlines")
      .insert({
        product_idea_id: productIdea.id,
        brand_id: brand.id,
        user_id: user.id,
        title: outlineData.title || productIdea.title,
        structure: outlineData,
        total_word_count: outlineData.total_word_count || 0,
        status: "draft",
      })
      .select()
      .single();

    if (outlineError) throw outlineError;

    // Create outline sections
    const sections = (outlineData.sections || []).map((s: any, i: number) => ({
      outline_id: outline.id,
      section_number: s.section_number || i + 1,
      title: s.title,
      description: s.description || "",
      subsections: s.subsections || [],
      word_count_target: s.word_count_target || 500,
      sort_order: i,
    }));

    if (sections.length > 0) {
      const { error: sectionsError } = await supabase
        .from("outline_sections")
        .insert(sections);
      if (sectionsError) throw sectionsError;
    }

    // Update idea status
    await supabase
      .from("product_ideas")
      .update({ status: "outlined" })
      .eq("id", productIdea.id);

    return new Response(JSON.stringify({ outline, sections: outlineData.sections }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error generating outline:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
