/**
 * Generate Justification Edge Function
 * AI-powered Low-Cost Assistive Technology (LC-AT) justification generator.
 * Creates comprehensive, audit-ready justification documents for NDIS plan variations.
 *
 * POST - Generate AT justification from participant and item details
 * Model: gemini-2.5-flash-preview (hybrid reasoning)
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { GeminiClient } from "../_shared/gemini.ts";

const gemini = new GeminiClient();

const JUSTIFICATION_SYSTEM_PROMPT = `You are an experienced NDIS Support Coordinator Level 2/3 creating a fully compliant Low-Cost Assistive Technology justification report for a plan variation.

Your Output: A structured, audit-ready justification that meets all NDIS Low-Cost AT, Reasonable & Necessary criteria, and plan variation requirements.

MASTER RULE-SET (Global AT Justification Logic):

A. Follow NDIS Low-Cost Assistive Technology rules:
   - LC-AT <$1,500 each (simple/new items)
   - LC-AT <$5,000 (replacement of previously funded device)
   - Must be low-risk, off-the-shelf, no trial required unless risk exists
   - SC can provide justification for low-risk AT
   - Therapist endorsement optional but preferred

B. Use Reasonable & Necessary criteria mapping:
   Every justification must explicitly address:
   - Pursues participant goals
   - Supports daily living
   - Social/economic participation
   - Value for money
   - Effective & beneficial
   - Uses informal support appropriately
   - Most appropriate funding body

C. Use NDIS plan variation template wording style:
   - Straight, factual, outcome-focused
   - Professional but easy to read
   - No jargon unless necessary
   - Explicitly reference LC-AT guidelines
   - Explicitly reference Plan Variation rules
   - Always explain consequences of NOT funding
   - Always justify why requested item is most appropriate

REQUIRED PDF STRUCTURE (MANDATORY SECTIONS - Output in this exact order):

SECTION 1: Summary of Request
SECTION 2: Participant Goals
SECTION 3: Functional Need / Barriers
SECTION 4: Item Justification (Why this AT?)
SECTION 5: Value for Money Assessment
SECTION 6: Risk Assessment
SECTION 7: Quotes & Procurement Pathway
SECTION 8: Reasonable & Necessary Criteria Mapping (ALL 7 criteria)
SECTION 9: Daily Living Impact
SECTION 10: Social & Economic Participation Impact
SECTION 11: Support Coordinator Professional Statement

OUTPUT QUALITY RULES:
- Write in SC professional tone
- Avoid medical advice
- Avoid diagnosing
- Use NDIS language
- Be clear, structured, and audit-proof
- Use bullet points (-) or numbered lists for structured data, NOT markdown tables
- Add double line breaks after each "SECTION X:" header before content
- Do NOT use backticks, code blocks, or markdown formatting

CRITICAL OUTPUT REQUIREMENTS:
- Output ONLY plain text with section markers: "SECTION 1:", "SECTION 2:", etc.
- Do NOT include citations, references, or source tags
- Do NOT include page delimiters, page numbers, or document metadata
- Do NOT include timestamps or generation dates
- Do NOT include markdown table syntax, pipe characters (|), or table separators
- Do NOT include HTML tags or markdown code blocks
- Use only standard paragraph breaks (double line breaks between sections)
- Write in clean, professional prose suitable for official NDIS documentation`;

// Clean AI response of artifacts
function cleanAIResponse(text: string): string {
  let cleaned = text;
  // Remove RAG citations
  cleaned = cleaned.replace(/\[\d+\]/g, '');
  cleaned = cleaned.replace(/\[citation[^\]]*\]/gi, '');
  // Remove HTML tags
  cleaned = cleaned.replace(/<[^>]+>/g, '');
  // Remove markdown formatting
  cleaned = cleaned.replace(/\*\*/g, '');
  cleaned = cleaned.replace(/##\s*/g, '');
  cleaned = cleaned.replace(/```[^`]*```/g, '');
  // Remove table artifacts
  cleaned = cleaned.replace(/\|[^|]*\|/g, '');
  cleaned = cleaned.replace(/[-]{3,}/g, '');
  // Normalize whitespace
  cleaned = cleaned.replace(/\n{4,}/g, '\n\n\n');
  return cleaned.trim();
}

interface JustificationRequest {
  participantName: string;
  ndisNumber?: string;
  dateOfBirth?: string;
  planStartDate?: string;
  planEndDate?: string;
  scName?: string;
  scOrganisation?: string;
  itemName: string;
  itemCategory?: string;
  requestedAmount: number;
  isReplacement: boolean;
  brokenItemDescription?: string;
  isLowRisk: boolean;
  trialRequired: boolean;
  functionalImpairments: string[];
  currentBarriers: string;
  standardDevicesInsufficient?: string;
  dailyLivingImpact?: string;
  safetyImpact?: string;
  participantGoals: string;
  goalAlignment?: string;
  capacityBuildingImpact?: string;
  supplierName?: string;
  quoteAmount: number;
  deliveryTimeline?: string;
  therapistEndorsement: boolean;
  riskAssessmentNotes?: string;
  additionalContext?: string;
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

    // Auth + tier check
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

    // Premium tier check
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();

    if (profile && !['premium', 'legacy_premium', 'admin'].includes(profile.subscription_tier ?? '')) {
      return new Response(
        JSON.stringify({ error: 'Premium subscription required', tier: profile.subscription_tier }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: JustificationRequest = await req.json();
    console.log('[Justification] Processing for user:', user.id);

    if (!body.participantName || !body.itemName || !body.currentBarriers || !body.participantGoals) {
      return new Response(
        JSON.stringify({ error: 'participantName, itemName, currentBarriers, and participantGoals are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const prompt = `PARTICIPANT DETAILS
- Name: ${body.participantName}
- NDIS Number: ${body.ndisNumber || '[Not provided]'}
- Date of Birth: ${body.dateOfBirth || '[Not provided]'}
- Plan Period: ${body.planStartDate || '[Not provided]'} to ${body.planEndDate || '[Not provided]'}

SUPPORT COORDINATOR
- Name: ${body.scName || '[Not provided]'}
- Organisation: ${body.scOrganisation || '[Not provided]'}

REQUESTED SUPPORT
- Item: ${body.itemName}
- Category: ${body.itemCategory || '[Not specified]'}
- Requested Amount: $${body.requestedAmount.toLocaleString()}
- Is Replacement: ${body.isReplacement ? 'Yes' : 'No'}${body.isReplacement && body.brokenItemDescription ? `\n- Reason for Replacement: ${body.brokenItemDescription}` : ''}
- Risk Level: ${body.isLowRisk ? 'Low Risk' : 'Standard/High Risk'}
- Trial Required: ${body.trialRequired ? 'Yes' : 'No'}

FUNCTIONAL IMPAIRMENTS
${body.functionalImpairments.length > 0 ? body.functionalImpairments.map((imp, i) => `${i + 1}. ${imp}`).join('\n') : '[Not specified]'}

CURRENT BARRIERS
${body.currentBarriers}

IMPACT ON DAILY LIVING
${body.dailyLivingImpact || '[Not specified]'}

PARTICIPANT GOALS
${body.participantGoals}

GOAL ALIGNMENT
${body.goalAlignment || '[Not specified]'}

SUPPLIER & QUOTE
- Supplier: ${body.supplierName || '[Not specified]'}
- Quote Amount: $${body.quoteAmount.toLocaleString()}
- Therapist Endorsement: ${body.therapistEndorsement ? 'Yes' : 'No'}

${body.additionalContext ? `ADDITIONAL CONTEXT\n${body.additionalContext}` : ''}

Draft a comprehensive NDIS support justification addressing all Section 34 criteria.`;

    // Use premium tier for justification drafting
    const result = await gemini.generateWithTieredFallback(
      prompt,
      JUSTIFICATION_SYSTEM_PROMPT,
      true,
      false // Plain text output
    );

    if (!result.success || !result.data) {
      console.error('[Justification] AI generation failed:', result.error);
      return new Response(
        JSON.stringify({ error: result.error || 'Failed to generate justification' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const processingTime = Date.now() - startTime;
    const justificationText = cleanAIResponse(result.data as string);

    console.log('[Justification] Success | Item:', body.itemName, '| Time:', processingTime, 'ms');

    return new Response(
      JSON.stringify({
        success: true,
        justification: justificationText,
        participantName: body.participantName,
        supportType: body.itemName,
        generatedAt: new Date().toISOString(),
        model: result.model,
        tier: result.tierUsed,
        processingTime,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Justification] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
