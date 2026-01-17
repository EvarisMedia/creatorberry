import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

// Generate a semantic embedding using AI
// We use the model to create a consistent vector representation of text
async function generateEmbedding(text: string, model: string): Promise<number[]> {
  // Use the AI model to generate a semantic fingerprint
  // We'll ask it to analyze the text and return numerical features
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
          content: text.substring(0, 2000) // Limit input size
        }
      ],
      temperature: 0.1, // Low temperature for consistency
    }),
  });

  if (!response.ok) {
    console.error("AI Gateway error:", response.status);
    throw new Error("Failed to generate embedding");
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";
  
  // Parse the comma-separated numbers
  const numbers = content
    .replace(/[\[\]\s\n]/g, "")
    .split(",")
    .map((n: string) => parseFloat(n.trim()))
    .filter((n: number) => !isNaN(n));

  // Ensure we have exactly 768 dimensions
  if (numbers.length < 768) {
    // Pad with zeros if needed
    while (numbers.length < 768) {
      numbers.push(0);
    }
  } else if (numbers.length > 768) {
    numbers.length = 768;
  }

  // Normalize to [-1, 1] range
  const normalized = numbers.map((n: number) => Math.max(-1, Math.min(1, n)));
  
  return normalized;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { text, texts } = await req.json();

    // Initialize Supabase client to fetch model settings
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the configured model from settings
    let model = "google/gemini-2.5-flash-lite"; // default
    try {
      const { data: modelSetting } = await supabase
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

    // Handle single text or batch of texts
    if (text) {
      console.log("Generating embedding with model:", model, "text length:", text.length);
      const embedding = await generateEmbedding(text, model);
      
      return new Response(
        JSON.stringify({ embedding }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (texts && Array.isArray(texts)) {
      console.log("Generating embeddings for batch with model:", model, "count:", texts.length);
      const embeddings: number[][] = [];
      
      for (const t of texts) {
        const embedding = await generateEmbedding(t, model);
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
