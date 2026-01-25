/**
 * CoC Eligibility Assessor Edge Function
 * AI-powered Change of Circumstances eligibility assessment
 *
 * POST - Assess if circumstances qualify for NDIS plan reassessment
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { GeminiClient, SYSTEM_PROMPTS, AIProvider } from "../_shared/gemini.ts";

// CoC Trigger Categories
type CoCTriggerCategory =
  | 'health_condition'
  | 'living_situation'
  | 'support_needs'
  | 'goals_aspirations'
  | 'informal_supports'
  | 'equipment_at'
  | 'plan_utilisation'
  | 'crisis_emergency';

// Trigger category labels for context
const TRIGGER_LABELS: Record<CoCTriggerCategory, string> = {
  health_condition: 'Change in health condition (new diagnosis, deterioration, or improvement)',
  living_situation: 'Change in living situation (moving home, change in support arrangements)',
  support_needs: 'Change in support needs (increase or decrease in required supports)',
  goals_aspirations: 'Change in goals/aspirations (new life goals or changed priorities)',
  informal_supports: 'Change in informal supports (family/carer availability changes)',
  equipment_at: 'Equipment or AT needs (new or replacement assistive technology)',
  plan_utilisation: 'Plan under/over utilisation (budget not being used as expected)',
  crisis_emergency: 'Crisis or emergency (urgent situation requiring immediate response)',
};

interface CoCAssessmentRequest {
  circumstances: string;       // Description of change
  triggers: CoCTriggerCategory[];
  documentNames?: string[];
  content?: string;            // Additional text evidence
  fileData?: string;           // Base64 encoded PDF
  fileMimeType?: string;
  // AI Provider settings
  provider?: AIProvider;
  enableFallback?: boolean;
}

interface EvidenceSuggestion {
  id: string;
  title: string;
  description: string;
  priority: 'essential' | 'recommended' | 'optional';
  category: 'medical' | 'functional' | 'financial' | 'other';
  examples?: string[];
}

interface NDISReference {
  title: string;
  section: string;
  relevance: string;
}

interface NextStep {
  order: number;
  title: string;
  description: string;
  timeframe: string;
  responsible: 'participant' | 'sc' | 'provider' | 'ndia';
}

interface CoCAssessmentResult {
  confidenceScore: number;
  eligibilityVerdict: 'likely_eligible' | 'possibly_eligible' | 'not_eligible' | 'security_blocked';
  recommendedPathway: 'plan_reassessment' | 'plan_variation' | 'light_touch_review' | 'scheduled_review' | 'no_action_required' | 'crisis_response';
  scReport: string;
  participantReport: string;
  evidenceSuggestions: EvidenceSuggestion[];
  ndisReferences: NDISReference[];
  nextSteps: NextStep[];
  contentRestriction?: boolean;
  restrictionReason?: string;
}

const gemini = new GeminiClient();

// Minimum content length
const MIN_CONTENT_LENGTH = 50;

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const body: CoCAssessmentRequest = await req.json();
    console.log('[CoC Assessor] Processing request...');
    console.log('[CoC Assessor] Triggers:', body.triggers?.length || 0);

    // Get provider settings
    const preferredProvider: AIProvider = body.provider || 'gemini';
    const enableFallback = body.enableFallback !== false;
    console.log('[CoC Assessor] Provider:', preferredProvider, '| Fallback:', enableFallback);

    // Validate input
    if (!body.circumstances || body.circumstances.trim().length < MIN_CONTENT_LENGTH) {
      return new Response(
        JSON.stringify({
          error: 'Insufficient detail',
          message: `Please provide at least ${MIN_CONTENT_LENGTH} characters describing the change in circumstances.`,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build trigger context
    const triggerContext = body.triggers?.length
      ? body.triggers.map(t => `- ${TRIGGER_LABELS[t]}`).join('\n')
      : 'No specific trigger categories selected';

    // Build document context
    const documentContext = body.documentNames?.length
      ? `Supporting documents provided: ${body.documentNames.join(', ')}`
      : 'No supporting documents provided';

    // Additional content (from uploads)
    const additionalContent = body.content ? `\n\n**Additional Evidence:**\n${body.content}` : '';

    // Note if PDF is provided
    const pdfNote = body.fileData && body.fileMimeType === 'application/pdf'
      ? '\n[PDF Document Provided - Content extraction pending]'
      : '';

    // Build the prompt
    const prompt = `
**Change of Circumstances Assessment Request**

**Description of Change:**
${body.circumstances}

**Trigger Categories Identified:**
${triggerContext}

**Documentation:**
${documentContext}${pdfNote}${additionalContent}

Please assess whether these circumstances qualify for an NDIS unscheduled plan reassessment.
Provide both a Support Coordinator report and a Participant-friendly report.
`;

    console.log('[CoC Assessor] Analyzing circumstances...');
    const result = await gemini.generate<CoCAssessmentResult>(
      prompt,
      SYSTEM_PROMPTS.cocEligibilityAssessor,
      'pro',
      true,
      preferredProvider
    );

    if (!result.success) {
      console.error('[CoC Assessor] Analysis failed:', result.error);

      // Try fallback if enabled
      if (enableFallback) {
        const fallbackProvider: AIProvider = preferredProvider === 'gemini' ? 'ollama' : 'gemini';
        console.log('[CoC Assessor] Attempting fallback to:', fallbackProvider);

        const fallbackResult = await gemini.generate<CoCAssessmentResult>(
          prompt,
          SYSTEM_PROMPTS.cocEligibilityAssessor,
          'pro',
          true,
          fallbackProvider
        );

        if (fallbackResult.success) {
          const processingTime = Date.now() - startTime;
          console.log('[CoC Assessor] Fallback successful');

          return new Response(
            JSON.stringify({
              success: true,
              data: {
                ...fallbackResult.data,
                processingTime,
              },
              model: fallbackResult.model,
              provider: fallbackResult.provider,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      return new Response(
        JSON.stringify({ error: result.error || 'Failed to assess circumstances' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = result.data as CoCAssessmentResult;
    const processingTime = Date.now() - startTime;

    // Validate and sanitize data
    const sanitizedData: CoCAssessmentResult = {
      confidenceScore: Math.max(0, Math.min(100, data.confidenceScore || 0)),
      eligibilityVerdict: data.eligibilityVerdict || 'possibly_eligible',
      recommendedPathway: data.recommendedPathway || 'scheduled_review',
      scReport: data.scReport || 'Assessment report pending.',
      participantReport: data.participantReport || 'Assessment report pending.',
      evidenceSuggestions: (data.evidenceSuggestions || []).map((s, i) => ({
        id: s.id || `evidence-${i}`,
        title: s.title || 'Evidence',
        description: s.description || '',
        priority: s.priority || 'recommended',
        category: s.category || 'other',
        examples: s.examples || [],
      })),
      ndisReferences: data.ndisReferences || [],
      nextSteps: (data.nextSteps || []).map((s, i) => ({
        order: s.order || i + 1,
        title: s.title || `Step ${i + 1}`,
        description: s.description || '',
        timeframe: s.timeframe || 'As soon as possible',
        responsible: s.responsible || 'participant',
      })),
      contentRestriction: data.contentRestriction || false,
      restrictionReason: data.restrictionReason,
    };

    // Override verdict if content restricted
    if (sanitizedData.contentRestriction) {
      sanitizedData.eligibilityVerdict = 'security_blocked';
    }

    console.log('[CoC Assessor] Assessment successful');
    console.log('[CoC Assessor] Verdict:', sanitizedData.eligibilityVerdict);
    console.log('[CoC Assessor] Pathway:', sanitizedData.recommendedPathway);
    console.log('[CoC Assessor] Confidence:', sanitizedData.confidenceScore);
    console.log('[CoC Assessor] Processing time:', processingTime, 'ms');

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          ...sanitizedData,
          processingTime,
        },
        model: result.model,
        provider: result.provider,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[CoC Assessor] Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
