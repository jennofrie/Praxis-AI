/**
 * Quality Checker Edge Function
 * NDIS compliance auditing for clinical reports
 *
 * POST - Analyze report content for NDIS compliance risks
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { GeminiClient, SYSTEM_PROMPTS } from "../_shared/gemini.ts";

interface QualityCheckerRequest {
  content: string;
  reportType?: 'fca' | 'at-justification' | 'progress-note' | 'other';
}

interface QualityIssue {
  phrase: string;
  category: 'terminology' | 'evidence' | 'reasoning';
  explanation: string;
  suggestion: string;
}

interface QualityResult {
  riskScore: number;
  terminologyScore: number;
  evidenceScore: number;
  reasoningScore: number;
  issues: QualityIssue[];
  summary: string;
}

const gemini = new GeminiClient();

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body: QualityCheckerRequest = await req.json();
    console.log('[Quality Checker] Processing request...');
    console.log('[Quality Checker] Report type:', body.reportType || 'general');

    if (!body.content) {
      return new Response(
        JSON.stringify({ error: 'Report content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const prompt = `
**Report Type:** ${body.reportType || 'General Clinical Report'}

**Content to Audit:**
${body.content}
`;

    console.log('[Quality Checker] Analyzing content...');
    const result = await gemini.generate<QualityResult>(
      prompt,
      SYSTEM_PROMPTS.qualityChecker,
      'pro',
      true
    );

    if (!result.success) {
      console.error('[Quality Checker] Analysis failed:', result.error);
      return new Response(
        JSON.stringify({ error: result.error || 'Failed to analyze report' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = result.data as QualityResult;

    // Calculate pass/fail status
    const passThreshold = 75;
    const qualityScore = 100 - data.riskScore;
    const status = qualityScore >= passThreshold ? 'pass' : 'fail';

    // Categorize issues by severity
    const issuesBySeverity = {
      error: data.issues.filter(i => i.category === 'evidence'),
      warning: data.issues.filter(i => i.category === 'reasoning'),
      suggestion: data.issues.filter(i => i.category === 'terminology'),
    };

    console.log('[Quality Checker] Analysis successful');
    console.log('[Quality Checker] Quality score:', qualityScore, '- Status:', status);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          ...data,
          qualityScore,
          status,
          issuesBySeverity,
          passThreshold,
          readyForSubmission: qualityScore >= passThreshold && issuesBySeverity.error.length === 0,
        },
        model: result.model,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Quality Checker] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
