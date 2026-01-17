import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CarouselSlide {
  slideNumber: number;
  headline: string;
  content: string;
  visualSuggestion?: string;
}

interface GenerateRequest {
  slides: CarouselSlide[];
  brand: {
    id: string;
    name: string;
    primary_color?: string;
    secondary_color?: string;
  };
  style: 'infographic' | 'slide_deck' | 'quote_card';
  postId?: string;
}

// Save a single image to the library
async function saveImageToLibrary(
  supabase: any,
  userId: string,
  brandId: string,
  postId: string | null,
  imageUrl: string,
  slideNumber: number,
  headline: string,
  style: string
): Promise<string | null> {
  try {
    // Extract base64 data
    const base64Match = imageUrl.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!base64Match) {
      console.error(`[Library] Invalid image format for slide ${slideNumber}`);
      return null;
    }
    
    const imageType = base64Match[1];
    const base64Data = base64Match[2];
    const buffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    const fileName = `${userId}/${brandId}/carousel_slide_${slideNumber}_${Date.now()}.${imageType}`;
    
    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('carousel-images')
      .upload(fileName, buffer, { contentType: `image/${imageType}` });
    
    if (uploadError) {
      console.error(`[Library] Upload error for slide ${slideNumber}:`, uploadError);
      return null;
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('carousel-images')
      .getPublicUrl(fileName);
    
    // Insert into generated_images table
    const { error: insertError } = await supabase.from('generated_images').insert({
      user_id: userId,
      brand_id: brandId,
      post_id: postId,
      image_url: publicUrl,
      image_type: 'carousel_slide',
      style: style,
      prompt: `Carousel slide ${slideNumber}: ${headline}`,
      quote_text: headline,
    });
    
    if (insertError) {
      console.error(`[Library] Insert error for slide ${slideNumber}:`, insertError);
      return null;
    }
    
    console.log(`[Library] Saved slide ${slideNumber} to library: ${publicUrl}`);
    return publicUrl;
  } catch (err) {
    console.error(`[Library] Error saving slide ${slideNumber}:`, err);
    return null;
  }
}

// Background processing function
async function processSlides(
  supabase: any,
  jobId: string,
  userId: string,
  brandId: string,
  postId: string | null,
  slides: CarouselSlide[],
  brand: { name: string; primary_color?: string; secondary_color?: string },
  style: string,
  lovableApiKey: string
) {
  console.log(`[Job ${jobId}] Starting background processing of ${slides.length} slides`);
  
  try {
    // Update status to processing
    await supabase.from('carousel_jobs').update({ 
      status: 'processing',
      updated_at: new Date().toISOString()
    }).eq('id', jobId);

    const primaryColor = brand.primary_color || '#3B82F6';
    const secondaryColor = brand.secondary_color || '#10B981';
    const totalSlides = slides.length;
    const generatedImages: { slideNumber: number; imageUrl: string }[] = [];

    const styleInstructions: Record<string, string> = {
      infographic: `
        - Modern infographic design with clean geometric shapes and icons
        - Use visual hierarchy with large headline at top
        - Include relevant icons or simple illustrations for the content
        - Use data visualization elements where appropriate
        - Clean grid-based layout with ample white space
        - Professional business presentation style
      `,
      slide_deck: `
        - Professional slide deck style with bold typography
        - Large headline text prominently displayed
        - Minimalist design with focused content
        - Subtle background gradient or pattern
        - Clean corporate presentation aesthetic
      `,
      quote_card: `
        - Elegant quote card design with decorative elements
        - Large quotation marks or decorative borders
        - Centered text layout with emphasis on headline
        - Artistic background texture or gradient
        - Inspirational and shareable social media style
      `,
    };

    for (const slide of slides) {
      console.log(`[Job ${jobId}] Generating image for slide ${slide.slideNumber} of ${totalSlides}`);

      const prompt = `Create a professional LinkedIn carousel slide image with these specifications:

SLIDE INFORMATION:
- Slide ${slide.slideNumber} of ${totalSlides}
- Headline: "${slide.headline}"
- Content: "${slide.content}"
${slide.visualSuggestion ? `- Visual suggestion: "${slide.visualSuggestion}"` : ''}

BRAND:
- Brand name: ${brand.name}
- Primary color: ${primaryColor}
- Secondary color: ${secondaryColor}

STYLE: ${style.toUpperCase()}
${styleInstructions[style] || styleInstructions.infographic}

DESIGN REQUIREMENTS:
- Dimensions: 1080x1350 pixels (4:5 ratio for LinkedIn carousel)
- Include slide number indicator (${slide.slideNumber}/${totalSlides}) in corner
- Use brand colors for accents and key elements
- Ensure text is large and readable
- High contrast for accessibility
- Professional and polished finish
- Ultra high resolution`;

      try {
        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-3-pro-image-preview',
            messages: [{ role: 'user', content: prompt }],
            modalities: ['image', 'text'],
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[Job ${jobId}] AI API error for slide ${slide.slideNumber}:`, response.status, errorText);
          
          if (response.status === 429) {
            // Rate limit - mark job as failed
            await supabase.from('carousel_jobs').update({
              status: 'failed',
              error: 'Rate limit exceeded. Please try again later.',
              updated_at: new Date().toISOString()
            }).eq('id', jobId);
            return;
          }
          
          if (response.status === 402) {
            await supabase.from('carousel_jobs').update({
              status: 'failed',
              error: 'AI credits exhausted. Please add credits to continue.',
              updated_at: new Date().toISOString()
            }).eq('id', jobId);
            return;
          }
          
          // Add empty placeholder for failed slide and continue
          generatedImages.push({ slideNumber: slide.slideNumber, imageUrl: '' });
        } else {
          const data = await response.json();
          const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

          if (imageUrl) {
            // Save to library immediately
            const libraryUrl = await saveImageToLibrary(
              supabase,
              userId,
              brandId,
              postId,
              imageUrl,
              slide.slideNumber,
              slide.headline,
              style
            );
            
            // Use library URL if saved, otherwise use original base64
            const finalUrl = libraryUrl || imageUrl;
            generatedImages.push({ slideNumber: slide.slideNumber, imageUrl: finalUrl });
            console.log(`[Job ${jobId}] Successfully generated slide ${slide.slideNumber}${libraryUrl ? ' (saved to library)' : ''}`);
          } else {
            console.error(`[Job ${jobId}] No image URL in response for slide ${slide.slideNumber}`);
            generatedImages.push({ slideNumber: slide.slideNumber, imageUrl: '' });
          }
        }

        // Update progress after each slide
        await supabase.from('carousel_jobs').update({
          completed_slides: generatedImages.length,
          generated_images: generatedImages,
          updated_at: new Date().toISOString()
        }).eq('id', jobId);

        // Small delay between requests to avoid rate limits
        if (slide.slideNumber < totalSlides) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (slideError) {
        console.error(`[Job ${jobId}] Error generating slide ${slide.slideNumber}:`, slideError);
        generatedImages.push({ slideNumber: slide.slideNumber, imageUrl: '' });
        
        // Update progress even on error
        await supabase.from('carousel_jobs').update({
          completed_slides: generatedImages.length,
          generated_images: generatedImages,
          updated_at: new Date().toISOString()
        }).eq('id', jobId);
      }
    }

    const successCount = generatedImages.filter(img => img.imageUrl).length;
    console.log(`[Job ${jobId}] Completed: ${successCount} of ${totalSlides} images generated`);

    // Mark job as completed with retry logic
    const updateComplete = async (retries = 3) => {
      for (let i = 0; i < retries; i++) {
        const { error } = await supabase.from('carousel_jobs').update({
          status: 'completed',
          completed_slides: generatedImages.length,
          generated_images: generatedImages,
          updated_at: new Date().toISOString()
        }).eq('id', jobId);

        if (!error) {
          console.log(`[Job ${jobId}] Successfully marked as completed`);
          return;
        }
        console.error(`[Job ${jobId}] Retry ${i + 1} to mark complete failed:`, error);
        await new Promise(r => setTimeout(r, 1000));
      }
      console.error(`[Job ${jobId}] Failed to mark job as completed after ${retries} retries`);
    };
    
    await updateComplete();

  } catch (error) {
    console.error(`[Job ${jobId}] Fatal error:`, error);
    
    // Retry error update as well
    for (let i = 0; i < 3; i++) {
      const { error: updateError } = await supabase.from('carousel_jobs').update({
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        updated_at: new Date().toISOString()
      }).eq('id', jobId);
      
      if (!updateError) break;
      await new Promise(r => setTimeout(r, 500));
    }
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { slides, brand, style, postId } = await req.json() as GenerateRequest;

    if (!slides || slides.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No slides provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Creating carousel job for user ${user.id}, brand ${brand.id}, ${slides.length} slides`);

    // Create the job record
    const { data: job, error: jobError } = await supabase.from('carousel_jobs').insert({
      user_id: user.id,
      brand_id: brand.id,
      post_id: postId || null,
      status: 'pending',
      total_slides: slides.length,
      completed_slides: 0,
      slides_data: slides,
      generated_images: [],
      style: style
    }).select().single();

    if (jobError) {
      console.error('Failed to create job:', jobError);
      return new Response(
        JSON.stringify({ error: 'Failed to create job' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Created job ${job.id}, starting background processing`);

    // Start background processing using EdgeRuntime.waitUntil
    // @ts-ignore - EdgeRuntime is available in Supabase Edge Functions
    EdgeRuntime.waitUntil(processSlides(
      supabase,
      job.id,
      user.id,
      brand.id,
      postId || null,
      slides,
      brand,
      style,
      LOVABLE_API_KEY
    ));

    // Return immediately with job ID
    return new Response(
      JSON.stringify({ 
        jobId: job.id,
        status: 'pending',
        totalSlides: slides.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-carousel-images:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
