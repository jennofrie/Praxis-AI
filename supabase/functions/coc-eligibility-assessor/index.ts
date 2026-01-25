/**
 * CoC Eligibility Assessor Edge Function
 * AI-powered Change of Circumstances eligibility assessment
 *
 * Features:
 * - Tiered model usage: Premium (Gemini 2.5 Pro) for first N uses per user per 24h
 * - Regular users: 2 Pro uses per 24h
 * - Admin users: 10 Pro uses per 24h
 * - Automatic fallback to Standard tier (Gemini 2.0 Flash) after limit reached
 *
 * POST - Assess if circumstances qualify for NDIS plan reassessment
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { GeminiClient, SYSTEM_PROMPTS, AIProvider, ModelTier } from "../_shared/gemini.ts";

// Constants
const MAX_PRO_USES_PER_DAY = 2;
const MAX_PRO_USES_PER_DAY_ADMIN = 10;

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
  userId?: string;             // Optional: passed from API route for tiered usage
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

// Check if user is an admin
async function checkIsAdmin(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (error || !data) {
      console.log('[Admin Check] Could not verify admin status:', error?.message);
      return false;
    }

    const isAdmin = data.role === 'admin';
    console.log(`[Admin Check] User ${userId.slice(0, 8)}... | Role: ${data.role} | IsAdmin: ${isAdmin}`);
    return isAdmin;
  } catch (error) {
    console.error('[Admin Check] Exception:', error);
    return false;
  }
}

// Check and update Pro usage count for CoC assessments
async function checkProUsage(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  maxLimit: number
): Promise<{ canUsePro: boolean; currentCount: number }> {
  try {
    // Use the database function to check and reset if needed
    // Using 'coc_assessment' as the document type for CoC-specific tracking
    const { data, error } = await supabase.rpc('check_and_reset_pro_usage', {
      p_user_id: userId,
      p_document_type: 'coc_assessment',
    });

    if (error) {
      console.error('[Usage] Error checking usage:', error);
      // Default to allowing Pro on error (better UX)
      return { canUsePro: true, currentCount: 0 };
    }

    const currentCount = data?.[0]?.current_count ?? 0;
    const canUsePro = currentCount < maxLimit;

    console.log(`[Usage] User ${userId.slice(0, 8)}... | DocType: coc_assessment | Count: ${currentCount}/${maxLimit} | CanUsePro: ${canUsePro}`);

    return { canUsePro, currentCount };
  } catch (error) {
    console.error('[Usage] Exception:', error);
    return { canUsePro: true, currentCount: 0 };
  }
}

// Increment Pro usage count
async function incrementProUsage(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<void> {
  try {
    await supabase.rpc('increment_pro_usage', {
      p_user_id: userId,
      p_document_type: 'coc_assessment',
    });
    console.log('[Usage] Incremented Pro usage for user');
  } catch (error) {
    console.error('[Usage] Failed to increment:', error);
  }
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: CoCAssessmentRequest = await req.json();
    console.log('[CoC Assessor] Processing request...');
    console.log('[CoC Assessor] Triggers:', body.triggers?.length || 0);

    // Get user ID from body or auth header
    let userId = body.userId;
    if (!userId) {
      // Try to get from auth header
      const authHeader = req.headers.get('Authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        const { data: { user } } = await supabase.auth.getUser(token);
        userId = user?.id;
      }
    }

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

    // Determine which model tier to use based on user's usage and admin status
    let usePremium = false;
    if (userId) {
      // Check if user is admin (gets 10 Pro uses vs 2 for regular users)
      const isAdmin = await checkIsAdmin(supabase, userId);
      const maxLimit = isAdmin ? MAX_PRO_USES_PER_DAY_ADMIN : MAX_PRO_USES_PER_DAY;

      const { canUsePro } = await checkProUsage(supabase, userId, maxLimit);
      usePremium = canUsePro;
    }

    console.log('[CoC Assessor] Using tier:', usePremium ? 'PREMIUM (Gemini 2.5 Pro)' : 'STANDARD (Gemini 2.0 Flash)');
    console.log('[CoC Assessor] Analyzing circumstances...');

    const result = await gemini.generateWithTieredFallback<CoCAssessmentResult>(
      prompt,
      SYSTEM_PROMPTS.cocEligibilityAssessor,
      usePremium,
      true
    );

    if (!result.success) {
      console.error('[CoC Assessor] Analysis failed:', result.error);
      return new Response(
        JSON.stringify({ error: result.error || 'Failed to assess circumstances' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Increment Pro usage if we used premium tier
    if (userId && result.tierUsed === 'premium') {
      await incrementProUsage(supabase, userId);
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
    console.log('[CoC Assessor] Tier used:', result.tierUsed);
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
        tier: result.tierUsed,
        provider: 'gemini',
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
