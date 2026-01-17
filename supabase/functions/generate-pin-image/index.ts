import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PinImageRequest {
  headline: string;
  subheadline?: string;
  layoutStyle: string;
  brandContext: {
    name: string;
    primaryColor?: string;
    secondaryColor?: string;
    pinDesignStyle?: string;
    logoWatermark?: boolean;
  };
  pinType: string;
  keywords?: string[];
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

    const body: PinImageRequest = await req.json();
    const {
      headline,
      subheadline,
      layoutStyle,
      brandContext,
      pinType,
      keywords,
    } = body;

    console.log("Generating pin image for:", headline);

    // Build a detailed prompt for Pinterest pin image
    const designStyles: Record<string, string> = {
      minimal: "Clean minimal design with lots of white space, simple typography, elegant and sophisticated",
      "bold-text": "Bold large typography as the main focus, high contrast colors, impactful text-forward design",
      lifestyle: "Lifestyle photography style with text overlay, warm and inviting, aspirational imagery",
      infographic: "Data visualization style, icons and graphics, organized layout with clear hierarchy",
      product: "Product showcase style, clean background, professional product photography aesthetic",
    };

    const pinTypeStyles: Record<string, string> = {
      blog: "Educational blog pin style, readable text, professional look that drives clicks",
      product: "Product pin with showcase focus, benefits highlighted, shop-ready aesthetic",
      idea: "Idea pin style, engaging and scroll-stopping, storytelling visual",
      infographic: "Infographic style with data points, organized sections, easy to scan",
      listicle: "List-based design with numbered points or bullet style visuals",
      comparison: "Before/after or versus style comparison layout",
    };

    const colorInstructions = brandContext.primaryColor 
      ? `Use ${brandContext.primaryColor} as the primary accent color. ${brandContext.secondaryColor ? `Use ${brandContext.secondaryColor} as secondary color.` : ""}`
      : "Use warm, engaging colors suitable for Pinterest.";

    const imagePrompt = `Create a Pinterest pin image in 2:3 vertical aspect ratio (1000x1500 pixels).

DESIGN REQUIREMENTS:
- ${designStyles[layoutStyle] || designStyles.minimal}
- ${pinTypeStyles[pinType] || pinTypeStyles.blog}

HEADLINE TEXT TO DISPLAY:
"${headline}"
${subheadline ? `\nSUBHEADLINE: "${subheadline}"` : ""}

BRAND STYLING:
- Brand: ${brandContext.name}
- ${colorInstructions}
- Style: ${brandContext.pinDesignStyle || "Modern and professional"}
${brandContext.logoWatermark ? "- Include subtle brand watermark in corner" : ""}

PINTEREST OPTIMIZATION:
- Text must be large and readable on mobile
- High contrast for accessibility
- Eye-catching design that stops the scroll
- Professional quality suitable for Pinterest
${keywords?.length ? `- Visual theme inspired by: ${keywords.slice(0, 3).join(", ")}` : ""}

Create a beautiful, pin-worthy image that will drive engagement and clicks on Pinterest.`;

    console.log("Sending prompt to Lovable AI...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: imagePrompt,
          },
        ],
        modalities: ["image", "text"],
      }),
    });

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
    console.log("AI response received");

    // Extract image from response
    const message = data.choices?.[0]?.message;
    const imageData = message?.images?.[0]?.image_url?.url;

    if (!imageData) {
      console.error("No image in response:", JSON.stringify(data));
      throw new Error("No image generated");
    }

    // Upload to Supabase Storage
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Convert base64 to blob
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    const fileName = `pin-${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
    const filePath = `pin-images/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("generated-images")
      .upload(filePath, imageBuffer, {
        contentType: "image/png",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      // Return the base64 if upload fails
      return new Response(
        JSON.stringify({ 
          imageUrl: imageData,
          isBase64: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("generated-images")
      .getPublicUrl(filePath);

    console.log("Image uploaded successfully:", urlData.publicUrl);

    return new Response(
      JSON.stringify({ 
        imageUrl: urlData.publicUrl,
        isBase64: false,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-pin-image:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
