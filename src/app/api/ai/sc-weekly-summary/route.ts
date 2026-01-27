/**
 * SC Weekly Summary API Route
 *
 * Generates AI-powered weekly summaries for Support Coordinators.
 * Aggregates case notes, participant interactions, and activity data
 * within a specified date range into structured summary sections
 * including achievements, concerns, goal progress, and recommendations.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { gemini } from '@/lib/gemini';
import type { WeeklySummaryResult, WeeklySummarySections } from '@/types/sc-toolkit';

const WEEKLY_SUMMARY_SYSTEM_PROMPT = `You are a Senior NDIS Support Coordinator generating a comprehensive weekly summary report. This summary will be used for team handover, supervisor reporting, and participant progress tracking.

**Summary Structure:**
Return a JSON object with this exact structure:

{
  "success": true,
  "summary": "Executive summary paragraph (2-3 sentences covering the week's highlights)",
  "sections": {
    "achievements": [
      "Achievement 1 — with specific participant outcomes",
      "Achievement 2 — with measurable progress indicators"
    ],
    "concerns": [
      "Concern 1 — including severity and recommended action",
      "Concern 2 — with risk level and timeline for resolution"
    ],
    "goalProgress": [
      "Goal 1: Description of progress made this week",
      "Goal 2: Description of progress or barriers encountered"
    ],
    "recommendations": [
      "Recommendation 1 — specific, actionable next step",
      "Recommendation 2 — with responsible party and timeframe"
    ],
    "activityStats": {
      "totalNotes": 0,
      "totalHours": 0,
      "participantsServed": 0
    }
  }
}

**Content Guidelines:**
1. **Achievements:** Focus on measurable outcomes, successful interventions, and participant milestones. Include specific examples.
2. **Concerns:** Flag any risks, missed appointments, behavioral changes, or service gaps. Rate severity (low/medium/high).
3. **Goal Progress:** Map activities to NDIS plan goals. Note any goals at risk of not being met.
4. **Recommendations:** Provide specific, actionable next steps for the following week. Assign responsibility where possible.
5. **Activity Stats:** Aggregate numerical data from the week's activities.

**Critical Rules:**
- Use NDIS-approved terminology throughout.
- Be factual and objective — avoid subjective assessments.
- Prioritize items by urgency and impact.
- Include at least 3 items in each section where data supports it.
- If insufficient data is provided for a section, include a note: "[Insufficient data for this period — manual review recommended]".
- Activity stats should be estimated from the available data. Set to 0 if no data is available.
- Reference specific dates where possible.
- Keep the executive summary concise but informative.`;

/**
 * Validate ISO date string format
 */
function isValidDateString(value: string): boolean {
  const date = new Date(value);
  return !isNaN(date.getTime());
}

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body: unknown = await request.json();

    if (typeof body !== 'object' || body === null) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const requestBody = body as Record<string, unknown>;
    const startDate = typeof requestBody.startDate === 'string' ? requestBody.startDate : '';
    const endDate = typeof requestBody.endDate === 'string' ? requestBody.endDate : '';

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      );
    }

    if (!isValidDateString(startDate) || !isValidDateString(endDate)) {
      return NextResponse.json(
        { error: 'startDate and endDate must be valid date strings' },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      return NextResponse.json(
        { error: 'startDate must be before endDate' },
        { status: 400 }
      );
    }

    // Fetch case notes and activity data for the date range from the database
    const { data: caseNotes, error: notesError } = await supabase
      .from('case_notes')
      .select('content, created_at, participant_id, hours_spent')
      .eq('user_id', user.id)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: true });

    if (notesError) {
      console.warn('[SC Weekly Summary] Error fetching case notes:', notesError.message);
      // Continue without database data — AI will generate based on date range context
    }

    // Build prompt with available data
    const promptParts: string[] = [];

    promptParts.push(`**Reporting Period:** ${new Date(startDate).toLocaleDateString('en-AU')} to ${new Date(endDate).toLocaleDateString('en-AU')}`);

    if (caseNotes && caseNotes.length > 0) {
      promptParts.push(`\n**Case Notes for this period (${caseNotes.length} entries):**`);

      // Extract unique participant IDs for count
      const participantIds = new Set<string>();
      let totalHours = 0;

      for (const note of caseNotes) {
        const noteContent = typeof note.content === 'string' ? note.content : '';
        const noteDate = typeof note.created_at === 'string' ? note.created_at : '';
        const noteHours = typeof note.hours_spent === 'number' ? note.hours_spent : 0;
        const participantId = typeof note.participant_id === 'string' ? note.participant_id : '';

        promptParts.push(`\n[${new Date(noteDate).toLocaleDateString('en-AU')}] ${noteContent}`);

        if (participantId) {
          participantIds.add(participantId);
        }
        totalHours += noteHours;
      }

      promptParts.push(`\n**Aggregate Data:**`);
      promptParts.push(`- Total case notes: ${caseNotes.length}`);
      promptParts.push(`- Total hours logged: ${totalHours}`);
      promptParts.push(`- Unique participants: ${participantIds.size}`);
    } else {
      promptParts.push(`\n**Note:** No case notes found in the database for this period. Generate a summary template with placeholder guidance for the coordinator to complete manually.`);
    }

    promptParts.push('\n---\nGenerate a comprehensive weekly summary in the specified JSON format.');

    const prompt = promptParts.join('\n');

    // Call AI — use 'flash' model for weekly summaries
    const result = await gemini.generate<WeeklySummaryResult>(
      prompt,
      WEEKLY_SUMMARY_SYSTEM_PROMPT,
      'flash',
      true
    );

    if (!result.success || !result.data) {
      console.error('[SC Weekly Summary] AI generation failed:', result.error);
      return NextResponse.json(
        { error: result.error || 'Failed to generate weekly summary' },
        { status: 500 }
      );
    }

    const summaryData = result.data;

    // Ensure all sections exist with defaults
    const sections: WeeklySummarySections = {
      achievements: summaryData.sections?.achievements || [],
      concerns: summaryData.sections?.concerns || [],
      goalProgress: summaryData.sections?.goalProgress || [],
      recommendations: summaryData.sections?.recommendations || [],
      activityStats: {
        totalNotes: summaryData.sections?.activityStats?.totalNotes || 0,
        totalHours: summaryData.sections?.activityStats?.totalHours || 0,
        participantsServed: summaryData.sections?.activityStats?.participantsServed || 0,
      },
    };

    const weeklySummaryResult: WeeklySummaryResult = {
      success: true,
      summary: summaryData.summary || 'Summary generation completed.',
      sections,
    };

    console.log('[SC Weekly Summary] Success for user:', user.id);

    return NextResponse.json({
      success: true,
      data: weeklySummaryResult,
    });
  } catch (error) {
    console.error('[SC Weekly Summary] API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
