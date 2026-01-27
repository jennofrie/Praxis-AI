/**
 * Analyze Text Edge Function (Visual Case Notes - Text)
 * Converts raw text notes into professional NDIS case notes.
 *
 * POST - Generate structured case note from text input
 * Model: gemini-2.0-flash (fast text-to-case-note conversion)
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { GeminiClient } from "../_shared/gemini.ts";

const gemini = new GeminiClient();

const CASE_NOTE_TEXT_SYSTEM_PROMPT = `Role and Persona
You are an expert Support Coordinator Level 2, Specialist Support Coordinator (Level 3) and Psychosocial Recovery Coach operating within the Australian NDIS framework. You possess deep knowledge of the NDIS Price Guide, the Operational Guidelines, and the concept of "Reasonable and Necessary."

Your Goal
Convert the provided input (raw notes, transcripts, or summaries) into high-quality, audit-ready professional case notes. These notes must demonstrate the value of the support provided, justify funding usage, and capture the human element of the participant's journey without sounding robotic or generic.

Writing Guidelines

Tone: Professional, empathetic, active, and clinically sound. Avoid generic AI phrases like "It is crucial to note," "In conclusion," or "delves into."

Voice: Use an "Active Professional" voice. Instead of saying "The participant was helped with...", say "Supported the participant to..." or "Advocated for..."

NDIS Focus: Always link actions back to the participant's NDIS Goals and Budget categories. Highlight barriers, risks, and capacity-building progress.

Psychosocial Lens: Use recovery-oriented language. Focus on hope, autonomy, and the participant's strengths.

Formatting Rules (Strict)

No Special Characters: Do not use bullet points, emojis, asterisks for lists, or hashes (#) for headers. Keep the text clean.

Bolding: You must use bold text only for the Main Title and the Section Headers.

Structure: Organize the note into distinct sections as defined below.

Output Structure:

Case Note Subject
Date of Service
Interaction Type
Goal Alignment
Details of Support Provided
Participant Presentation and Engagement
Progress and Outcomes
Action Plan and Next Steps

Content Restriction: If the input does not appear to relate to NDIS, healthcare, disability support, or clinical services, return:
{
  "contentRestriction": true,
  "restrictionReason": "Content does not appear to be related to NDIS or healthcare services."
}`;

interface CaseNoteTextRequest {
  content: string;
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

    const body: CaseNoteTextRequest = await req.json();
    console.log('[Analyze Text] Processing case note for user:', user.id);

    if (!body.content || body.content.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'content is required and must not be empty' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const promptParts: string[] = [];
    promptParts.push(`Raw Interaction Notes / Description:\n${body.content}`);

    if (body.customInstructions) {
      promptParts.push(`\nAdditional Instructions from Coordinator:\n${body.customInstructions}`);
    }

    promptParts.push('\nGenerate a professional, NDIS-compliant case note from the above content.');

    const prompt = promptParts.join('\n');

    const result = await gemini.generate(
      prompt,
      CASE_NOTE_TEXT_SYSTEM_PROMPT,
      'flash',
      false // Plain text output
    );

    if (!result.success || !result.data) {
      console.error('[Analyze Text] AI generation failed:', result.error);
      return new Response(
        JSON.stringify({ error: result.error || 'Failed to generate case note' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const processingTime = Date.now() - startTime;
    const caseNote = result.data as string;

    // Check for content restriction
    if (caseNote.includes('"contentRestriction"') && caseNote.includes('true')) {
      try {
        const parsed = JSON.parse(caseNote);
        if (parsed.contentRestriction) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'CONTENT_RESTRICTION',
              message: parsed.restrictionReason || 'Content not related to NDIS services.',
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } catch {
        // Not JSON, continue with text response
      }
    }

    // Save to history
    const { error: saveError } = await supabase
      .from('case_notes_history')
      .insert({
        user_id: user.id,
        input_type: 'text',
        input_content: body.content,
        custom_instructions: body.customInstructions || null,
        generated_note: caseNote,
        model_used: result.model,
      });

    if (saveError) {
      console.warn('[Analyze Text] Failed to save to DB:', saveError.message);
    }

    console.log('[Analyze Text] Success | Time:', processingTime, 'ms');

    return new Response(
      JSON.stringify({
        success: true,
        caseNote,
        model: result.model,
        processingTime,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Analyze Text] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
