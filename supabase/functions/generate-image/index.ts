import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateImageRequest {
  brand: {
    name: string;
    primary_color: string;
    secondary_color: string;
    tone: string;
  };
  quote_text?: string;
  style: string;
  image_type: string;
  custom_prompt?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { brand, quote_text, style, image_type, custom_prompt }: GenerateImageRequest = await req.json();

    let prompt = "";

    if (image_type === "quote_card") {
      prompt = `Create a professional Instagram quote card image with the following specifications:
- Brand: ${brand.name}
- Primary color: ${brand.primary_color || "#000000"}
- Secondary color: ${brand.secondary_color || "#ffffff"}
- Tone: ${brand.tone || "professional"}
- Style: ${style}
- Quote text to display: "${quote_text}"

Design requirements:
- Clean, modern ${style} design aesthetic
- The quote text should be prominently displayed and readable
- Use the brand colors harmoniously
- Professional look suitable for Instagram feed
- High contrast for readability
- Include subtle decorative elements that match the ${style} style
- 4:5 portrait format (1080x1350) optimized for Instagram feed
- Ultra high resolution`;
    } else if (image_type === "visual") {
      prompt = `Create a professional branded visual image with the following specifications:
- Brand: ${brand.name}
- Primary color: ${brand.primary_color || "#000000"}
- Secondary color: ${brand.secondary_color || "#ffffff"}
- Tone: ${brand.tone || "professional"}
- Style: ${style}

Design requirements:
- Eye-catching ${style} design
- Abstract or geometric patterns that convey professionalism
- Use the brand colors as the dominant palette
- Perfect for Instagram feed post
- Modern and engaging visual
- 1:1 square format (1080x1080) for Instagram
- Ultra high resolution`;
    } else if (image_type === "banner") {
      prompt = `Create a professional Instagram Story image with the following specifications:
- Brand: ${brand.name}
- Primary color: ${brand.primary_color || "#000000"}
- Secondary color: ${brand.secondary_color || "#ffffff"}
- Style: ${style}

Design requirements:
- 9:16 portrait format (1080x1920) for Instagram Stories
- Professional ${style} design
- Brand colors prominently featured
- Clean and modern aesthetic
- Suitable as an Instagram Story or Reel cover
- Ultra high resolution`;
    } else if (image_type === "book_cover") {
      prompt = `Create a stunning professional book cover design with the following specifications:
- Brand/Author: ${brand.name}
- Primary color: ${brand.primary_color || "#000000"}
- Secondary color: ${brand.secondary_color || "#ffffff"}
- Tone: ${brand.tone || "professional"}
- Style: ${style}
${quote_text ? `- Title text: "${quote_text}"` : ""}

Design requirements:
- Professional book cover layout (6x9 portrait ratio)
- Bold, eye-catching typography for the title
- ${style} aesthetic with premium feel
- Brand colors used as dominant palette
- Suitable for ebook cover or print-ready design
- Include subtle design elements (patterns, gradients, illustrations) matching the ${style} style
- Author name area at the bottom
- High contrast and readable from thumbnail size
- Ultra high resolution`;
    } else if (image_type === "chapter_illustration") {
      prompt = `Create a professional chapter header illustration with the following specifications:
- Brand: ${brand.name}
- Primary color: ${brand.primary_color || "#000000"}
- Secondary color: ${brand.secondary_color || "#ffffff"}
- Tone: ${brand.tone || "professional"}
- Style: ${style}
${quote_text ? `- Chapter theme: "${quote_text}"` : ""}

Design requirements:
- Horizontal banner format (16:9 aspect ratio)
- ${style} illustration style
- Conceptual, abstract representation of the chapter theme
- Brand colors as the dominant palette
- Clean and elegant, suitable as a chapter divider in an ebook or course
- No text in the image, purely visual
- Subtle, sophisticated design elements
- Ultra high resolution`;
    } else if (image_type === "worksheet_bg") {
      prompt = `Create a subtle, professional worksheet background pattern with the following specifications:
- Brand: ${brand.name}
- Primary color: ${brand.primary_color || "#000000"}
- Secondary color: ${brand.secondary_color || "#ffffff"}
- Style: ${style}

Design requirements:
- Portrait format (8.5x11 / letter size ratio)
- Very subtle, light background pattern using brand colors at low opacity
- ${style} design aesthetic
- Must not interfere with overlaid text readability
- Include subtle watermark-style brand elements
- Light, airy feel with plenty of white/light space
- Professional worksheet/workbook page background
- Decorative borders or corner elements are welcome
- Ultra high resolution`;
    } else if (image_type === "social_promo") {
      prompt = `Create a promotional social media graphic for a digital product with the following specifications:
- Brand: ${brand.name}
- Primary color: ${brand.primary_color || "#000000"}
- Secondary color: ${brand.secondary_color || "#ffffff"}
- Tone: ${brand.tone || "professional"}
- Style: ${style}
${quote_text ? `- Product name/tagline: "${quote_text}"` : ""}

Design requirements:
- Square format (1080x1080) for social media
- Eye-catching, scroll-stopping design
- ${style} aesthetic
- Brand colors prominently featured
- Mockup style showing a digital product (ebook, course, template)
- Professional and premium feel
- Clear visual hierarchy
- Ultra high resolution`;
    } else if (custom_prompt) {
      prompt = custom_prompt;
    }

    // Initialize Supabase client to fetch model settings
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the configured model from settings
    let model = "google/gemini-2.5-flash-image-preview";
    try {
      const { data: modelSetting } = await supabase
        .from("ai_settings")
        .select("setting_value")
        .eq("setting_key", "model_image_generation")
        .single();

      if (modelSetting?.setting_value) {
        model = modelSetting.setting_value;
      }
    } catch (err) {
      console.log("Using default model for image generation");
    }

    console.log("Generating image with model:", model, "type:", image_type);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to generate image" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    console.log("AI response received");

    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      console.error("No image URL in response:", data);
      return new Response(
        JSON.stringify({ error: "No image generated" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        image_url: imageUrl,
        prompt: prompt,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating image:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
