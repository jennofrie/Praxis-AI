import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    if (!body?.content || body.content.trim().length < 200) {
      return NextResponse.json({
        error: 'Insufficient content',
        message: 'Please provide at least 200 characters of document text for extraction.'
      }, { status: 400 });
    }

    // CRITICAL: Verify service role key is available
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[CRITICAL] SUPABASE_SERVICE_ROLE_KEY not found in process.env');
      return NextResponse.json({
        error: 'Server configuration error: Service role key not configured.'
      }, { status: 500 });
    }

    const admin = createServiceRoleClient();

    // Log the invocation
    console.log('[NDIS Extractor] Invoking Edge Function for user:', user.id);

    // Pass user ID to Edge Function for tiered model usage tracking
    const { data, error } = await admin.functions.invoke('ndis-plan-extractor', {
      body: {
        ...body,
        userId: user.id,
      }
    });

    if (error) {
      console.error('[NDIS Extractor] Edge Function error:', {
        message: error.message,
        context: (error as { context?: { status?: number } }).context,
        name: error.name,
      });
      const status = (error as { context?: { status?: number } })?.context?.status ?? 500;
      return NextResponse.json({
        error: error.message || 'Extraction failed',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      }, { status });
    }

    console.log('[NDIS Extractor] Success');
    return NextResponse.json(data);
  } catch (error) {
    console.error('[NDIS Extractor] API route error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 });
  }
}
