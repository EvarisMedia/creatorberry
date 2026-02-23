import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

async function generateEmbedding(text: string, model: string, userApiKey?: string | null): Promise<number[]> {
  let response: Response;

  if (userApiKey) {
    // Direct Google API
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model.replace("google/", "")}:generateContent?key=${userApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: `You are an embedding generator. Analyze the given text and output exactly 768 floating-point numbers between -1 and 1 that represent its semantic meaning.

Rules:
- Output ONLY the numbers separated by commas
- No other text, explanations, or formatting
- Exactly 768 numbers
- Each number between -1.0 and 1.0
- Similar texts should produce similar number patterns

Text to embed:
${text.substring(0, 2000)}` }] }],
          generationConfig: { temperature: 0.1 },
        }),
      }
    );

    if (!response.ok) {
      console.error("Google API error:", response.status);
      throw new Error("Failed to generate embedding");
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return parseEmbeddingNumbers(content);
  } else {
    // Lovable gateway fallback
    response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "system",
            content: `You are an embedding generator. Analyze the given text and output exactly 768 floating-point numbers between -1 and 1 that represent its semantic meaning.

Rules:
- Output ONLY the numbers separated by commas
- No other text, explanations, or formatting
- Exactly 768 numbers
- Each number between -1.0 and 1.0
- Similar texts should produce similar number patterns
- Consider: topic, sentiment, style, intent, keywords

Focus on capturing:
- Main topic/subject (positions 0-100)
- Writing style/tone (positions 101-200)
- Emotional valence (positions 201-300)
- Specificity level (positions 301-400)
- Action orientation (positions 401-500)
- Domain/industry (positions 501-600)
- Structural patterns (positions 601-700)
- Semantic associations (positions 701-767)`
          },
          {
            role: "user",
            content: text.substring(0, 2000)
          }
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      console.error("AI Gateway error:", response.status);
      throw new Error("Failed to generate embedding");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    return parseEmbeddingNumbers(content);
  }
}

function parseEmbeddingNumbers(content: string): number[] {
  const numbers = content
    .replace(/[\[\]\s\n]/g, "")
    .split(",")
    .map((n: string) => parseFloat(n.trim()))
    .filter((n: number) => !isNaN(n));

  if (numbers.length < 768) {
    while (numbers.length < 768) numbers.push(0);
  } else if (numbers.length > 768) {
    numbers.length = 768;
  }

  return numbers.map((n: number) => Math.max(-1, Math.min(1, n)));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth + BYOK
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    // Fetch user's API key
    let userApiKey: string | null = null;
    try {
      const { data: keyData } = await supabase
        .from("user_api_keys")
        .select("gemini_api_key")
        .eq("user_id", user.id)
        .maybeSingle();
      if (keyData?.gemini_api_key) {
        userApiKey = keyData.gemini_api_key;
      }
    } catch (e) { console.log("No user API key found"); }

    if (!userApiKey && !LOVABLE_API_KEY) {
      throw new Error("No API key configured. Please add your Gemini API key in Settings.");
    }

    const { text, texts } = await req.json();

    // Fetch the configured model from settings
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
    let model = "google/gemini-2.5-flash-lite";
    try {
      const { data: modelSetting } = await serviceClient
        .from("ai_settings")
        .select("setting_value")
        .eq("setting_key", "model_embeddings")
        .single();
      
      if (modelSetting?.setting_value) {
        model = modelSetting.setting_value;
      }
    } catch (err) {
      console.log("Using default model for embeddings");
    }

    if (text) {
      console.log("Generating embedding with model:", model, "text length:", text.length, "using user key:", !!userApiKey);
      const embedding = await generateEmbedding(text, model, userApiKey);
      
      return new Response(
        JSON.stringify({ embedding }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (texts && Array.isArray(texts)) {
      console.log("Generating embeddings for batch, count:", texts.length, "using user key:", !!userApiKey);
      const embeddings: number[][] = [];
      
      for (const t of texts) {
        const embedding = await generateEmbedding(t, model, userApiKey);
        embeddings.push(embedding);
      }
      
      return new Response(
        JSON.stringify({ embeddings }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error("Either 'text' or 'texts' must be provided");
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Embedding error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
