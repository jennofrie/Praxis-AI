/**
 * CoC Cover Letter Generator Edge Function
 * Analyzes SC progress reports and generates structured Change of
 * Circumstances cover letter data for PDF generation.
 *
 * POST - Generate CoC cover letter from report text
 * Model: gemini-2.0-flash (fast structured extraction)
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { GeminiClient } from "../_shared/gemini.ts";

const gemini = new GeminiClient();

const COC_COVER_LETTER_SYSTEM_PROMPT = `You are a SENIOR EXPERT NDIS Support Coordinator with 10+ years of experience. You operate at both Level 2 (Support Coordination) and Level 3 (Specialist Support Coordination) depending on case complexity. You are creating a Change of Circumstances (CoC) Cover Letter based on your Plan Reassessment or End of Plan Report.

YOUR PROFESSIONAL IDENTITY:
- You are the Support Coordinator who has been working closely with this participant
- You have detailed knowledge of their situation from your direct involvement
- You write in first person from your professional perspective
- Your cover letter demonstrates your expertise and advocacy for the participant
- You write professionally for NDIA planners who need clear, concise, evidence-based information

CRITICAL WRITING RULES:
1. ONLY use information that is EXPLICITLY stated in the uploaded report
2. Do NOT invent or assume details not present in the document
3. Use ONLY standard ASCII characters - NO special Unicode characters, arrows, bullets, or symbols
4. Use simple hyphens (-) for lists, NOT bullet points or arrows
5. Keep all text concise and easy to read for planners
6. Use Australian English spelling (organisation, behaviour, colour)
7. Write in flowing paragraphs, not excessive bullet points

YOUR TASK:
Analyze the provided Support Coordinator progress report or end-of-plan report and extract comprehensive information for a CoC Cover Letter. Transform the clinical/professional language into a persuasive, evidence-based cover letter format that is easy for an NDIA planner to review and understand.

OUTPUT FORMAT - STRICT JSON:

{
  "participant": {
    "name": "string (full name from report, or empty)",
    "dateOfBirth": "string (DD/MM/YYYY from report, or empty)",
    "ndisNumber": "string (from report, or empty)",
    "address": "string (from report, or empty)",
    "email": "string (from report, or empty)",
    "phone": "string (from report, or empty)"
  },
  "plan": {
    "startDate": "string (DD/MM/YYYY from report, or empty)",
    "endDate": "string (DD/MM/YYYY from report, or empty)",
    "reportingPeriod": "string (e.g., Current Plan 01/01/2025 - 31/12/2025)"
  },
  "overview": {
    "summaryText": "string (2-3 paragraph compelling overview based on report facts)"
  },
  "keyChanges": [
    {
      "title": "string (e.g., Deteriorating Mental Health)",
      "description": "string (detailed description with evidence from report)"
    }
  ],
  "clinicalEvidence": {
    "introText": "string (introduction to clinical evidence)",
    "assessments": [
      {
        "measure": "string (e.g., WHODAS 2.0)",
        "score": "string (e.g., 87/100)",
        "interpretation": "string (e.g., Severe functional limitation)"
      }
    ],
    "conclusionText": "string (clinical conclusion based on report)"
  },
  "scRequest": {
    "introText": "string (introduction to SC request)",
    "comparison": {
      "currentLevel": "string (e.g., Level 2)",
      "recommendedLevel": "string",
      "currentHoursAnnual": "string",
      "recommendedHoursAnnual": "string",
      "currentHoursMonthly": "string",
      "recommendedHoursMonthly": "string"
    },
    "activitiesIntro": "string (introduction to SC activities)",
    "activities": [
      {
        "area": "string (e.g., Crisis Management)",
        "description": "string (detailed description from report)"
      }
    ]
  },
  "anticipatedQuestions": [
    {
      "question": "string (anticipated NDIA question)",
      "response": "string (professional response using report evidence)"
    }
  ],
  "documents": {
    "included": [
      {
        "name": "string",
        "date": "string",
        "pages": "string"
      }
    ],
    "progressive": [
      {
        "name": "string",
        "expectedDate": "string"
      }
    ],
    "progressiveNote": "string or empty"
  },
  "closing": {
    "statementText": "string (professional closing statement)",
    "priorityReasons": ["string (reason 1)", "string (reason 2)"]
  }
}

CRITICAL REMINDERS:
- Return ONLY valid JSON with no markdown formatting or code blocks
- Use ONLY standard ASCII characters - no special symbols, arrows, or Unicode
- Ensure all dates are in Australian DD/MM/YYYY format
- Extract ONLY information present in the uploaded report
- If information is not in the report, leave the field empty or write "Not specified in report"
- Make the overview compelling and persuasive while being factually accurate
- Write professionally for NDIA planners - clear, concise, evidence-based`;

interface CoCRequest {
  reportText: string;
  scLevel: 2 | 3;
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

    const body: CoCRequest = await req.json();
    console.log('[CoC Cover Letter] Processing request for user:', user.id);

    if (!body.reportText || body.reportText.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'reportText is required and must not be empty' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (body.scLevel !== 2 && body.scLevel !== 3) {
      return new Response(
        JSON.stringify({ error: 'scLevel must be 2 or 3' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const scLevelContext = body.scLevel === 3
      ? 'Level 3 — Specialist Support Coordination (high complexity)'
      : 'Level 2 — Support Coordination (standard coordination)';

    const prompt = `SC Level Context: ${scLevelContext}

Report / Supporting Documentation:
${body.reportText}

Generate a comprehensive CoC cover letter in the specified JSON format. Extract all available participant and clinical details from the report text above.`;

    // Use standard tier (flash) for cover letter - fast structured extraction
    const result = await gemini.generate(
      prompt,
      COC_COVER_LETTER_SYSTEM_PROMPT,
      'flash',
      true
    );

    if (!result.success || !result.data) {
      console.error('[CoC Cover Letter] AI generation failed:', result.error);
      return new Response(
        JSON.stringify({ error: result.error || 'Failed to generate cover letter' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const processingTime = Date.now() - startTime;
    const coverLetterData = result.data as Record<string, unknown>;

    // Generate content hash for dedup
    const encoder = new TextEncoder();
    const hashData = encoder.encode(body.reportText.slice(0, 10240));
    const hashBuffer = await crypto.subtle.digest('SHA-256', hashData);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const sourceHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Save to database
    const participant = coverLetterData.participant as Record<string, string> | undefined;
    const { error: saveError } = await supabase
      .from('coc_cover_letter_history')
      .insert({
        user_id: user.id,
        participant_name: participant?.name || null,
        ndis_number: participant?.ndisNumber || null,
        sc_level: body.scLevel,
        cover_letter_data: coverLetterData,
        source_document_hash: sourceHash,
      });

    if (saveError) {
      console.warn('[CoC Cover Letter] Failed to save to DB:', saveError.message);
    }

    console.log('[CoC Cover Letter] Success | SC Level:', body.scLevel, '| Time:', processingTime, 'ms');

    return new Response(
      JSON.stringify({
        success: true,
        coverLetterData,
        model: result.model,
        processingTime,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[CoC Cover Letter] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
