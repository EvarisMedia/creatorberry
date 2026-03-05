import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function extractTextFromTxt(base64: string): string {
  const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function extractTextFromPdf(base64: string): string {
  // Lightweight PDF text extraction - decode binary and pull text between BT/ET or stream markers
  const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  const raw = new TextDecoder('latin1').decode(bytes);
  
  const textChunks: string[] = [];
  
  // Extract text from PDF streams
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match;
  while ((match = streamRegex.exec(raw)) !== null) {
    const content = match[1];
    // Extract readable ASCII text
    const readable = content.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ').trim();
    if (readable.length > 20) {
      textChunks.push(readable);
    }
  }

  // Also try extracting text between parentheses in BT/ET blocks (PDF text objects)
  const btRegex = /BT\s([\s\S]*?)ET/g;
  while ((match = btRegex.exec(raw)) !== null) {
    const block = match[1];
    const parenRegex = /\(([^)]*)\)/g;
    let pm;
    while ((pm = parenRegex.exec(block)) !== null) {
      if (pm[1].trim().length > 0) {
        textChunks.push(pm[1]);
      }
    }
  }

  return textChunks.join('\n').trim() || 'Unable to extract text from this PDF. Please try a TXT or DOCX file.';
}

function extractTextFromDocx(base64: string): string {
  // DOCX is a ZIP file containing XML. We look for text content in the raw bytes.
  const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  const raw = new TextDecoder('latin1').decode(bytes);
  
  // Try to find document.xml content and extract text between <w:t> tags
  const textChunks: string[] = [];
  const wtRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
  let match;
  while ((match = wtRegex.exec(raw)) !== null) {
    if (match[1].trim()) {
      textChunks.push(match[1]);
    }
  }

  // Fallback: extract any readable text
  if (textChunks.length === 0) {
    const readable = raw.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ').trim();
    if (readable.length > 50) {
      return readable.substring(0, 50000);
    }
    return 'Unable to extract text from this DOCX. Please try a TXT file.';
  }

  return textChunks.join(' ').trim();
}

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

    const { fileBase64, fileType, mode } = await req.json();

    if (!fileBase64 || !fileType) {
      return new Response(
        JSON.stringify({ error: 'fileBase64 and fileType are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract text based on file type
    let extractedText = '';
    const type = fileType.toLowerCase();
    if (type.includes('text/plain') || type.endsWith('.txt')) {
      extractedText = extractTextFromTxt(fileBase64);
    } else if (type.includes('pdf') || type.endsWith('.pdf')) {
      extractedText = extractTextFromPdf(fileBase64);
    } else if (type.includes('wordprocessingml') || type.includes('docx') || type.endsWith('.docx')) {
      extractedText = extractTextFromDocx(fileBase64);
    } else {
      return new Response(
        JSON.stringify({ error: 'Unsupported file type. Please upload PDF, DOCX, or TXT.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Truncate to ~8000 words
    const words = extractedText.split(/\s+/);
    if (words.length > 8000) {
      extractedText = words.slice(0, 8000).join(' ') + '\n[...truncated]';
    }

    console.log(`Extracted ${words.length} words from ${fileType}, mode: ${mode || 'extract-text'}`);

    // If mode is just text extraction, return the text
    if (mode !== 'extract-idea') {
      return new Response(
        JSON.stringify({ text: extractedText }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mode: extract-idea — use AI to extract structured idea fields
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
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
    } catch (_e) { /* no key */ }

    if (!userApiKey && !LOVABLE_API_KEY) {
      throw new Error('No API key configured');
    }

    const aiPrompt = `Analyze this document and extract a digital product idea from it. Return ONLY a JSON object with these fields:

{
  "title": "A compelling product title based on the document content",
  "description": "2-3 sentence description of what product could be created from this content",
  "format": "one of: ebook, course, templates, workbook, coaching, membership, newsletter, printables, audio_course, video_course",
  "target_audience": "Who would benefit from this product"
}

DOCUMENT CONTENT:
${extractedText.substring(0, 15000)}`;

    let response: Response;
    if (userApiKey) {
      const model = userTextModel || 'gemini-2.5-flash';
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${userApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: aiPrompt }] }],
            generationConfig: { temperature: 0.5 },
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
          messages: [{ role: 'user', content: aiPrompt }],
          temperature: 0.5,
          response_format: { type: 'json_object' },
        }),
      });
    }

    if (!response.ok) {
      const errText = await response.text();
      console.error('AI error:', errText);
      throw new Error(`AI request failed: ${response.status}`);
    }

    const aiResult = await response.json();
    let content: string;
    if (userApiKey) {
      content = aiResult.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } else {
      content = aiResult.choices?.[0]?.message?.content || '';
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse AI response');
      }
    }

    return new Response(
      JSON.stringify({ idea: parsed, text: extractedText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error parsing document:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
