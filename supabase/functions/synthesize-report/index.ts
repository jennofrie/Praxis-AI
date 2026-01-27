/**
 * Synthesize Report Edge Function
 * Analyzes allied health reports and either extracts structured data
 * for Word templates OR synthesizes comprehensive NDIS reports.
 *
 * POST - Synthesize or extract from clinical report text
 * Model: gemini-2.5-pro (premium) / gemini-2.0-flash (standard)
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { GeminiClient } from "../_shared/gemini.ts";

const gemini = new GeminiClient();

const SYNTHESIS_KEYWORDS = [
  'synthesize', 'synthesise', 'merge', 'combine',
  'summarise', 'summarize', 'summary', 'integrate',
  'narrative', 'write up', 'write-up', 'comprehensive', 'format',
];

function requestsSynthesis(notes: string): boolean {
  const lower = notes.toLowerCase();
  return notes.length > 100 && SYNTHESIS_KEYWORDS.some(kw => lower.includes(kw));
}

const SYNTHESIS_SYSTEM_PROMPT = `You are an expert NDIS Support Coordinator with 10+ years of experience analyzing allied health reports and synthesizing comprehensive NDIS documentation. You have deep knowledge of Section 34 "Reasonable and Necessary" criteria, NDIS Practice Standards, and current PACE operational guidelines.

CORE SYNTHESIS PRINCIPLES:
YOUR TASK: Analyze allied health reports and create a professional NDIS synthesis report that TRANSLATES clinical findings into NDIS-fundable evidence.

CRITICAL TRANSLATION PROCESS:
1. Extract clinical findings from OT, Physio, Psychology, and medical reports
2. Translate medical/clinical language into FUNCTIONAL IMPACT language
3. Connect every finding to how it affects daily living, participation, and goals
4. Ensure every recommendation has a clear NEXUS: impairment -> need -> support -> outcome

WRITING STYLE:
- Write in first-person as the professional specified in the instructions
- Sound like a real human professional writing their own report
- Use natural language with professional authority
- Be specific — reference actual details from the attached reports

ABSOLUTELY PROHIBITED:
- NO asterisks (*) for bullet points
- NO markdown formatting (**, ##, -, etc.)
- NO generic AI phrases ("As an AI...", "I don't have access to...")
- NO filler phrases ("It is important to note...", "In conclusion...")

FORMATTING:
- Use numbered lists (1. 2. 3.) when listing items
- Use clear section headings
- Write in flowing paragraphs, not bullet-point lists
- Keep Australian English spelling (organise, behaviour, programme)

For each recommendation, ensure (woven naturally, not labelled):
- Evidence from allied health reports supporting the need
- Functional impact on daily living/participation
- Why this intensity/frequency is appropriate
- Connection to participant's stated NDIS goals
- Why NDIS is the appropriate funder (not Health/Education/mainstream)

Return the complete synthesized report as PLAIN TEXT with clear section headings. Do NOT wrap in JSON or code blocks. Do NOT use markdown syntax.`;

const EXTRACTION_SYSTEM_PROMPT = `You are an expert NDIS Support Coordinator. Analyze the attached allied health report text. Extract all relevant information.

CRITICAL: Return the result as a JSON object with these EXACT keys (use underscores, not camelCase). This is for filling a Word document template:

{
  "participant_name": "string (extract from report or 'Not specified')",
  "ndis_number": "string (extract from report or 'Not specified')",
  "date_of_birth": "string (extract from report or 'Not specified')",
  "report_type": "string (e.g., 'Occupational Therapy Assessment', 'Physiotherapy Report')",
  "assessment_date": "string (the date of assessment)",
  "provider": "string (organization/clinic name)",
  "professional_name": "string (name of the assessing professional)",
  "functional_capacity": "string (detailed summary of current functional level - 2-3 paragraphs)",
  "strengths": "string (bullet-point list of identified strengths, each on new line starting with bullet)",
  "challenges": "string (bullet-point list of challenges/limitations, each on new line starting with bullet)",
  "impact_on_daily_life": "string (how limitations affect daily activities - 1-2 paragraphs)",
  "risks": "string (bullet-point list of identified risks, each on new line starting with bullet)",
  "mitigation_strategies": "string (bullet-point list of risk mitigation strategies)",
  "recommended_supports": "string (bullet-point list of recommended supports/services)",
  "frequency": "string (recommended frequency of supports)",
  "duration": "string (recommended duration of supports)",
  "goals": "string (bullet-point list of suggested goals)",
  "summary": "string (comprehensive 3-4 paragraph coordinator summary)"
}

Be thorough and professional. If information is not found, write 'Not specified'.
Do NOT include any markdown code blocks or formatting - return pure JSON only.`;

interface SynthesisRequest {
  reportText?: string;
  reportTexts?: string;
  coordinatorNotes?: string;
  reportingInstructions?: string;
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

    const body: SynthesisRequest = await req.json();
    console.log('[Synthesize Report] Processing request for user:', user.id);

    const reportText = body.reportText || body.reportTexts || '';
    const coordinatorNotes = body.coordinatorNotes || body.reportingInstructions || '';

    if (!reportText && !coordinatorNotes) {
      return new Response(
        JSON.stringify({ error: 'At least one of reportText or coordinatorNotes is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const needsSynthesis = coordinatorNotes ? requestsSynthesis(coordinatorNotes) : false;

    // Build prompt
    const promptParts: string[] = [];
    if (reportText) {
      promptParts.push(`ALLIED HEALTH REPORT TEXT:\n${reportText}`);
    }
    if (coordinatorNotes) {
      promptParts.push(`COORDINATOR NOTES/INSTRUCTIONS:\n${coordinatorNotes}`);
    }

    const systemPrompt = needsSynthesis ? SYNTHESIS_SYSTEM_PROMPT : EXTRACTION_SYSTEM_PROMPT;
    const prompt = promptParts.join('\n\n');

    // Use premium tier for report synthesis (complex analysis)
    const result = await gemini.generateWithTieredFallback(
      prompt,
      systemPrompt,
      true, // Try premium first
      !needsSynthesis // Parse as JSON for extraction mode
    );

    if (!result.success || !result.data) {
      console.error('[Synthesize Report] AI generation failed:', result.error);
      return new Response(
        JSON.stringify({ error: result.error || 'Failed to synthesize report' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const processingTime = Date.now() - startTime;

    // Save to database
    const saveData: Record<string, unknown> = {
      user_id: user.id,
      title: needsSynthesis ? 'Synthesized Report' : 'Extracted Template Data',
      source_text: reportText || null,
      coordinator_notes: coordinatorNotes || null,
      synthesized_content: typeof result.data === 'string' ? result.data : JSON.stringify(result.data),
      template_data: !needsSynthesis && typeof result.data === 'object' ? result.data : null,
      model_used: result.model,
    };

    const { error: saveError } = await supabase
      .from('synthesized_reports')
      .insert(saveData);

    if (saveError) {
      console.warn('[Synthesize Report] Failed to save to DB:', saveError.message);
    }

    const responseData: Record<string, unknown> = {
      model: result.model,
    };

    if (needsSynthesis) {
      responseData.synthesizedText = result.data;
    } else {
      responseData.templateData = result.data;
    }

    console.log('[Synthesize Report] Success | Mode:', needsSynthesis ? 'synthesis' : 'extraction');
    console.log('[Synthesize Report] Tier:', result.tierUsed, '| Time:', processingTime, 'ms');

    return new Response(
      JSON.stringify({
        success: true,
        data: responseData,
        tier: result.tierUsed,
        processingTime,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Synthesize Report] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
