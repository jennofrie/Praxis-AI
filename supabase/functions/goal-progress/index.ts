/**
 * Goal Progress Edge Function
 * Analyzes session notes to track NDIS goal progress
 *
 * POST - Analyze sessions and generate progress summary
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { GeminiClient, SYSTEM_PROMPTS, AIProvider } from "../_shared/gemini.ts";

interface Session {
  date: string;
  notes: string;
  indicators?: string[];
}

interface GoalProgressRequest {
  participantName?: string;
  goal: {
    description: string;
    targetDate?: string;
    baseline?: string;
    target?: string;
  };
  sessions: Session[];
  // AI Provider settings
  provider?: AIProvider;
  enableFallback?: boolean;
}

interface GoalProgressResult {
  status: 'Progressing' | 'Stable' | 'Regressing' | 'Achieved';
  summaryNarrative: string;
  keyObservations: string[];
  recommendations: string[];
  suggestedGoalModification: string | null;
  metrics?: {
    totalSessions: number;
    positiveIndicators: number;
    neutralIndicators: number;
    regressionIndicators: number;
    progressRatio: number;
    daysRemaining?: number;
  };
}

const gemini = new GeminiClient();

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body: GoalProgressRequest = await req.json();
    console.log('[Goal Progress] Processing request...');

    // Get provider settings from request
    const preferredProvider: AIProvider = body.provider || 'gemini';
    const enableFallback = body.enableFallback !== false;
    console.log('[Goal Progress] Provider:', preferredProvider, '| Fallback:', enableFallback);

    if (!body.goal || !body.sessions || body.sessions.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Goal and at least one session are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate days remaining if target date provided
    let daysRemaining: number | undefined;
    if (body.goal.targetDate) {
      const targetDate = new Date(body.goal.targetDate);
      const today = new Date();
      daysRemaining = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    }

    const contextPrompt = `
**Participant:** ${body.participantName || 'Not specified'}

**Goal:**
${body.goal.description}
${body.goal.baseline ? `- Baseline: ${body.goal.baseline}` : ''}
${body.goal.target ? `- Target: ${body.goal.target}` : ''}
${body.goal.targetDate ? `- Target Date: ${body.goal.targetDate} (${daysRemaining} days remaining)` : ''}

**Session History (Chronological):**
${body.sessions.map(s => `
### ${s.date}
${s.notes}
${s.indicators ? `**Indicators:** ${s.indicators.join(', ')}` : ''}
`).join('\n')}

**Analysis Required:**
1. Determine overall progress trajectory
2. Identify key observations from sessions
3. Recommend next steps
4. Suggest any goal modifications if needed
`;

    console.log('[Goal Progress] Analyzing sessions...');
    const result = await gemini.generateWithProviderFallback<GoalProgressResult>(
      contextPrompt,
      SYSTEM_PROMPTS.goalProgress,
      'pro',
      true,
      preferredProvider,
      enableFallback
    );

    if (!result.success) {
      console.error('[Goal Progress] Analysis failed:', result.error);
      return new Response(
        JSON.stringify({ error: result.error || 'Failed to analyze progress' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = result.data as GoalProgressResult;

    // Calculate basic metrics
    const totalSessions = body.sessions.length;
    let positiveIndicators = 0;
    let neutralIndicators = 0;
    let regressionIndicators = 0;

    body.sessions.forEach(s => {
      if (s.indicators) {
        s.indicators.forEach(i => {
          const lower = i.toLowerCase();
          if (lower.includes('improve') || lower.includes('progress') || lower.includes('increase')) {
            positiveIndicators++;
          } else if (lower.includes('decline') || lower.includes('regress') || lower.includes('decrease')) {
            regressionIndicators++;
          } else {
            neutralIndicators++;
          }
        });
      }
    });

    const totalIndicators = positiveIndicators + neutralIndicators + regressionIndicators;
    const progressRatio = totalIndicators > 0
      ? Math.round((positiveIndicators / totalIndicators) * 100)
      : 50;

    console.log('[Goal Progress] Analysis successful');
    console.log('[Goal Progress] Status:', data.status, '- Progress ratio:', progressRatio + '%');

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          ...data,
          metrics: {
            totalSessions,
            positiveIndicators,
            neutralIndicators,
            regressionIndicators,
            progressRatio,
            daysRemaining,
          },
        },
        model: result.model,
        provider: result.provider,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Goal Progress] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
