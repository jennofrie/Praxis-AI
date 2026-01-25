/**
 * NDIS Plan Extractor Edge Function
 * AI-powered extraction of NDIS plan data from uploaded documents
 *
 * Features:
 * - Extracts participant name, NDIS number, dates, funding amounts, goals
 * - Tiered model usage: Premium (Gemini 2.5 Pro) with usage limits per 24h
 *   - Regular users: 2 Pro uses per 24h
 *   - Admin users: 10 Pro uses per 24h
 * - Automatic fallback to Standard tier (Gemini 2.0 Flash) after limit reached
 *
 * POST - Extract structured data from NDIS plan document content
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { GeminiClient, ModelTier } from "../_shared/gemini.ts";

// Constants
const MAX_PRO_USES_PER_DAY = 2;
const MAX_PRO_USES_PER_DAY_ADMIN = 10;
const MIN_CONTENT_LENGTH = 200;

interface ExtractRequest {
  content: string;           // Extracted text from PDF
  userId?: string;           // For tiered usage tracking
}

interface FundingBreakdown {
  total: number;
  core: number;
  capacityBuilding: number;
  capital: number;
}

interface NDISGoal {
  id: string;
  goalNumber: number;
  title: string;
  description: string;
  category: string;
  currentSituation?: string;
  desiredOutcome?: string;
  strategies?: string[];          // Strategies from the actual plan document
  supportCategories?: string[];
  targetDate?: string;
}

interface ExtractedPlanData {
  participantName: string;
  ndisNumber: string;
  dateOfBirth?: string;
  planStartDate: string;
  planEndDate: string;
  planApprovalDate?: string;
  planManagementType: 'agency' | 'plan-managed' | 'self-managed' | 'combination';
  funding: FundingBreakdown;
  goals: NDISGoal[];
  supportCoordinatorName?: string;
  planManagerName?: string;
  extractionConfidence: number;
  warnings?: string[];
}

interface ExtractionResult {
  success: boolean;
  data?: ExtractedPlanData;
  error?: string;
  modelUsed?: string;
  tierUsed?: ModelTier;
  processingTime?: number;
}

const gemini = new GeminiClient();

// System prompt for NDIS Plan extraction
const EXTRACTION_SYSTEM_PROMPT = `You are an expert NDIS Plan data extraction system. Your task is to accurately extract structured data from NDIS plan documents.

**CRITICAL RULES:**
1. Extract ONLY information that is EXPLICITLY stated in the document
2. DO NOT invent, assume, or hallucinate any data
3. If a field is not found, use null or empty values - NEVER guess
4. For funding amounts, extract exact figures only - no estimates
5. Goals must be extracted exactly as written in the plan document
6. Confidence score reflects how much data was explicitly found (0-100)

**EXTRACTION REQUIREMENTS:**

1. **Participant Details:**
   - Full name as written in the plan
   - NDIS Number (format: typically 9-digit number or with specific format)
   - Date of Birth if present

2. **Plan Period:**
   - Start Date (exact date)
   - End Date (exact date)
   - Approval Date if mentioned

3. **Funding Breakdown:**
   - Total Budget
   - Core Supports budget
   - Capacity Building budget
   - Capital Supports budget (may be 0 or not applicable)

4. **Goals:**
   - Extract each goal with:
     - Goal number/title as stated
     - Full description
     - Category (if specified: Daily Living, Social/Community, Employment, Learning, etc.)
     - Current situation (what participant can do now)
     - Desired outcome (what they want to achieve)
     - Strategies mentioned in the plan for achieving this goal
     - Support categories linked to this goal
     - Target dates if mentioned

5. **Plan Management:**
   - Type: agency-managed, plan-managed, self-managed, or combination
   - Support Coordinator name if mentioned
   - Plan Manager name if mentioned

**OUTPUT FORMAT:**
Return a valid JSON object with the following structure:
{
  "participantName": "string",
  "ndisNumber": "string",
  "dateOfBirth": "string or null",
  "planStartDate": "YYYY-MM-DD",
  "planEndDate": "YYYY-MM-DD",
  "planApprovalDate": "YYYY-MM-DD or null",
  "planManagementType": "agency|plan-managed|self-managed|combination",
  "funding": {
    "total": number,
    "core": number,
    "capacityBuilding": number,
    "capital": number
  },
  "goals": [
    {
      "id": "goal-1",
      "goalNumber": 1,
      "title": "string",
      "description": "string",
      "category": "string",
      "currentSituation": "string or null",
      "desiredOutcome": "string or null",
      "strategies": ["array of strategies from plan"],
      "supportCategories": ["array of support categories"],
      "targetDate": "string or null"
    }
  ],
  "supportCoordinatorName": "string or null",
  "planManagerName": "string or null",
  "extractionConfidence": number (0-100),
  "warnings": ["array of any issues found during extraction"]
}

**CONFIDENCE SCORING:**
- 90-100: All key fields found with high clarity
- 70-89: Most fields found, some optional fields missing
- 50-69: Core fields found but significant data missing
- Below 50: Document may not be a valid NDIS plan or is incomplete

If the document is clearly NOT an NDIS plan, set extractionConfidence to 0 and include appropriate warning.`;

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

// Check and update Pro usage count
async function checkProUsage(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  maxLimit: number
): Promise<{ canUsePro: boolean; currentCount: number }> {
  try {
    const { data, error } = await supabase.rpc('check_and_reset_pro_usage', {
      p_user_id: userId,
      p_document_type: 'ndis_plan_extraction',
    });

    if (error) {
      console.error('[Usage] Error checking usage:', error);
      return { canUsePro: true, currentCount: 0 };
    }

    const currentCount = data?.[0]?.current_count ?? 0;
    const canUsePro = currentCount < maxLimit;

    console.log(`[Usage] User ${userId.slice(0, 8)}... | DocType: ndis_plan_extraction | Count: ${currentCount}/${maxLimit} | CanUsePro: ${canUsePro}`);

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
      p_document_type: 'ndis_plan_extraction',
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

    const body: ExtractRequest = await req.json();
    console.log('[NDIS Extractor] Processing request...');

    // Get user ID from body or auth header
    let userId = body.userId;
    if (!userId) {
      const authHeader = req.headers.get('Authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        const { data: { user } } = await supabase.auth.getUser(token);
        userId = user?.id;
      }
    }

    // Validate input
    if (!body.content || body.content.trim().length < MIN_CONTENT_LENGTH) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Insufficient content. Please provide at least ${MIN_CONTENT_LENGTH} characters of document text.`,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine which model tier to use
    let usePremium = false;
    if (userId) {
      const isAdmin = await checkIsAdmin(supabase, userId);
      const maxLimit = isAdmin ? MAX_PRO_USES_PER_DAY_ADMIN : MAX_PRO_USES_PER_DAY;
      const { canUsePro } = await checkProUsage(supabase, userId, maxLimit);
      usePremium = canUsePro;
    }

    console.log('[NDIS Extractor] Using tier:', usePremium ? 'PREMIUM (Gemini 2.5 Pro)' : 'STANDARD (Gemini 2.0 Flash)');

    // Build the prompt
    const prompt = `
**NDIS PLAN DOCUMENT TO EXTRACT DATA FROM:**
---
${body.content}
---

Extract all available information from this NDIS plan document and return the structured JSON response as specified.
Remember: ONLY extract information that is explicitly stated. Do NOT invent or assume any data.
`;

    console.log('[NDIS Extractor] Extracting plan data...');
    const result = await gemini.generateWithTieredFallback<ExtractedPlanData>(
      prompt,
      EXTRACTION_SYSTEM_PROMPT,
      usePremium,
      true
    );

    if (!result.success) {
      console.error('[NDIS Extractor] Extraction failed:', result.error);
      return new Response(
        JSON.stringify({
          success: false,
          error: result.error || 'Failed to extract plan data'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Increment Pro usage if we used premium tier
    if (userId && result.tierUsed === 'premium') {
      await incrementProUsage(supabase, userId);
    }

    const data = result.data as ExtractedPlanData;
    const processingTime = Date.now() - startTime;

    // Validate and sanitize extracted data
    const sanitizedData: ExtractedPlanData = {
      participantName: data.participantName || '',
      ndisNumber: data.ndisNumber || '',
      dateOfBirth: data.dateOfBirth || undefined,
      planStartDate: data.planStartDate || '',
      planEndDate: data.planEndDate || '',
      planApprovalDate: data.planApprovalDate || undefined,
      planManagementType: data.planManagementType || 'plan-managed',
      funding: {
        total: Math.max(0, data.funding?.total || 0),
        core: Math.max(0, data.funding?.core || 0),
        capacityBuilding: Math.max(0, data.funding?.capacityBuilding || 0),
        capital: Math.max(0, data.funding?.capital || 0),
      },
      goals: (data.goals || []).map((g, i) => ({
        id: g.id || `goal-${i + 1}`,
        goalNumber: g.goalNumber || i + 1,
        title: g.title || `Goal ${i + 1}`,
        description: g.description || '',
        category: g.category || 'General',
        currentSituation: g.currentSituation || undefined,
        desiredOutcome: g.desiredOutcome || undefined,
        strategies: g.strategies || [],
        supportCategories: g.supportCategories || [],
        targetDate: g.targetDate || undefined,
      })),
      supportCoordinatorName: data.supportCoordinatorName || undefined,
      planManagerName: data.planManagerName || undefined,
      extractionConfidence: Math.max(0, Math.min(100, data.extractionConfidence || 0)),
      warnings: data.warnings || [],
    };

    console.log('[NDIS Extractor] Extraction successful');
    console.log('[NDIS Extractor] Tier used:', result.tierUsed);
    console.log('[NDIS Extractor] Confidence:', sanitizedData.extractionConfidence);
    console.log('[NDIS Extractor] Goals found:', sanitizedData.goals.length);
    console.log('[NDIS Extractor] Processing time:', processingTime, 'ms');

    return new Response(
      JSON.stringify({
        success: true,
        data: sanitizedData,
        model: result.model,
        tier: result.tierUsed,
        processingTime,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[NDIS Extractor] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
