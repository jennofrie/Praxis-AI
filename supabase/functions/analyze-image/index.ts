/**
 * Analyze Image Edge Function (Visual Case Notes - Image)
 * Converts images of handwritten notes, whiteboards, etc. into
 * professional NDIS case notes using multimodal AI.
 *
 * POST - Generate structured case note from image input
 * Model: gemini-1.5-flash (multimodal image analysis)
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.24.1";
import { corsHeaders } from "../_shared/cors.ts";

const CASE_NOTE_IMAGE_SYSTEM_PROMPT = `You are an expert NDIS Support Coordinator who can interpret handwritten notes, whiteboards, and informal documentation captured in photographs, and transform them into structured, professional NDIS case notes.

Your Task:
1. READ the image carefully — identify all text, diagrams, and relevant information.
2. INTERPRET the content in an NDIS Support Coordination context.
3. TRANSFORM into a structured case note following NDIS documentation standards.

Case Note Structure:
1. Date & Time: [Extracted from image or marked as "[TO BE COMPLETED]"]
2. Contact Type: [Inferred from context or marked as "[TO BE COMPLETED]"]
3. Participants Present: [Extracted or marked as "[TO BE COMPLETED]"]
4. Purpose of Contact: [Inferred from content]
5. Discussion Summary: [Professional rewrite of the captured content]
6. Actions Taken: [Extracted action items]
7. Outcomes: [Any outcomes or decisions noted]
8. Follow-Up Required: [Extracted follow-up items with timeframes]
9. Risk/Safety Notes: [If any risks are identified in the content]
10. Goal Progress: [If any goal-related information is present]

Critical Rules:
- If text is illegible, note it as "[ILLEGIBLE — manual review required]".
- Do NOT guess at unclear handwriting — flag it for review.
- Transform informal language into professional NDIS terminology.
- Maintain all factual content from the original — do not omit information.
- Write the final case note in THIRD PERSON, past tense.
- Add a note at the end: "Source: Transcribed from photograph — manual verification recommended."

Content Restriction: If the image does not appear to relate to NDIS, healthcare, disability support, or clinical services, return:
{
  "contentRestriction": true,
  "restrictionReason": "Image content does not appear to be related to NDIS or healthcare services."
}`;

interface CaseNoteImageRequest {
  content: string; // Description/context for the image
  imageData: string; // Base64-encoded image
  imageMimeType: string; // e.g., "image/jpeg", "image/png"
  customInstructions?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')!;

    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: CaseNoteImageRequest = await req.json();
    console.log('[Analyze Image] Processing image case note for user:', user.id);

    if (!body.content || body.content.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'content (description) is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!body.imageData || !body.imageMimeType) {
      return new Response(
        JSON.stringify({ error: 'imageData and imageMimeType are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build prompt
    const promptParts: string[] = [];
    promptParts.push(`Image Description / Context:\n${body.content}`);

    if (body.customInstructions) {
      promptParts.push(`\nAdditional Instructions from Coordinator:\n${body.customInstructions}`);
    }

    promptParts.push('\nAnalyze the provided image and generate a professional, NDIS-compliant case note.');

    const prompt = promptParts.join('\n');

    // Use Gemini 1.5 Flash for multimodal image analysis
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [
          { text: `${CASE_NOTE_IMAGE_SYSTEM_PROMPT}\n\n---\n\n${prompt}` },
          {
            inlineData: {
              mimeType: body.imageMimeType,
              data: body.imageData,
            },
          },
        ],
      }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1024,
        topP: 0.95,
        topK: 40,
      },
    });

    const response = result.response;
    const caseNote = response.text();

    if (!caseNote) {
      return new Response(
        JSON.stringify({ error: 'Failed to generate case note from image' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const processingTime = Date.now() - startTime;

    // Check for content restriction
    if (caseNote.includes('"contentRestriction"') && caseNote.includes('true')) {
      try {
        const parsed = JSON.parse(caseNote);
        if (parsed.contentRestriction) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'CONTENT_RESTRICTION',
              message: parsed.restrictionReason || 'Image not related to NDIS services.',
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } catch {
        // Not JSON, continue
      }
    }

    // Save to history
    const { error: saveError } = await supabase
      .from('case_notes_history')
      .insert({
        user_id: user.id,
        input_type: 'image',
        input_content: body.content,
        custom_instructions: body.customInstructions || null,
        generated_note: caseNote,
        model_used: 'gemini-1.5-flash',
      });

    if (saveError) {
      console.warn('[Analyze Image] Failed to save to DB:', saveError.message);
    }

    console.log('[Analyze Image] Success | Time:', processingTime, 'ms');

    return new Response(
      JSON.stringify({
        success: true,
        caseNote,
        model: 'gemini-1.5-flash',
        processingTime,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Analyze Image] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
