/**
 * SC Report Synthesizer API Route — V2
 *
 * Simplified proxy to the Supabase Edge Function.
 * Handles auth, validates input, and forwards to synthesize-report.
 * Fixes the reportContent/reportText parameter mismatch.
 */

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

    // Accept both reportText and reportContent for backward compatibility
    const reportText = body.reportText || body.reportContent;
    if (!reportText || reportText.length < 50) {
      return NextResponse.json(
        { error: 'Report content is required (minimum 50 characters)' },
        { status: 400 }
      );
    }

    const admin = createServiceRoleClient();

    const { data, error } = await admin.functions.invoke('synthesize-report', {
      body: {
        reportText,
        coordinatorNotes: body.coordinatorNotes,
        personaId: body.personaId || 'sc-level-2',
        participantName: body.participantName,
        ndisNumber: body.ndisNumber,
        userId: user.id,
      },
    });

    if (error) {
      console.error('[Report Synthesizer] Edge Function error:', error);
      return NextResponse.json(
        { error: error.message || 'Synthesis failed' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[Report Synthesizer] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
