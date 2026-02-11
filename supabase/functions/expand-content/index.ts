import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MODE_PROMPTS: Record<string, string> = {
  expansion: `You are a content expansion expert. Take the section outline and expand it into comprehensive, well-structured content that is 1.5-2x the word count target. Add practical examples, clear explanations, and smooth transitions. Use subheadings, bullet points, and numbered lists where appropriate.`,
  story: `You are a narrative content writer. Take the section outline and weave it into an engaging story-driven format. Integrate real-world case studies, personal anecdotes, and brand narrative. Use storytelling techniques like conflict-resolution, before-after transformations, and emotional hooks while delivering the educational content.`,
  deep_dive: `You are a technical content expert. Take the section outline and create an in-depth, research-backed exploration. Include data points, expert insights, technical details, and thorough analysis. Add citations-style references, comparisons, and nuanced perspectives. Target readers who want comprehensive understanding.`,
  workbook: `You are a practical content designer. Take the section outline and transform it into an interactive workbook format. Include exercises, worksheets, reflection questions, fill-in templates, action checklists, and self-assessment tools. Make it hands-on so readers can immediately apply what they learn.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const { sectionId, mode, brandId, sectionTitle, sectionDescription, subsections, wordCountTarget, brandContext } = await req.json();

    if (!sectionId || !mode || !brandId) throw new Error("Missing required fields: sectionId, mode, brandId");
    if (!MODE_PROMPTS[mode]) throw new Error("Invalid mode. Must be one of: expansion, story, deep_dive, workbook");

    // Look up user's API key
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

    const systemPrompt = MODE_PROMPTS[mode];

    const userPrompt = `
## Section to Expand
**Title:** ${sectionTitle}
**Description:** ${sectionDescription || "No description provided"}
**Subsections:** ${subsections?.length ? subsections.join(", ") : "None specified"}
**Target Word Count:** ${wordCountTarget || 500} words

## Brand Context
**Brand:** ${brandContext?.name || "Unknown"}
**Tone:** ${brandContext?.tone || "professional"}
**Writing Style:** ${brandContext?.writing_style || "short_punchy"}
**About:** ${brandContext?.about || "Not specified"}
**Target Audience:** ${brandContext?.target_audience || "General audience"}

Generate the expanded content now. Write in the brand's voice and tone. Output clean, well-formatted markdown content ready for publication.`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!userApiKey && !LOVABLE_API_KEY) throw new Error("No API key configured");

    let aiResponse: Response;
    if (userApiKey) {
      const geminiModel = userTextModel || "gemini-2.5-flash";
      aiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${userApiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: systemPrompt + "\n\n" + userPrompt }] }],
          }),
        }
      );
    } else {
      aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      });
    }

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errorText);
      throw new Error("AI generation failed");
    }

    const aiData = await aiResponse.json();
    let content: string;
    if (userApiKey) {
      content = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } else {
      content = aiData.choices?.[0]?.message?.content || "";
    }
    const wordCount = content.split(/\s+/).filter(Boolean).length;

    // Check for existing content with same section + mode
    const { data: existing } = await supabase
      .from("expanded_content")
      .select("id, version")
      .eq("outline_section_id", sectionId)
      .eq("mode", mode)
      .eq("user_id", user.id)
      .order("version", { ascending: false })
      .limit(1);

    const nextVersion = existing && existing.length > 0 ? (existing[0].version || 1) + 1 : 1;

    const { data: saved, error: saveError } = await supabase
      .from("expanded_content")
      .insert({
        outline_section_id: sectionId,
        brand_id: brandId,
        user_id: user.id,
        mode,
        content,
        word_count: wordCount,
        tone: brandContext?.tone || "professional",
        style: brandContext?.writing_style || "short_punchy",
        version: nextVersion,
      })
      .select()
      .single();

    if (saveError) {
      console.error("Save error:", saveError);
      throw new Error("Failed to save expanded content");
    }

    return new Response(JSON.stringify({ content: saved }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("expand-content error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
