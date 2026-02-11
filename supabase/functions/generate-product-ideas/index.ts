import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    // Look up user's API key
    let userApiKey: string | null = null;
    let userTextModel: string | null = null;
    try {
      const { data: keyData } = await supabase
        .from('user_api_keys')
        .select('gemini_api_key, preferred_text_model')
        .eq('user_id', user.id)
        .maybeSingle();
      if (keyData?.gemini_api_key) {
        userApiKey = keyData.gemini_api_key;
        userTextModel = keyData.preferred_text_model;
      }
    } catch (e) { console.log('No user API key found'); }

    if (!userApiKey && !LOVABLE_API_KEY) {
      throw new Error('No API key configured');
    }

    // Get authenticated user
    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: { user }, error: userError } = await userSupabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { brand, numberOfIdeas = 5 } = await req.json();

    if (!brand?.id || !brand?.name) {
      return new Response(
        JSON.stringify({ error: 'Brand information is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch content sources for this brand
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: sources } = await supabase
      .from('content_sources')
      .select('name, source_type, content, topic, url, funnel_stage')
      .eq('brand_id', brand.id)
      .eq('is_active', true)
      .limit(20);

    const sourcesContext = sources && sources.length > 0
      ? `\nCONTENT SOURCES (use these as inspiration):\n${sources.map(s =>
          `- ${s.name} (${s.source_type}): ${s.topic || ''} ${s.content ? s.content.substring(0, 200) : ''}`
        ).join('\n')}`
      : '';

    const systemPrompt = `You are an expert digital product strategist specializing in helping content creators monetize their expertise. 
You generate innovative, validated product ideas with Product-Market Fit (PMF) scoring.

PRODUCT FORMATS to consider:
- Ebook / Guide (PDF digital download)
- Online Course / Workshop
- Templates / Toolkit Bundle
- Workbook / Journal
- Coaching Program / Group Coaching
- Membership / Community
- Newsletter / Paid Newsletter
- Printables / Planners
- Audio Course / Podcast Series
- Video Course / Masterclass

PMF SCORING DIMENSIONS (score 0-100):
1. DEMAND: How much does the target audience actively seek this? Evidence of search volume, community questions, social discussions.
2. FIT: How well does this align with the creator's existing brand, expertise, and audience trust?
3. GAP: How underserved is this specific angle? Are competitors doing it poorly or not at all?
4. URGENCY: How time-sensitive is the need? Does the audience need this NOW vs someday?

COMBINED SCORE = (Demand × 0.3) + (Fit × 0.35) + (Gap × 0.2) + (Urgency × 0.15)`;

    const userPrompt = `Generate ${numberOfIdeas} unique digital product ideas for this creator:

BRAND PROFILE:
- Name: ${brand.name}
- Niche: ${brand.niche || 'Not specified'}
- About: ${brand.about || 'Not specified'}
- Target Audience: ${brand.target_audience || 'Not specified'}
- Core Beliefs: ${brand.core_beliefs || 'Not specified'}
- Offers/Services: ${brand.offers_services || 'Not specified'}
- Signature Frameworks: ${brand.signature_frameworks || 'Not specified'}
${sourcesContext}

For each product idea, provide this JSON:
{
  "ideas": [
    {
      "title": "Compelling product title",
      "description": "2-3 sentence description of what this product is, who it's for, and the transformation it provides",
      "format": "ebook | course | templates | workbook | coaching | membership | newsletter | printables | audio_course | video_course",
      "target_audience": "Specific audience segment this targets",
      "source_context": "What inspired this idea (brand expertise, content source, market gap)",
      "pmf_scores": {
        "demand_score": 75,
        "fit_score": 85,
        "gap_score": 60,
        "urgency_score": 70,
        "combined_score": 74,
        "reasoning": {
          "demand": "Why this score for demand",
          "fit": "Why this score for fit",
          "gap": "Why this score for gap",
          "urgency": "Why this score for urgency"
        }
      }
    }
  ]
}

IMPORTANT:
- Each idea should be distinct in format AND angle
- Score honestly - not everything should be 90+
- Combined score must follow the weighted formula
- Prioritize ideas that leverage the creator's unique expertise
- Consider the creator's existing content sources as validation signals
- Include at least one "quick win" (low effort, fast to market) and one "flagship" (high effort, high reward)`;

    console.log('Generating product ideas for brand:', brand.name, 'source:', userApiKey ? 'user-key' : 'gateway');

    let response: Response;
    if (userApiKey) {
      const geminiModel = userTextModel || 'gemini-2.5-flash';
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${userApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: systemPrompt + '\n\n' + userPrompt }] }],
            generationConfig: { temperature: 0.8 },
          }),
        }
      );
    } else {
      response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.8,
          response_format: { type: 'json_object' },
        }),
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI API request failed: ${response.status}`);
    }

    const aiResult = await response.json();
    let content: string;
    if (userApiKey) {
      content = aiResult.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } else {
      content = aiResult.choices?.[0]?.message?.content || '';
    }

    if (!content) {
      throw new Error('No content received from AI');
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse AI response as JSON');
      }
    }

    const ideas = parsed.ideas || [];
    console.log(`Generated ${ideas.length} product ideas`);

    // Persist ideas and PMF scores to database
    const savedIdeas = [];
    for (const idea of ideas) {
      const { data: savedIdea, error: ideaError } = await supabase
        .from('product_ideas')
        .insert({
          user_id: user.id,
          brand_id: brand.id,
          title: idea.title,
          description: idea.description,
          format: idea.format,
          target_audience: idea.target_audience,
          source_context: idea.source_context,
          status: 'new',
        })
        .select()
        .single();

      if (ideaError) {
        console.error('Error saving idea:', ideaError);
        continue;
      }

      // Save PMF scores
      const pmf = idea.pmf_scores;
      const { data: savedScore, error: scoreError } = await supabase
        .from('pmf_scores')
        .insert({
          product_idea_id: savedIdea.id,
          demand_score: pmf.demand_score,
          fit_score: pmf.fit_score,
          gap_score: pmf.gap_score,
          urgency_score: pmf.urgency_score,
          combined_score: pmf.combined_score,
          reasoning: pmf.reasoning,
        })
        .select()
        .single();

      if (scoreError) {
        console.error('Error saving PMF score:', scoreError);
      }

      savedIdeas.push({
        ...savedIdea,
        pmf_score: savedScore || null,
      });
    }

    return new Response(
      JSON.stringify({ ideas: savedIdeas }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating product ideas:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
