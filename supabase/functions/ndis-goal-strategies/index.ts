/**
 * NDIS Goal Strategies Generator Edge Function
 * AI-powered generation of achievable strategies for NDIS goals
 *
 * Features:
 * - Generates practical, evidence-based strategies for achieving NDIS goals
 * - Tiered model usage: Premium (Gemini 2.5 Pro) with usage limits per 24h
 *   - Regular users: 2 Pro uses per 24h
 *   - Admin users: 10 Pro uses per 24h
 * - Focuses on realistic, actionable strategies
 *
 * POST - Generate strategies for NDIS goals
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { GeminiClient, ModelTier } from "../_shared/gemini.ts";

// Constants
const MAX_PRO_USES_PER_DAY = 2;
const MAX_PRO_USES_PER_DAY_ADMIN = 10;

interface NDISGoal {
  id: string;
  goalNumber: number;
  title: string;
  description: string;
  category: string;
  currentSituation?: string;
  desiredOutcome?: string;
  strategies?: string[];
  supportCategories?: string[];
}

interface StrategyRequest {
  goals: NDISGoal[];
  participantContext?: string;   // Any additional context about the participant
  userId?: string;
}

interface AIStrategy {
  strategyNumber: number;
  title: string;
  description: string;
  actionSteps: string[];
  timeframe: string;
  supportType: string;
  measurableOutcome: string;
  potentialBarriers?: string[];
  resources?: string[];
}

interface GoalWithAIStrategies {
  goalId: string;
  goalTitle: string;
  aiStrategies: AIStrategy[];
}

interface StrategiesResult {
  goalsWithStrategies: GoalWithAIStrategies[];
  generalRecommendations: string[];
}

const gemini = new GeminiClient();

// System prompt for strategy generation
const STRATEGIES_SYSTEM_PROMPT = `You are an expert NDIS Support Coordinator and Occupational Therapist with extensive experience helping participants achieve their goals. Your task is to generate practical, achievable strategies for NDIS goals.

**CRITICAL RULES:**
1. Generate ONLY realistic, evidence-based strategies
2. DO NOT hallucinate or make up unrealistic claims
3. Strategies must be achievable within NDIS funding frameworks
4. Focus on functional outcomes and participant choice
5. Consider the participant's current situation when suggesting strategies
6. Avoid medical advice - focus on support strategies
7. Be culturally sensitive and person-centered

**STRATEGY GENERATION PRINCIPLES:**

1. **Achievability:**
   - Break down goals into small, manageable steps
   - Consider realistic timeframes
   - Account for potential barriers
   - Build on participant's existing strengths

2. **NDIS Alignment:**
   - Strategies should align with NDIS reasonable and necessary criteria
   - Link to appropriate support categories (Core, Capacity Building, Capital)
   - Consider value for money
   - Focus on building independence where possible

3. **Person-Centered:**
   - Respect participant choice and control
   - Consider individual preferences and circumstances
   - Include family/informal support considerations
   - Flexible approaches that can be adapted

4. **Measurable Outcomes:**
   - Each strategy should have clear success indicators
   - Include progress milestones
   - Consider how outcomes can be documented

**OUTPUT FORMAT:**
Return a valid JSON object:
{
  "goalsWithStrategies": [
    {
      "goalId": "string",
      "goalTitle": "string",
      "aiStrategies": [
        {
          "strategyNumber": 1,
          "title": "Brief strategy title",
          "description": "Detailed description of the strategy",
          "actionSteps": ["Step 1", "Step 2", "Step 3"],
          "timeframe": "e.g., 3-6 months",
          "supportType": "e.g., Capacity Building - Daily Living",
          "measurableOutcome": "How success will be measured",
          "potentialBarriers": ["Barrier 1", "Barrier 2"],
          "resources": ["Resource 1", "Resource 2"]
        }
      ]
    }
  ],
  "generalRecommendations": [
    "Overall recommendation 1",
    "Overall recommendation 2"
  ]
}

Generate 2-3 practical strategies per goal. Focus on quality over quantity.`;

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

    if (error || !data) return false;
    return data.role === 'admin';
  } catch {
    return false;
  }
}

// Check Pro usage
async function checkProUsage(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  maxLimit: number
): Promise<{ canUsePro: boolean; currentCount: number }> {
  try {
    const { data, error } = await supabase.rpc('check_and_reset_pro_usage', {
      p_user_id: userId,
      p_document_type: 'ndis_goal_strategies',
    });

    if (error) return { canUsePro: true, currentCount: 0 };

    const currentCount = data?.[0]?.current_count ?? 0;
    return { canUsePro: currentCount < maxLimit, currentCount };
  } catch {
    return { canUsePro: true, currentCount: 0 };
  }
}

// Increment Pro usage
async function incrementProUsage(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<void> {
  try {
    await supabase.rpc('increment_pro_usage', {
      p_user_id: userId,
      p_document_type: 'ndis_goal_strategies',
    });
  } catch (error) {
    console.error('[Usage] Failed to increment:', error);
  }
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

    const body: StrategyRequest = await req.json();
    console.log('[Goal Strategies] Processing request...');

    // Get user ID
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
    if (!body.goals || body.goals.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No goals provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine model tier
    let usePremium = false;
    if (userId) {
      const isAdmin = await checkIsAdmin(supabase, userId);
      const maxLimit = isAdmin ? MAX_PRO_USES_PER_DAY_ADMIN : MAX_PRO_USES_PER_DAY;
      const { canUsePro } = await checkProUsage(supabase, userId, maxLimit);
      usePremium = canUsePro;
    }

    console.log('[Goal Strategies] Using tier:', usePremium ? 'PREMIUM' : 'STANDARD');

    // Build goals context
    const goalsContext = body.goals.map(g => `
Goal ${g.goalNumber}: ${g.title}
Description: ${g.description}
Category: ${g.category}
${g.currentSituation ? `Current Situation: ${g.currentSituation}` : ''}
${g.desiredOutcome ? `Desired Outcome: ${g.desiredOutcome}` : ''}
${g.strategies?.length ? `Existing Strategies from Plan: ${g.strategies.join('; ')}` : ''}
${g.supportCategories?.length ? `Support Categories: ${g.supportCategories.join(', ')}` : ''}
`).join('\n---\n');

    const prompt = `
**NDIS PARTICIPANT GOALS:**
${goalsContext}

${body.participantContext ? `**ADDITIONAL CONTEXT:**\n${body.participantContext}` : ''}

Generate practical, achievable AI strategies for each of these NDIS goals.
Focus on realistic outcomes that can be achieved within standard NDIS support frameworks.
Build upon any existing strategies from the plan rather than replacing them.
`;

    const result = await gemini.generateWithTieredFallback<StrategiesResult>(
      prompt,
      STRATEGIES_SYSTEM_PROMPT,
      usePremium,
      true
    );

    if (!result.success) {
      console.error('[Goal Strategies] Generation failed:', result.error);
      return new Response(
        JSON.stringify({ success: false, error: result.error || 'Failed to generate strategies' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Increment usage if premium
    if (userId && result.tierUsed === 'premium') {
      await incrementProUsage(supabase, userId);
    }

    const data = result.data as StrategiesResult;
    const processingTime = Date.now() - startTime;

    // Sanitize output
    const sanitizedData: StrategiesResult = {
      goalsWithStrategies: (data.goalsWithStrategies || []).map(g => ({
        goalId: g.goalId || '',
        goalTitle: g.goalTitle || '',
        aiStrategies: (g.aiStrategies || []).map((s, i) => ({
          strategyNumber: s.strategyNumber || i + 1,
          title: s.title || '',
          description: s.description || '',
          actionSteps: s.actionSteps || [],
          timeframe: s.timeframe || 'To be determined',
          supportType: s.supportType || 'General',
          measurableOutcome: s.measurableOutcome || '',
          potentialBarriers: s.potentialBarriers || [],
          resources: s.resources || [],
        })),
      })),
      generalRecommendations: data.generalRecommendations || [],
    };

    console.log('[Goal Strategies] Generation successful');
    console.log('[Goal Strategies] Strategies generated for', sanitizedData.goalsWithStrategies.length, 'goals');
    console.log('[Goal Strategies] Processing time:', processingTime, 'ms');

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
    console.error('[Goal Strategies] Error:', error);
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
