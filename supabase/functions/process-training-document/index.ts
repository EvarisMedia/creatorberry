import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as pdfParse from "https://esm.sh/pdf-parse@1.1.1";
import JSZip from "https://esm.sh/jszip@3.10.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit
const AI_TIMEOUT_MS = 55000; // 55 second timeout for AI calls
const CHUNK_SIZE = 25000; // Characters per chunk for AI processing
const MAX_CHUNKS = 4; // Maximum chunks to process

// Helper to fetch with timeout
async function fetchWithTimeout(
  url: string, 
  options: RequestInit, 
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Extract text from PDF using pdf-parse library
async function extractPdfText(buffer: ArrayBuffer): Promise<string> {
  try {
    // pdf-parse expects a Buffer, create one from ArrayBuffer
    const uint8Array = new Uint8Array(buffer);
    const data = await (pdfParse as any).default(uint8Array);
    return data.text || "";
  } catch (error) {
    console.error("PDF parse error:", error);
    throw new Error("Failed to parse PDF. The file may be encrypted, corrupted, or image-only.");
  }
}

// Extract text from DOCX using JSZip
async function extractDocxText(buffer: ArrayBuffer): Promise<string> {
  try {
    const zip = await JSZip.loadAsync(buffer);
    
    const documentXml = await zip.file("word/document.xml")?.async("string");
    if (!documentXml) {
      throw new Error("Could not find document.xml in DOCX file");
    }
    
    // Extract text content from XML (remove tags)
    const textContent = documentXml
      .replace(/<w:p[^>]*>/g, "\n") // Paragraph breaks
      .replace(/<[^>]+>/g, "") // Remove all XML tags
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/\n{3,}/g, "\n\n") // Normalize line breaks
      .trim();
    
    return textContent;
  } catch (error) {
    console.error("DOCX parse error:", error);
    throw new Error("Failed to parse DOCX file. The file may be corrupted or password-protected.");
  }
}

// Split text into chunks for processing
function splitIntoChunks(text: string, chunkSize: number): string[] {
  const chunks: string[] = [];
  let remaining = text;
  
  while (remaining.length > 0 && chunks.length < MAX_CHUNKS) {
    if (remaining.length <= chunkSize) {
      chunks.push(remaining);
      break;
    }
    
    // Try to split at a natural break point
    let splitPoint = remaining.lastIndexOf("\n\n", chunkSize);
    if (splitPoint < chunkSize * 0.5) {
      splitPoint = remaining.lastIndexOf("\n", chunkSize);
    }
    if (splitPoint < chunkSize * 0.5) {
      splitPoint = remaining.lastIndexOf(". ", chunkSize);
    }
    if (splitPoint < chunkSize * 0.5) {
      splitPoint = chunkSize;
    }
    
    chunks.push(remaining.substring(0, splitPoint));
    remaining = remaining.substring(splitPoint).trim();
  }
  
  return chunks;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // Check if user is admin
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      throw new Error("Only admins can upload training documents");
    }

    // Fetch the configured model from settings
    let textModel = "google/gemini-2.5-flash"; // default
    try {
      const { data: modelSetting } = await supabase
        .from("ai_settings")
        .select("setting_value")
        .eq("setting_key", "model_document_processing")
        .single();
      
      if (modelSetting?.setting_value) {
        textModel = modelSetting.setting_value;
      }
    } catch (err) {
      console.log("Using default model for document processing");
    }

    const { fileName, filePath, fileType } = await req.json();
    console.log("Processing document:", { fileName, filePath, fileType, model: textModel });

    // Download the file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("training-documents")
      .download(filePath);

    if (downloadError) {
      console.error("Download error:", downloadError);
      throw new Error("Failed to download file");
    }

    // Check file size
    console.log("File size:", fileData.size, "bytes");
    if (fileData.size > MAX_FILE_SIZE) {
      throw new Error(`File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`);
    }

    // Extract text based on file type using LOCAL parsing (fast, no AI needed)
    let textContent = "";
    const startTime = Date.now();
    
    if (fileType === "text/plain") {
      textContent = await fileData.text();
      console.log("TXT extraction time:", Date.now() - startTime, "ms");
    } else if (fileType === "application/pdf") {
      console.log("Starting PDF text extraction...");
      textContent = await extractPdfText(await fileData.arrayBuffer());
      console.log("PDF extraction time:", Date.now() - startTime, "ms");
    } else if (fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      console.log("Starting DOCX text extraction...");
      textContent = await extractDocxText(await fileData.arrayBuffer());
      console.log("DOCX extraction time:", Date.now() - startTime, "ms");
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }

    console.log("Extracted text length:", textContent.length, "characters");
    console.log("Text preview (first 500 chars):", textContent.substring(0, 500));

    if (!textContent || textContent.length < 50) {
      throw new Error(
        "Could not extract sufficient text from document. " +
        "This may be a scanned/image-only PDF or an encrypted file."
      );
    }

    // Split content into chunks for processing
    const chunks = splitIntoChunks(textContent, CHUNK_SIZE);
    console.log(`Split content into ${chunks.length} chunks for AI processing`);

    // Process each chunk to extract training items
    const systemPrompt = `You are an expert at analyzing LinkedIn content and extracting training data.
    
Your task is to analyze the provided text and extract:
1. HOOKS - Attention-grabbing first lines (categorize as: curiosity, contrarian, authority, story, question, statistic, bold_claim)
2. EXAMPLE_POSTS - Full post examples that demonstrate good LinkedIn writing
3. GUIDELINES - Writing rules, tips, or best practices
4. FRAMEWORKS - Content structures or templates

For each item, provide:
- category: "hook", "example_post", "guideline", or "framework"
- subcategory: (only for hooks) the type of hook
- title: a short descriptive title
- content: the actual content

Return a JSON object with an "items" array. Be thorough and extract as many useful items as possible.
Example format: { "items": [{ "category": "hook", "subcategory": "curiosity", "title": "Example Hook", "content": "..." }] }`;

    let allExtractedItems: any[] = [];
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`Processing chunk ${i + 1}/${chunks.length} (${chunk.length} chars)...`);
      
      try {
        const response = await fetchWithTimeout(
          "https://ai.gateway.lovable.dev/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: textModel,
              messages: [
                { role: "system", content: systemPrompt },
                { 
                  role: "user", 
                  content: `Analyze this content (part ${i + 1} of ${chunks.length}) and extract training items:\n\n${chunk}` 
                },
              ],
              response_format: { type: "json_object" },
            }),
          },
          AI_TIMEOUT_MS
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`AI API error for chunk ${i + 1}:`, response.status, errorText);
          continue; // Skip this chunk but continue with others
        }

        const aiData = await response.json();
        const aiContent = aiData.choices?.[0]?.message?.content;
        
        try {
          const parsed = JSON.parse(aiContent);
          const items = parsed.items || parsed.training_items || (Array.isArray(parsed) ? parsed : []);
          console.log(`Chunk ${i + 1}: extracted ${items.length} items`);
          allExtractedItems = allExtractedItems.concat(items);
        } catch (parseError) {
          console.error(`Failed to parse AI response for chunk ${i + 1}:`, aiContent?.substring(0, 200));
        }
      } catch (chunkError) {
        if (chunkError instanceof Error && chunkError.name === "AbortError") {
          console.error(`Chunk ${i + 1} timed out after ${AI_TIMEOUT_MS}ms`);
        } else {
          console.error(`Error processing chunk ${i + 1}:`, chunkError);
        }
      }
    }

    console.log("Total extracted items:", allExtractedItems.length);

    if (allExtractedItems.length === 0) {
      throw new Error(
        "No training items could be extracted from the document. " +
        "Please ensure the document contains LinkedIn content like hooks, posts, or guidelines."
      );
    }

    // Deduplicate items by title+content hash
    const seen = new Set<string>();
    const uniqueItems = allExtractedItems.filter(item => {
      if (!item.category || !item.title || !item.content) return false;
      const key = `${item.category}:${item.title}:${item.content.substring(0, 100)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    console.log("Unique items after deduplication:", uniqueItems.length);

    // Insert extracted items into database with embeddings
    let itemsCreated = 0;
    
    for (const item of uniqueItems) {
      // Generate embedding for this item
      let embedding = null;
      try {
        const embeddingResponse = await fetchWithTimeout(
          `${supabaseUrl}/functions/v1/generate-embedding`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: `${item.title} ${item.content}` }),
          },
          10000 // 10 second timeout for embeddings
        );

        if (embeddingResponse.ok) {
          const embeddingData = await embeddingResponse.json();
          if (embeddingData?.embedding) {
            embedding = JSON.stringify(embeddingData.embedding);
          }
        }
      } catch (embErr) {
        console.error("Failed to generate embedding for item:", embErr);
      }

      const { error: insertError } = await supabase
        .from("training_library")
        .insert({
          category: item.category,
          subcategory: item.subcategory || null,
          title: item.title,
          content: item.content,
          content_embedding: embedding,
          source_file: fileName,
          created_by: user.id,
        });

      if (!insertError) {
        itemsCreated++;
      } else {
        console.error("Insert error:", insertError);
      }
    }

    const totalTime = Date.now() - startTime;
    console.log(`Processing complete: ${itemsCreated} items created in ${totalTime}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        itemsCreated,
        totalExtracted: uniqueItems.length,
        chunksProcessed: chunks.length,
        message: `Successfully extracted ${itemsCreated} training items from the document.`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error processing document:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
