import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// All 12 post types with detailed prompts for Instagram
const POST_TYPE_PROMPTS: Record<string, string> = {
  educational_breakdown: "Create an educational Instagram post that teaches a key concept. Use bullet points or numbered lists. Perfect for carousels or caption-based teaching. Start with the problem, then provide the solution with clear actionable steps.",
  opinion_contrarian: "Create a bold, hot take post that challenges conventional wisdom in your niche. Be provocative but back it up with reasoning. These posts get high engagement through comments and debate.",
  founder_story: "Create a behind-the-scenes or personal story post. Share a real experience, failure, or day-in-the-life moment. Be vulnerable and authentic. These humanize your brand and drive saves.",
  case_study: "Create a transformation/results post showing before and after. Use specific numbers and visual descriptions. Make it compelling and credible. Perfect for carousels.",
  framework_post: "Create a signature framework post. Present a unique methodology or system with a memorable name. Break it into clear steps or pillars. Perfect for carousel format.",
  trend_reaction: "Create a trend reaction post that analyzes a current trending topic, audio, or format on Instagram. Share your unique perspective. Be timely and relatable.",
  lesson_learned: "Create a lesson learned post from a specific experience. Be honest about mistakes. Provide actionable wisdom others can apply. These get high saves.",
  how_to_tactical: "Create a step-by-step tutorial post. Be specific and actionable. Number each step clearly. Include tips and common mistakes to avoid. Perfect for Reels or carousels.",
  myth_busting: "Create a myth-busting post that debunks a common misconception in your niche. Start with the myth, explain why people believe it, then reveal the truth. Great for engagement.",
  future_prediction: "Create a forward-looking prediction post about trends in your industry. Share bold but reasoned predictions. Explain what signals you're seeing.",
  listicle: "Create a numbered list post (5-10 items) with valuable insights. Each item should be a standalone piece of wisdom. Make each point punchy and saveable.",
  quick_tip: "Create a single, powerful actionable tip that followers can implement immediately. Keep it focused and practical. Perfect for Reels or quick carousel.",
};

// Media format guidelines for Instagram AI
const MEDIA_FORMAT_GUIDELINES: Record<string, string> = {
  text_only: "Write a caption-only feed post optimized for Instagram. Focus on compelling copy with strategic line breaks and emojis. Include relevant hashtag suggestions at the end.",
  with_image: "Write a caption designed to accompany a visual image post. Reference or describe what the image should show. The CTA can mention 'double tap' or 'save this'.",
  carousel: `Generate an Instagram carousel post with individual slides. Each carousel should have 5-10 slides optimized for 1080x1350 (4:5 ratio).
Structure your response to include a "carouselSlides" array with each slide containing:
- slideNumber: The slide order (1, 2, 3...)
- headline: A bold, short headline for the slide (max 8 words)
- content: The main text content for the slide (2-3 sentences max, optimized for visual reading)
- visualSuggestion: Brief description of what visual/graphic would work for this slide

Slide structure:
- Slide 1: Hook slide - attention-grabbing headline that makes people want to swipe
- Slides 2-8: Content slides - one key point per slide, easily digestible
- Final Slide: CTA slide - clear call-to-action (follow, save, share, comment)

Keep text minimal per slide - carousels are VISUAL. Each slide should be readable in 3-5 seconds. Use bold text cues and visual hierarchy.`,
  poll: `Write a viral Reel script with this structure:
- Hook (first 1-3 seconds): A scroll-stopping opening line or action
- Content (10-30 seconds): The main value or entertainment
- CTA (last 3-5 seconds): Clear engagement driver

Include in your response:
- "reelHook": The attention-grabbing opening (what to say/show first)
- "reelScript": The full spoken script with timestamps
- "visualCues": Visual directions for each part
- "trendingSuggestion": Trending audio or format that could work

The hook is EVERYTHING - this is what stops the scroll on Instagram.`,
  article: "Write a longer-form, story-driven caption (micro-blog style). Include a strong hook in the first line, 3-4 paragraphs of valuable content, and a CTA. These posts drive high save rates.",
};

const HOOK_CATEGORIES = {
  curiosity: [
    "Most people don't know this about {topic}...",
    "I spent 5 years figuring this out (so you don't have to):",
    "The hidden truth about {topic} nobody talks about:",
    "What {successful_person} taught me about {topic}:",
    "I analyzed 100+ {items}. Here's what I found:"
  ],
  contrarian: [
    "Unpopular opinion: {contrarian_take}",
    "Stop doing {common_practice}. Here's why:",
    "Everything you know about {topic} is wrong.",
    "{Common_advice} is terrible advice. Here's what works:",
    "I disagree with most experts on {topic}. Here's why:"
  ],
  authority: [
    "After {years} years in {industry}, here's what I've learned:",
    "I've helped {number}+ {clients} do {result}. The secret?",
    "The framework I use to {achievement}:",
    "How we went from {before} to {after} in {timeframe}:",
    "{Big_result} in {timeframe}. Here's exactly how:"
  ],
  experience: [
    "I failed at {thing} {number} times. Then I discovered this:",
    "The biggest mistake I made in {area}:",
    "What nobody told me about {topic}:",
    "I almost gave up on {thing}. Then this happened:",
    "The turning point in my {journey}:"
  ]
};

const LENGTH_GUIDELINES: Record<string, string> = {
  short: "Keep the post concise, around 100-150 words. Focus on one key message with maximum impact.",
  medium: "Write a medium-length post, around 200-300 words. Include 2-3 key points with brief explanations.",
  long: "Write a comprehensive post, around 400-500 words. Include detailed explanations, examples, and a strong narrative arc."
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
const { 
      brand, 
      source, 
      postType, 
      postTypes,
      postLength, 
      numberOfPosts = 1,
      mediaFormat = 'text_only',
      generateMixedTypes = false,
      persistToDrafts = false
    } = await req.json();

    // Get user from Authorization header if persisting drafts
    let userId: string | null = null;
    if (persistToDrafts) {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'Authorization required for draft persistence' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Create a client with the user's token to get their identity
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
      const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      });
      
      const { data: { user }, error: userError } = await userSupabase.auth.getUser();
      if (userError || !user) {
        console.error('Failed to get user:', userError);
        return new Response(
          JSON.stringify({ error: 'Invalid authentication token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      userId = user.id;
      console.log('Authenticated user for draft persistence:', userId);
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Initialize Supabase client to fetch training data
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Determine which post types to generate
    const typesToGenerate = generateMixedTypes && postTypes?.length > 0 
      ? postTypes 
      : Array(numberOfPosts).fill(postType);

    // Build query context for semantic search
    const queryContext = `${typesToGenerate.join(' ')} ${brand.name} ${brand.target_audience || ''} ${source?.topic || ''} ${source?.content || ''}`;
    
    // Generate embedding for the current query
    let relevantTraining: any[] = [];
    try {
      const embeddingResponse = await fetch(`${supabaseUrl}/functions/v1/generate-embedding`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: queryContext }),
      });

      if (embeddingResponse.ok) {
        const { embedding } = await embeddingResponse.json();
        
        if (embedding && embedding.length === 768) {
          // Use semantic similarity search
          const { data: matchedData, error: matchError } = await supabase
            .rpc('match_training_content', {
              query_embedding: JSON.stringify(embedding),
              match_count: 20,
              filter_category: null
            });

          if (!matchError && matchedData) {
            relevantTraining = matchedData;
            console.log('Semantic search returned:', relevantTraining.length, 'items');
          } else {
            console.log('Semantic search failed, falling back to regular fetch');
          }
        }
      }
    } catch (embeddingError) {
      console.error('Embedding generation failed:', embeddingError);
    }

    // Fallback to regular fetch if semantic search didn't work
    if (relevantTraining.length === 0) {
      const { data: trainingData, error: trainingError } = await supabase
        .from('training_library')
        .select('category, subcategory, title, content')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!trainingError && trainingData) {
        relevantTraining = trainingData;
      }
    }

    // Build training context for the AI
    let trainingContext = '';
    if (relevantTraining.length > 0) {
      const hooks = relevantTraining.filter(t => t.category === 'hook');
      const examples = relevantTraining.filter(t => t.category === 'example_post');
      const guidelines = relevantTraining.filter(t => t.category === 'guideline');
      const frameworks = relevantTraining.filter(t => t.category === 'framework');

      trainingContext = `
TRAINING LIBRARY (Semantically matched to your request):

${hooks.length > 0 ? `RELEVANT HOOK EXAMPLES (${hooks.length} matched):
${hooks.slice(0, 10).map(h => `[${h.subcategory || 'general'}] ${h.content}`).join('\n')}
` : ''}

${examples.length > 0 ? `RELEVANT EXAMPLE POSTS (${examples.length} matched):
${examples.slice(0, 5).map(e => `---\n${e.content}\n---`).join('\n')}
` : ''}

${guidelines.length > 0 ? `WRITING GUIDELINES:
${guidelines.map(g => `• ${g.content}`).join('\n')}
` : ''}

${frameworks.length > 0 ? `CONTENT FRAMEWORKS:
${frameworks.map(f => `[${f.title}]: ${f.content}`).join('\n')}
` : ''}
`;
      console.log('Training context loaded (semantic):', {
        hooks: hooks.length,
        examples: examples.length,
        guidelines: guidelines.length,
        frameworks: frameworks.length
      });
    }

    // Build brand voice context
    const brandContext = `
BRAND VOICE PROFILE:
- Brand Name: ${brand.name}
- Tone: ${brand.tone || 'professional'}
- Writing Style: ${brand.writing_style || 'short_punchy'}
- Emoji Usage: ${brand.emoji_usage || 'minimal'}
${brand.about ? `- About: ${brand.about}` : ''}
${brand.core_beliefs ? `- Core Beliefs: ${brand.core_beliefs}` : ''}
${brand.opinions ? `- Strong Opinions: ${brand.opinions}` : ''}
${brand.signature_frameworks ? `- Signature Frameworks: ${brand.signature_frameworks}` : ''}
${brand.target_audience ? `- Target Audience: ${brand.target_audience}` : ''}
${brand.offers_services ? `- Offers/Services: ${brand.offers_services}` : ''}
`;

    // Build source context
    let sourceContext = '';
    if (source) {
      sourceContext = `
CONTENT SOURCE:
- Source Name: ${source.name}
- Type: ${source.source_type}
${source.url ? `- URL: ${source.url}` : ''}
${source.content ? `- Content/Idea: ${source.content}` : ''}
${source.topic ? `- Topic: ${source.topic}` : ''}
- Funnel Stage: ${source.funnel_stage}
`;
    }

    // Build post type instructions
    let postTypeInstructions = '';
    if (generateMixedTypes && typesToGenerate.length > 1) {
      postTypeInstructions = `Generate ${typesToGenerate.length} posts, one for each of the following types:
${typesToGenerate.map((type: string, i: number) => `
POST ${i + 1} - TYPE: ${type}
${POST_TYPE_PROMPTS[type] || 'Create an engaging LinkedIn post.'}
`).join('\n')}`;
    } else {
      const singleType = typesToGenerate[0] || postType;
      postTypeInstructions = `POST TYPE: ${singleType}
${POST_TYPE_PROMPTS[singleType] || 'Create an engaging LinkedIn post.'}`;
    }

    const systemPrompt = `You are an expert Instagram content strategist and copywriter. Your job is to create viral Instagram content that drives views, engagement, saves, shares, and follower growth.

INSTAGRAM CONTENT RULES:
1. First line is EVERYTHING - it must be a scroll-stopping hook (for captions and Reels)
2. Use line breaks liberally for readability on mobile
3. Write in first person, be authentic and relatable
4. Strategic emoji usage for visual breaks and personality
5. End with engagement driver (question, CTA, or save prompt)
6. Match the brand's exact tone and style
7. Include relevant hashtag suggestions when appropriate
8. Optimize for saves and shares - these boost algorithm ranking

${brandContext}

${trainingContext}

TONE INTERPRETATIONS:
- Professional: Authoritative yet approachable, clean aesthetic language
- Conversational: Friendly, like talking to a close friend, uses casual language
- Bold: Strong statements, confident assertions, unafraid to be polarizing
- Opinionated: Takes clear stances, shares strong perspectives

WRITING STYLE INTERPRETATIONS:
- Short Punchy: Short sentences. Line breaks. Impact. Every word counts. Perfect for Reels.
- Long Form: Detailed explanations with narrative flow, great for story-driven carousel captions
- Story Driven: Personal anecdotes, narrative arc, emotional connection

EMOJI USAGE:
- None: Zero emojis, purely text-based
- Minimal: 1-3 strategic emojis for emphasis and visual breaks
- Moderate: Emojis throughout to add personality and visual hierarchy

MEDIA FORMAT GUIDELINES:
${MEDIA_FORMAT_GUIDELINES[mediaFormat] || MEDIA_FORMAT_GUIDELINES.text_only}`;

    const userPrompt = `Generate ${generateMixedTypes ? typesToGenerate.length : numberOfPosts} Instagram post(s) based on the following:

${sourceContext}

${postTypeInstructions}

LENGTH: ${postLength}
${LENGTH_GUIDELINES[postLength] || LENGTH_GUIDELINES.medium}

MEDIA FORMAT: ${mediaFormat}
${MEDIA_FORMAT_GUIDELINES[mediaFormat] || ''}

For each post, provide the response in this exact JSON format:
{
  "posts": [
    {
      "hook": "The attention-grabbing first line (critical for stopping the scroll)",
      "body": "The main content of the caption",
      "cta": "The call-to-action or engagement driver at the end",
      "postType": "${generateMixedTypes ? 'the_post_type_used' : postType}",
      "hashtagSuggestions": ["relevant", "hashtags", "for", "discoverability"]${mediaFormat === 'poll' ? `,
      "reelHook": "The first 1-3 seconds hook for the Reel",
      "reelScript": "Full script with timestamps",
      "visualCues": "Visual directions for the Reel",
      "trendingSuggestion": "Trending audio or format suggestion"` : ''}${mediaFormat === 'carousel' ? `,
      "carouselSlides": [
        {
          "slideNumber": 1,
          "headline": "Hook headline that stops the scroll",
          "content": "Brief supporting text if needed",
          "visualSuggestion": "Description of visual for this slide"
        },
        {
          "slideNumber": 2,
          "headline": "Key Point #1",
          "content": "2-3 sentences explaining this point",
          "visualSuggestion": "Icon or simple graphic suggestion"
        }
        // ... more slides (aim for 5-10 total)
      ]` : ''}
    }
  ]
}

IMPORTANT:
- Make the hook absolutely compelling - this is what stops the scroll on Instagram
- The body should deliver on the hook's promise and provide real value
- The CTA should drive engagement (save, share, comment, follow)
- Stay true to the brand voice throughout
- Each post should be unique, valuable, and saveable
- Include hashtag suggestions for discoverability (5-15 relevant hashtags)
${generateMixedTypes ? '- Include the "postType" field for each post to identify which type it is' : ''}
${mediaFormat === 'poll' ? `- This is a REEL SCRIPT - Include the hook, full script, visual cues, and trending audio suggestion
- Structure: Hook (1-3s) → Value/Content (10-30s) → CTA (3-5s)
- The hook is CRITICAL - make it impossible to scroll past` : ''}
${mediaFormat === 'carousel' ? `- CRITICAL: Include the "carouselSlides" array with 5-10 slide objects
- Each slide must have: slideNumber, headline, content, and visualSuggestion
- Slide 1 = Hook, Final Slide = CTA, Middle Slides = One key point each
- Keep text MINIMAL per slide - designed for visual consumption on mobile
- Optimize for 1080x1350 (4:5 ratio) viewing` : ''}`;

    // Fetch the configured model from settings
    let model = 'google/gemini-3-flash-preview'; // default
    try {
      const { data: modelSetting } = await supabase
        .from('ai_settings')
        .select('setting_value')
        .eq('setting_key', 'model_post_generation')
        .single();
      
      if (modelSetting?.setting_value) {
        model = modelSetting.setting_value;
      }
    } catch (err) {
      console.log('Using default model for post generation');
    }

    console.log('Generating posts with model:', model, 'types:', typesToGenerate, 'format:', mediaFormat);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content generated');
    }

    // Parse the JSON response
    let parsedPosts;
    try {
      // Extract JSON from the response (handle markdown code blocks)
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      parsedPosts = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      // Fallback: create a simple post from the content
      parsedPosts = {
        posts: [{
          hook: content.split('\n')[0] || 'Check this out:',
          body: content,
          cta: 'What do you think? Comment below!',
          postType: postType
        }]
      };
    }

    console.log('Successfully generated posts:', parsedPosts.posts?.length || 1);

    // If persistToDrafts is enabled, save posts to database
    let savedPosts = parsedPosts.posts;
    if (persistToDrafts && userId && parsedPosts.posts?.length > 0) {
      console.log('Persisting drafts to database for user:', userId);
      
      const postsToInsert = parsedPosts.posts.map((post: any, index: number) => {
        const actualPostType = post.postType || (generateMixedTypes && typesToGenerate[index]) || postType;
        const fullContent = `${post.hook}\n\n${post.body}${post.cta ? `\n\n${post.cta}` : ''}`;
        
        return {
          user_id: userId,
          brand_id: brand.id,
          source_id: source?.id || null,
          post_type: actualPostType,
          hook: post.hook,
          body: post.body,
          cta: post.cta || null,
          full_content: fullContent,
          post_length: postLength,
          media_format: mediaFormat,
          carousel_slides: post.carouselSlides || null,
          status: 'draft',
          source_context: sourceContext || null,
        };
      });

      console.log('Inserting posts:', postsToInsert.length);
      
      const { data: insertedPosts, error: insertError } = await supabase
        .from('generated_posts')
        .insert(postsToInsert)
        .select();

      if (insertError) {
        console.error('Failed to persist drafts:', insertError);
        // Still return the generated posts even if save failed
        return new Response(
          JSON.stringify({ 
            success: true, 
            posts: parsedPosts.posts,
            sourceContext: sourceContext,
            mediaFormat: mediaFormat,
            persistError: insertError.message
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Successfully persisted drafts:', insertedPosts?.length);
      savedPosts = insertedPosts;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        posts: savedPosts,
        sourceContext: sourceContext,
        mediaFormat: mediaFormat,
        persisted: persistToDrafts && userId ? true : false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating posts:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to generate posts' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
