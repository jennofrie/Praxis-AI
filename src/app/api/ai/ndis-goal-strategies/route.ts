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

    if (!body?.goals || body.goals.length === 0) {
      return NextResponse.json({
        error: 'No goals provided',
        message: 'Please provide at least one goal to generate strategies for.'
      }, { status: 400 });
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[CRITICAL] SUPABASE_SERVICE_ROLE_KEY not found');
      return NextResponse.json({
        error: 'Server configuration error'
      }, { status: 500 });
    }

    const admin = createServiceRoleClient();

    console.log('[Goal Strategies] Invoking Edge Function for user:', user.id);
    console.log('[Goal Strategies] Goals count:', body.goals.length);

    const { data, error } = await admin.functions.invoke('ndis-goal-strategies', {
      body: {
        ...body,
        userId: user.id,
      }
    });

    if (error) {
      console.error('[Goal Strategies] Edge Function error:', error);
      const status = (error as { context?: { status?: number } })?.context?.status ?? 500;
      return NextResponse.json({
        error: error.message || 'Strategy generation failed',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      }, { status });
    }

    console.log('[Goal Strategies] Success');
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Goal Strategies] API route error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 });
  }
}
