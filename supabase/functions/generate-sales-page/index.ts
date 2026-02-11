import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SalesPageRequest {
  framework: "pas" | "aida" | "custom";
  productTitle: string;
  productDescription: string;
  targetAudience: string;
  brandContext: {
    name: string;
    tone?: string;
    about?: string;
    offers_services?: string;
  };
  customInstructions?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    // Look up user's API key
    let userApiKey: string | null = null;
    let userTextModel: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
        const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
        const userClient = createClient(supabaseUrl, anonKey, {
          global: { headers: { Authorization: authHeader } },
        });
        const { data: { user } } = await userClient.auth.getUser();
        if (user) {
          const supabase = createClient(supabaseUrl, supabaseServiceKey);
          const { data: keyData } = await supabase
            .from("user_api_keys")
            .select("gemini_api_key, preferred_text_model")
            .eq("user_id", user.id)
            .maybeSingle();
          if (keyData?.gemini_api_key) {
            userApiKey = keyData.gemini_api_key;
            userTextModel = keyData.preferred_text_model;
          }
        }
      } catch (e) { console.log("No user API key found"); }
    }

    if (!userApiKey && !LOVABLE_API_KEY) {
      throw new Error("No API key configured");
    }

    const body: SalesPageRequest = await req.json();
    const { framework, productTitle, productDescription, targetAudience, brandContext, customInstructions } = body;

    console.log("Generating sales page:", productTitle, "Framework:", framework);

    const frameworkInstructions: Record<string, string> = {
      pas: `Use the PAS (Problem-Agitate-Solution) framework:
1. PROBLEM: Identify the core pain point the target audience faces
2. AGITATE: Amplify the emotional impact of the problem — what happens if they don't solve it
3. SOLUTION: Present the product as the clear, compelling solution
Structure sections: Hero (problem hook), Pain Points, Agitation, Solution Reveal, Benefits, Social Proof, FAQ, CTA`,
      aida: `Use the AIDA (Attention-Interest-Desire-Action) framework:
1. ATTENTION: A bold, scroll-stopping headline and subheadline
2. INTEREST: Engage with fascinating details, stats, or stories
3. DESIRE: Create emotional and logical desire with benefits and transformation
4. ACTION: Clear, urgent call-to-action
Structure sections: Hero (attention), Interest Builder, Desire/Benefits, Transformation, Testimonials, FAQ, CTA`,
      custom: `Create a hybrid sales page using best practices from multiple frameworks.
${customInstructions || "Focus on storytelling and transformation."}
Structure sections: Hero, Story/Context, Problem, Solution, Benefits, How It Works, Testimonials, FAQ, CTA`,
    };

    const systemPrompt = `You are an expert direct-response copywriter specializing in digital product sales pages. Write compelling, conversion-optimized copy.

BRAND CONTEXT:
- Brand: ${brandContext.name}
- Tone: ${brandContext.tone || "Professional"}
- About: ${brandContext.about || "Not specified"}
- Services: ${brandContext.offers_services || "Digital products"}

WRITING RULES:
- Write in second person ("you")
- Use power words and emotional triggers
- Include specific benefits, not just features
- Keep paragraphs short (2-3 sentences max)
- Use bullet points for scanability
- Include objection-handling in FAQ section`;

    const userPrompt = `Generate a complete sales page for this product:

PRODUCT: ${productTitle}
DESCRIPTION: ${productDescription}
TARGET AUDIENCE: ${targetAudience}

FRAMEWORK: ${framework.toUpperCase()}
${frameworkInstructions[framework]}

Return as JSON with this structure:
{
  "headline": "Main headline (max 15 words, powerful)",
  "subheadline": "Supporting subheadline (1-2 sentences)",
  "sections": [
    {
      "type": "hero|problem|agitation|solution|benefits|how_it_works|testimonials|faq|cta|story|transformation",
      "title": "Section title",
      "content": "Full section content in markdown format",
      "order": 1
    }
  ],
  "ctaText": "Primary CTA button text",
  "ctaSecondary": "Secondary CTA text (optional)"
}

Generate 6-9 sections. Make the copy compelling and specific to the product.`;

    let response: Response;
    if (userApiKey) {
      const geminiModel = userTextModel || "gemini-2.5-flash";
      response = await fetch(
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
      response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI error:", response.status, errorText);
      throw new Error(`AI error: ${response.status}`);
    }

    const data = await response.json();
    let content: string;
    if (userApiKey) {
      content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } else {
      content = data.choices?.[0]?.message?.content || '';
    }

    if (!content) {
      throw new Error("No content received from AI");
    }

    let salesPage;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      salesPage = JSON.parse(jsonMatch[1].trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse sales page response");
    }

    console.log("Generated sales page with", salesPage.sections?.length || 0, "sections");

    return new Response(JSON.stringify(salesPage), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-sales-page:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
