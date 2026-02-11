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
    if (!apiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
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

    const response = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-5-mini",
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", errorText);
      throw new Error(`AI API returned ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "I'm sorry, I couldn't generate a response. Please try again.";

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
