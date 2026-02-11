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
    const { messages, brandContext, currentPage, productContext } = await req.json();

    const apiKey = Deno.env.get("LOVABLE_API_KEY");

    // Try to get user's own Gemini key
    let userApiKey: string | null = null;
    let userTextModel: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
        const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
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

    if (!userApiKey && !apiKey) {
      throw new Error("No API key configured");
    }

    // Build system prompt with context
    let systemPrompt = `You are the AI Copilot for Creator OS, a platform that helps content creators build, validate, and publish digital products. You are helpful, concise, and action-oriented.

Your capabilities:
- Help brainstorm product ideas and validate them
- Suggest improvements to outlines and content
- Provide copywriting tips for sales pages
- Help with marketing strategy and launch planning
- Answer questions about the platform features
- Provide writing tips and content optimization advice

Be concise but thorough. Use bullet points when listing items. Always be encouraging and practical.`;

    if (brandContext) {
      systemPrompt += `\n\nCurrent Brand Context:
- Brand Name: ${brandContext.name}
- Niche: ${brandContext.niche || "Not specified"}
- Target Audience: ${brandContext.target_audience || "Not specified"}
- Tone: ${brandContext.tone || "professional"}
- About: ${brandContext.about || "Not specified"}
- Offers/Services: ${brandContext.offers_services || "Not specified"}`;
    }

    if (currentPage) {
      systemPrompt += `\n\nThe user is currently on the "${currentPage}" page of the platform.`;
    }

    if (productContext) {
      systemPrompt += `\n\nProduct Context:
- Product Title: ${productContext.title || "N/A"}
- Product Format: ${productContext.format || "N/A"}
- Description: ${productContext.description || "N/A"}`;
    }

    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    let response: Response;
    if (userApiKey) {
      const geminiModel = userTextModel || "gemini-2.5-flash";
      const combinedText = apiMessages.map((m: any) => `[${m.role}]: ${m.content}`).join("\n\n");
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${userApiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: combinedText }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 1500 },
          }),
        }
      );
    } else {
      response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: apiMessages,
          temperature: 0.7,
          max_tokens: 1500,
        }),
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", errorText);
      throw new Error(`AI API returned ${response.status}`);
    }

    const data = await response.json();
    let reply: string;
    if (userApiKey) {
      reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't generate a response. Please try again.";
    } else {
      reply = data.choices?.[0]?.message?.content || "I'm sorry, I couldn't generate a response. Please try again.";
    }

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Copilot chat error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to process chat" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
