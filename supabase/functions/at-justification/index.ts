/**
 * AT Justification Edge Function
 * Generates NDIS-compliant Assistive Technology justification narratives
 *
 * POST - Generate AT justification based on trial data and cost analysis
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { GeminiClient, SYSTEM_PROMPTS } from "../_shared/gemini.ts";

interface ATOption {
  name: string;
  cost: number;
  effectiveness: number; // 0-100
  participantPreference: number; // 0-100
  maintenanceCost: number;
  fundingSource: 'ndis' | 'private' | 'both';
}

interface ATJustificationRequest {
  participantName?: string;
  diagnosis?: string;
  functionalNeed: string;
  currentMethod: string;
  assessmentScores?: {
    tool: string;
    baseline: string;
    withAT: string;
  }[];
  selectedItem: ATOption;
  alternatives: ATOption[];
  goals?: string[];
}

const gemini = new GeminiClient();

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body: ATJustificationRequest = await req.json();
    console.log('[AT Justification] Processing request...');

    if (!body.functionalNeed || !body.selectedItem) {
      return new Response(
        JSON.stringify({ error: 'Functional need and selected item are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate weighted scores
    const calculateScore = (item: ATOption) => {
      const weights = {
        effectiveness: 0.40,
        costEfficiency: 0.25,
        preference: 0.20,
        maintenance: 0.15,
      };

      const costEfficiency = item.cost > 0 ? Math.max(0, 100 - (item.cost / 100)) : 100;
      const maintenanceScore = Math.max(0, 100 - item.maintenanceCost);

      return (
        item.effectiveness * weights.effectiveness +
        costEfficiency * weights.costEfficiency +
        item.participantPreference * weights.preference +
        maintenanceScore * weights.maintenance
      );
    };

    const selectedScore = calculateScore(body.selectedItem);
    const alternativeScores = body.alternatives.map(alt => ({
      ...alt,
      score: calculateScore(alt),
    }));

    // Build context prompt
    const contextPrompt = `
**Participant:** ${body.participantName || 'Not specified'}
**Primary Diagnosis:** ${body.diagnosis || 'Not specified'}

**Functional Need:**
${body.functionalNeed}

**Current Method (Without AT):**
${body.currentMethod}

${body.assessmentScores ? `**Assessment Results:**
${body.assessmentScores.map(a => `- ${a.tool}: Baseline ${a.baseline} → With AT ${a.withAT}`).join('\n')}` : ''}

**Selected Item: ${body.selectedItem.name}**
- Cost: $${body.selectedItem.cost.toLocaleString()}
- Effectiveness Score: ${body.selectedItem.effectiveness}/100
- Participant Preference: ${body.selectedItem.participantPreference}/100
- Annual Maintenance: $${body.selectedItem.maintenanceCost}
- 5-Year Total Cost: $${(body.selectedItem.cost + (body.selectedItem.maintenanceCost * 5)).toLocaleString()}
- Weighted Score: ${selectedScore.toFixed(1)}/100
- Funding Source: ${body.selectedItem.fundingSource.toUpperCase()}

**Alternatives Considered:**
${alternativeScores.map(alt => `
### ${alt.name}
- Cost: $${alt.cost.toLocaleString()}
- Effectiveness: ${alt.effectiveness}/100
- Participant Preference: ${alt.participantPreference}/100
- Annual Maintenance: $${alt.maintenanceCost}
- 5-Year Total Cost: $${(alt.cost + (alt.maintenanceCost * 5)).toLocaleString()}
- Weighted Score: ${alt.score.toFixed(1)}/100
`).join('\n')}

${body.goals ? `**Participant Goals:**
${body.goals.map((g, i) => `${i + 1}. ${g}`).join('\n')}` : ''}

**Scoring Weights Applied:**
- Effectiveness: 40%
- Cost Efficiency: 25%
- Participant Preference: 20%
- Maintenance Cost: 15%
`;

    console.log('[AT Justification] Generating justification narrative...');
    const result = await gemini.generate(
      contextPrompt,
      SYSTEM_PROMPTS.atJustification,
      'pro',
      false
    );

    if (!result.success) {
      console.error('[AT Justification] Generation failed:', result.error);
      return new Response(
        JSON.stringify({ error: result.error || 'Failed to generate justification' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[AT Justification] Generation successful');
    return new Response(
      JSON.stringify({
        success: true,
        narrative: result.data,
        analysis: {
          selectedScore,
          alternativeScores: alternativeScores.map(a => ({ name: a.name, score: a.score })),
          recommendation: selectedScore > Math.max(...alternativeScores.map(a => a.score))
            ? 'Selected item has highest weighted score'
            : 'Consider reviewing: an alternative scored higher',
        },
        model: result.model,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[AT Justification] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
