/**
 * AI Chat API Route
 * Proxies to Supabase Edge Function and manages conversation persistence
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message, conversationId, mode, provider, enableFallback, context } = body;

    if (!message || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Get conversation history if conversation exists
    let conversationHistory: Array<{ role: string; content: string }> = [];
    let activeConversationId = conversationId;

    if (conversationId) {
      const { data: messages } = await supabase
        .from('ai_messages')
        .select('role, content')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(10);

      if (messages) {
        conversationHistory = messages.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));
      }
    } else {
      // Create a new conversation
      const { data: newConversation, error: convError } = await supabase
        .from('ai_conversations')
        .insert({
          user_id: user.id,
          title: message.substring(0, 50),
        })
        .select()
        .single();

      if (convError) {
        console.error('Error creating conversation:', convError);
      } else {
        activeConversationId = newConversation.id;
      }
    }

    // Save user message
    if (activeConversationId) {
      await supabase
        .from('ai_messages')
        .insert({
          conversation_id: activeConversationId,
          user_id: user.id,
          role: 'user',
          content: message,
        });
    }

    // Call Supabase Edge Function
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const response = await fetch(`${supabaseUrl}/functions/v1/ai-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        message,
        conversationId: activeConversationId,
        userId: user.id,
        conversationHistory,
        mode: mode || 'general',
        provider: provider || 'gemini',
        enableFallback: enableFallback !== false,
        context,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || 'AI service error' },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Save assistant response
    if (activeConversationId && data.success) {
      await supabase
        .from('ai_messages')
        .insert({
          conversation_id: activeConversationId,
          user_id: user.id,
          role: 'assistant',
          content: data.response,
          model_used: data.metadata?.model,
          provider: data.metadata?.provider,
          response_time_ms: data.metadata?.responseTimeMs,
          token_count: data.metadata?.estimatedTokens,
          is_cached: data.metadata?.cached || false,
          metadata: data.metadata || {},
        });
    }

    return NextResponse.json({
      ...data,
      conversationId: activeConversationId,
    });
  } catch (error) {
    console.error('AI Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
