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

    if (!body?.circumstances || body.circumstances.trim().length < 50) {
      return NextResponse.json({
        error: 'Insufficient detail',
        message: 'Please provide at least 50 characters describing the change in circumstances.'
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
    console.log('[CoC Assessor] Invoking Edge Function for user:', user.id);
    console.log('[CoC Assessor] Triggers:', body.triggers?.length || 0);

    // Pass user ID to Edge Function
    const { data, error } = await admin.functions.invoke('coc-eligibility-assessor', {
      body: {
        ...body,
        userId: user.id,
      }
    });

    if (error) {
      console.error('[CoC Assessor] Edge Function error:', {
        message: error.message,
        context: (error as any).context,
        name: error.name,
      });
      const status = (error as { context?: { status?: number } })?.context?.status ?? 500;
      return NextResponse.json({
        error: error.message || 'Assessment failed',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      }, { status });
    }

    console.log('[CoC Assessor] Success');
    return NextResponse.json(data);
  } catch (error) {
    console.error('[CoC Assessor] API route error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 });
  }
}
