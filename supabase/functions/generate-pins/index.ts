import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PinGenerationRequest {
  sourceContent: string;
  sourceName: string;
  sourceUrl?: string;
  pinType: string;
  brandContext: {
    name: string;
    niche?: string;
    primaryKeywords?: string[];
    pinDesignStyle?: string;
    targetAudience?: string;
  };
  boardKeywords?: string[];
  numberOfVariations: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    // Look up user's API key from auth header
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

    const body: PinGenerationRequest = await req.json();
    const {
      sourceContent,
      sourceName,
      sourceUrl,
      pinType,
      brandContext,
      boardKeywords,
      numberOfVariations,
    } = body;

    console.log("Generating pins for:", sourceName, "Type:", pinType);

    const systemPrompt = `You are an expert Pinterest SEO strategist and copywriter. Your job is to create highly optimized Pinterest pins that drive traffic and engagement.

BRAND CONTEXT:
- Brand Name: ${brandContext.name}
- Niche: ${brandContext.niche || "General"}
- Target Audience: ${brandContext.targetAudience || "General audience"}
- Primary Keywords: ${brandContext.primaryKeywords?.join(", ") || "None specified"}
- Design Style: ${brandContext.pinDesignStyle || "Modern and clean"}

PINTEREST SEO BEST PRACTICES:
1. Titles should be 40-100 characters, front-load keywords
2. Descriptions should be 100-500 characters with natural keyword placement
3. Include 5-10 relevant keyword tags
4. Use action words and emotional triggers
5. Include numbers and specific benefits when possible
6. Write for search intent - what would someone search to find this?

PIN TYPES TO CONSIDER:
- blog: Educational content driving to blog posts
- product: Product showcases with benefits
- idea: Multi-slide storytelling pins
- infographic: Data-driven visual content
- listicle: List-based valuable content
- comparison: Before/after or vs content`;

    const userPrompt = `Generate ${numberOfVariations} unique Pinterest pin variations for this content.

SOURCE: ${sourceName}
${sourceUrl ? `URL: ${sourceUrl}` : ""}
PIN TYPE: ${pinType}
${boardKeywords?.length ? `BOARD KEYWORDS: ${boardKeywords.join(", ")}` : ""}

CONTENT TO TRANSFORM:
${sourceContent}

For each variation, create:
1. SEO-optimized title (40-100 chars, keyword-rich)
2. Long-tail description (100-500 chars, natural keywords, CTA)
3. 5-10 keyword tags for Pinterest search
4. Suggested CTA type (save, click, shop, learn)
5. Headline for the pin image (short, punchy, 5-10 words)
6. Layout style suggestion (minimal, bold-text, lifestyle, infographic)

Return as JSON array with this structure:
{
  "pins": [
    {
      "title": "SEO optimized title here",
      "description": "Long-tail Pinterest description with keywords and CTA",
      "keywords": ["keyword1", "keyword2", ...],
      "ctaType": "click",
      "headline": "Short punchy headline for image",
      "layoutStyle": "bold-text",
      "seoScore": 85
    }
  ]
}`;

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
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      });
    }

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
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

    // Parse the JSON response
    let pins;
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      const jsonStr = jsonMatch[1].trim();
      const parsed = JSON.parse(jsonStr);
      pins = parsed.pins || parsed;
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse pin generation response");
    }

    console.log("Generated", pins.length, "pin variations");

    return new Response(
      JSON.stringify({ pins, sourceUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-pins:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
