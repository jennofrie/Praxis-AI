/**
 * FCA Pipeline Edge Function
 * Handles domain mapping and narrative generation for Functional Capacity Assessments
 *
 * Endpoints:
 * - POST with action: "map-domains" - Analyze clinical notes and map to NDIS domains
 * - POST with action: "generate-narrative" - Generate professional FCA narrative
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { GeminiClient, SYSTEM_PROMPTS } from "../_shared/gemini.ts";

interface DomainObservation {
  domain: string;
  observations: string[];
  confidence: 'high' | 'medium' | 'low';
}

interface FCAPipelineRequest {
  action: 'map-domains' | 'generate-narrative';
  notes?: string;
  participantName?: string;
  diagnosis?: string;
  domains?: DomainObservation[];
  goals?: string[];
}

const gemini = new GeminiClient();

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body: FCAPipelineRequest = await req.json();
    console.log('[FCA Pipeline] Action:', body.action);

    if (body.action === 'map-domains') {
      if (!body.notes) {
        return new Response(
          JSON.stringify({ error: 'Clinical notes are required for domain mapping' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('[FCA Pipeline] Mapping domains from notes...');
      const result = await gemini.generate(
        body.notes,
        SYSTEM_PROMPTS.domainMapping,
        'pro',
        true
      );

      if (!result.success) {
        console.error('[FCA Pipeline] Domain mapping failed:', result.error);
        return new Response(
          JSON.stringify({ error: result.error || 'Failed to analyze notes' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('[FCA Pipeline] Domain mapping successful');
      return new Response(
        JSON.stringify({
          success: true,
          data: result.data,
          model: result.model,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (body.action === 'generate-narrative') {
      if (!body.domains || body.domains.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Domain observations are required for narrative generation' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const contextPrompt = `
**Participant:** ${body.participantName || 'Not specified'}
**Primary Diagnosis:** ${body.diagnosis || 'Not specified'}

**Domain Observations:**
${body.domains.map(d => `
### ${d.domain} (Confidence: ${d.confidence})
${d.observations.map(o => `- ${o}`).join('\n')}
`).join('\n')}

${body.goals ? `**Goals:**\n${body.goals.map((g, i) => `${i + 1}. ${g}`).join('\n')}` : ''}
`;

      console.log('[FCA Pipeline] Generating narrative...');
      const result = await gemini.generate(
        contextPrompt,
        SYSTEM_PROMPTS.fcaPipeline,
        'pro',
        false
      );

      if (!result.success) {
        console.error('[FCA Pipeline] Narrative generation failed:', result.error);
        return new Response(
          JSON.stringify({ error: result.error || 'Failed to generate narrative' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('[FCA Pipeline] Narrative generation successful');
      return new Response(
        JSON.stringify({
          success: true,
          narrative: result.data,
          model: result.model,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use "map-domains" or "generate-narrative"' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[FCA Pipeline] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
