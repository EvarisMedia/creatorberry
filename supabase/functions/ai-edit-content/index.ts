import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const { selectedText, instruction, fullContent, brandContext } = await req.json();
    if (!selectedText || !instruction) throw new Error("Missing selectedText or instruction");

    // Check for user API key
    let userApiKey: string | null = null;
    let userTextModel: string | null = null;
    try {
      const { data: keyData } = await supabase
        .from("user_api_keys")
        .select("gemini_api_key, preferred_text_model")
        .eq("user_id", user.id)
        .maybeSingle();
      if (keyData?.gemini_api_key) {
        userApiKey = keyData.gemini_api_key;
        userTextModel = keyData.preferred_text_model;
      }
    } catch (e) { console.log("No user API key found"); }

    const systemPrompt = `You are a precise text editor. You will receive a selected piece of text and an editing instruction. Apply the instruction ONLY to the selected text. Return ONLY the edited text — no explanations, no markdown code blocks, no wrapping.

Brand context:
- Brand: ${brandContext?.name || "Unknown"}
- Tone: ${brandContext?.tone || "professional"}
- Writing Style: ${brandContext?.writing_style || "clear"}
- Target Audience: ${brandContext?.target_audience || "general"}`;

    const userPrompt = `## Selected Text
${selectedText}

## Instruction
${instruction}

## Surrounding Context (for reference only — do NOT include in output)
${(fullContent || "").slice(0, 1000)}

Return ONLY the edited version of the selected text.`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!userApiKey && !LOVABLE_API_KEY) throw new Error("No API key configured");

    let aiResponse: Response;
    if (userApiKey) {
      const geminiModel = userTextModel || "gemini-2.5-flash";
      aiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${userApiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: systemPrompt + "\n\n" + userPrompt }] }],
          }),
        }
      );
    } else {
      aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      });
    }

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errorText);
      throw new Error("AI editing failed");
    }

    const aiData = await aiResponse.json();
    let editedText: string;
    if (userApiKey) {
      editedText = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } else {
      editedText = aiData.choices?.[0]?.message?.content || "";
    }

    return new Response(JSON.stringify({ editedText: editedText.trim() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-edit-content error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
