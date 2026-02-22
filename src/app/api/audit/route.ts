/**
 * POST /api/audit
 * Client-facing audit event logger. Wraps logAuditEvent server-side.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, resourceType, resourceId, resourceName } = body;

    if (!action || !resourceType) {
      return NextResponse.json({ error: 'action and resourceType required' }, { status: 400 });
    }

    await logAuditEvent(user.id, action, resourceType, resourceId, resourceName);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Audit API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
