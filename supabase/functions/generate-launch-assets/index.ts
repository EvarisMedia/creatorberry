import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const { assetType, productTitle, productDescription, targetAudience, brandContext, customInstructions } = await req.json();

    console.log("Generating launch asset:", assetType, "for:", productTitle);

    const assetPrompts: Record<string, string> = {
      email_sequence: `Generate a 5-email launch sequence for this product. Each email should have:
- subject line (compelling, curiosity-driven)
- preview text
- body (in markdown, 150-300 words)
- purpose (welcome, value, social_proof, urgency, final_cta)

Return JSON: { "emails": [{ "subject": "...", "previewText": "...", "body": "...", "purpose": "...", "sendDay": 1 }] }`,

      social_posts: `Generate 8 platform-specific social media launch posts:
- 2 Twitter/X posts (max 280 chars, with hooks)
- 2 LinkedIn posts (professional, 100-200 words)
- 2 Instagram captions (with emoji, hashtags, 100-150 words)
- 2 TikTok scripts (casual, 30-60 second scripts)

Return JSON: { "posts": [{ "platform": "twitter|linkedin|instagram|tiktok", "content": "...", "hashtags": ["..."], "postType": "announcement|teaser|testimonial|cta" }] }`,

      waitlist_copy: `Generate compelling waitlist/landing page copy including:
- Headline (max 10 words)
- Subheadline (1-2 sentences)
- 3-5 bullet point benefits
- Urgency element
- CTA button text
- Thank you message after signup

Return JSON: { "headline": "...", "subheadline": "...", "benefits": ["..."], "urgencyText": "...", "ctaText": "...", "thankYouMessage": "..." }`,

      podcast_questions: `Generate a podcast/interview launch kit including:
- 60-second elevator pitch for the product
- 8-10 interview questions a host could ask
- Key talking points for each question
- A compelling close/CTA the creator can use

Return JSON: { "elevatorPitch": "...", "questions": [{ "question": "...", "talkingPoints": ["..."] }], "closingCta": "..." }`,
    };

    const systemPrompt = `You are an expert launch marketing strategist. Create compelling, conversion-focused marketing materials.

BRAND: ${brandContext?.name || "Creator"}
TONE: ${brandContext?.tone || "Professional yet approachable"}
ABOUT: ${brandContext?.about || "Digital product creator"}
${customInstructions ? `SPECIAL INSTRUCTIONS: ${customInstructions}` : ""}`;

    const userPrompt = `Create ${assetType.replace(/_/g, " ")} for this product launch:

PRODUCT: ${productTitle}
DESCRIPTION: ${productDescription || "A digital product"}
TARGET AUDIENCE: ${targetAudience || "Content creators and entrepreneurs"}

${assetPrompts[assetType] || assetPrompts.social_posts}`;

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
        return new Response(JSON.stringify({ error: "Rate limit exceeded." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error: ${response.status}`);
    }

    const data = await response.json();
    let content: string;
    if (userApiKey) {
      content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } else {
      content = data.choices?.[0]?.message?.content || '';
    }
    if (!content) throw new Error("No content from AI");

    let result;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      result = JSON.parse(jsonMatch[1].trim());
    } catch {
      console.error("Parse error:", content);
      throw new Error("Failed to parse response");
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-launch-assets:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
