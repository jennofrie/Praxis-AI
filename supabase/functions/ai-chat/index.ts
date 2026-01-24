/**
 * AI Chat Edge Function
 * General-purpose AI assistant for NDIS clinical documentation
 *
 * POST - Send message and get AI response
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { GeminiClient, SYSTEM_PROMPTS } from "../_shared/gemini.ts";

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

interface AIChatRequest {
  message: string;
  context?: {
    participantName?: string;
    currentPage?: string;
    recentActivity?: string[];
  };
  conversationHistory?: ChatMessage[];
  mode?: 'general' | 'draft-notes' | 'explain' | 'template';
}

const gemini = new GeminiClient();

// Mode-specific instructions
const MODE_INSTRUCTIONS: Record<string, string> = {
  general: 'Provide helpful, professional assistance for NDIS clinical documentation.',
  'draft-notes': 'Help draft clinical session notes. Use NDIS-compliant terminology and structure.',
  explain: 'Explain NDIS concepts, requirements, or clinical reasoning in clear, accessible language.',
  template: 'Provide templates and structured formats for common NDIS documents.',
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body: AIChatRequest = await req.json();
    console.log('[AI Chat] Processing request...');
    console.log('[AI Chat] Mode:', body.mode || 'general');

    if (!body.message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build conversation context
    let conversationContext = '';

    if (body.conversationHistory && body.conversationHistory.length > 0) {
      // Include last 10 messages for context
      const recentHistory = body.conversationHistory.slice(-10);
      conversationContext = `
**Conversation History:**
${recentHistory.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n')}

`;
    }

    // Build context from current session
    let sessionContext = '';
    if (body.context) {
      const ctx = body.context;
      sessionContext = `
**Current Context:**
${ctx.participantName ? `- Working with participant: ${ctx.participantName}` : ''}
${ctx.currentPage ? `- Current page: ${ctx.currentPage}` : ''}
${ctx.recentActivity ? `- Recent activity: ${ctx.recentActivity.join(', ')}` : ''}

`;
    }

    // Mode-specific instruction
    const modeInstruction = MODE_INSTRUCTIONS[body.mode || 'general'] || MODE_INSTRUCTIONS.general;

    const fullPrompt = `${sessionContext}${conversationContext}**Current Request:**
${body.message}

**Mode Instructions:**
${modeInstruction}`;

    console.log('[AI Chat] Generating response...');
    const result = await gemini.generate(
      fullPrompt,
      SYSTEM_PROMPTS.aiChat,
      'pro',
      false
    );

    if (!result.success) {
      console.error('[AI Chat] Generation failed:', result.error);
      return new Response(
        JSON.stringify({ error: result.error || 'Failed to generate response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[AI Chat] Response generated successfully');

    // Parse response for any structured elements (templates, lists, etc.)
    const response = result.data as string;

    // Detect if response contains code blocks or structured content
    const hasCodeBlock = response.includes('```');
    const hasList = response.includes('\n- ') || response.includes('\n1. ');
    const hasTemplate = response.toLowerCase().includes('template') || response.includes('---');

    return new Response(
      JSON.stringify({
        success: true,
        response: response,
        metadata: {
          model: result.model,
          mode: body.mode || 'general',
          hasCodeBlock,
          hasList,
          hasTemplate,
          timestamp: new Date().toISOString(),
        },
        suggestions: generateSuggestions(body.message, body.mode),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[AI Chat] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Generate follow-up suggestions based on the request
function generateSuggestions(message: string, mode?: string): string[] {
  const suggestions: string[] = [];
  const lowerMessage = message.toLowerCase();

  // Context-aware suggestions
  if (lowerMessage.includes('fca') || lowerMessage.includes('functional capacity')) {
    suggestions.push('Check FCA for compliance issues');
    suggestions.push('Generate evidence matrix');
  }

  if (lowerMessage.includes('at') || lowerMessage.includes('assistive technology')) {
    suggestions.push('Generate AT justification');
    suggestions.push('Compare AT options');
  }

  if (lowerMessage.includes('goal') || lowerMessage.includes('progress')) {
    suggestions.push('Analyze goal progress');
    suggestions.push('Suggest goal modifications');
  }

  if (lowerMessage.includes('session') || lowerMessage.includes('notes')) {
    suggestions.push('Map notes to domains');
    suggestions.push('Check terminology compliance');
  }

  // Mode-specific suggestions
  if (mode === 'draft-notes') {
    suggestions.push('Convert to SOAP format');
    suggestions.push('Add clinical observations');
  }

  if (mode === 'template') {
    suggestions.push('Show progress report template');
    suggestions.push('Show FCA template');
  }

  // Default suggestions if none matched
  if (suggestions.length === 0) {
    suggestions.push('Draft session notes');
    suggestions.push('Explain NDIS terminology');
    suggestions.push('Check report compliance');
  }

  return suggestions.slice(0, 4); // Return max 4 suggestions
}
