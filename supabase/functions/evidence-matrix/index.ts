/**
 * Evidence Matrix Edge Function
 * Maps clinical notes to NDIS functional domains with confidence scoring
 *
 * POST - Analyze clinical notes and extract evidence mappings
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { GeminiClient, SYSTEM_PROMPTS, AIProvider } from "../_shared/gemini.ts";

interface EvidenceMatrixRequest {
  notes: string;
  existingEvidence?: {
    domain: string;
    observations: string[];
  }[];
  // AI Provider settings
  provider?: AIProvider;
  enableFallback?: boolean;
}

const gemini = new GeminiClient();

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body: EvidenceMatrixRequest = await req.json();
    console.log('[Evidence Matrix] Processing request...');

    // Get provider settings from request
    const preferredProvider: AIProvider = body.provider || 'gemini';
    const enableFallback = body.enableFallback !== false;
    console.log('[Evidence Matrix] Provider:', preferredProvider, '| Fallback:', enableFallback);

    if (!body.notes) {
      return new Response(
        JSON.stringify({ error: 'Clinical notes are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let prompt = body.notes;

    // Include existing evidence if provided (for incremental updates)
    if (body.existingEvidence && body.existingEvidence.length > 0) {
      prompt += `\n\n**Existing Evidence (update and add to this):**\n`;
      body.existingEvidence.forEach(e => {
        prompt += `\n${e.domain}:\n${e.observations.map(o => `- ${o}`).join('\n')}`;
      });
    }

    console.log('[Evidence Matrix] Analyzing notes...');
    const result = await gemini.generateWithProviderFallback(
      prompt,
      SYSTEM_PROMPTS.evidenceMatrix,
      'pro',
      true,
      preferredProvider,
      enableFallback
    );

    if (!result.success) {
      console.error('[Evidence Matrix] Analysis failed:', result.error);
      return new Response(
        JSON.stringify({ error: result.error || 'Failed to analyze notes' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[Evidence Matrix] Analysis successful');
    return new Response(
      JSON.stringify({
        success: true,
        data: result.data,
        model: result.model,
        provider: result.provider,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Evidence Matrix] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
