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

    if (!body?.documentType) {
      return NextResponse.json({ error: 'Document type is required' }, { status: 400 });
    }

    // CRITICAL: Verify service role key is available
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[CRITICAL] SUPABASE_SERVICE_ROLE_KEY not found in process.env');
      console.error('[CRITICAL] Available env vars:', Object.keys(process.env).filter(k => k.includes('SUPABASE')));
      return NextResponse.json({
        error: 'Server configuration error: Service role key not configured. Please restart your dev server.'
      }, { status: 500 });
    }

    const admin = createServiceRoleClient();

    // Log the invocation (but not the full content for privacy)
    console.log('[Senior Planner Audit] Invoking Edge Function for document type:', body.documentType);

    // Pass user ID to Edge Function for tiered model usage tracking
    const { data, error } = await admin.functions.invoke('senior-planner-audit', {
      body: {
        ...body,
        userId: user.id,
      }
    });

    if (error) {
      console.error('[Senior Planner Audit] Edge Function error:', {
        message: error.message,
        context: (error as any).context,
        name: error.name,
      });
      const status = (error as { context?: { status?: number } })?.context?.status ?? 500;
      return NextResponse.json({
        error: error.message || 'Audit failed',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      }, { status });
    }

    console.log('[Senior Planner Audit] Success');
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Senior Planner Audit] API route error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 });
  }
}
