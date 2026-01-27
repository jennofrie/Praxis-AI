/**
 * Generate Weekly Summary Edge Function
 * Generates AI-powered weekly summaries for Support Coordinators.
 * Fetches activity logs from the database and summarizes into
 * structured sections: achievements, concerns, goal progress, recommendations.
 *
 * POST - Generate weekly summary for a date range
 * Model: gemini-2.0-flash (summarization)
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { GeminiClient } from "../_shared/gemini.ts";

const gemini = new GeminiClient();

const WEEKLY_SUMMARY_SYSTEM_PROMPT = `You are a Senior NDIS Support Coordinator generating a comprehensive weekly summary report. This summary will be used for team handover, supervisor reporting, and participant progress tracking.

Summary Structure:
Return a JSON object with this exact structure:

{
  "success": true,
  "summary": "Executive summary paragraph (2-3 sentences covering the week's highlights)",
  "sections": {
    "achievements": [
      "Achievement 1 - with specific participant outcomes",
      "Achievement 2 - with measurable progress indicators"
    ],
    "concerns": [
      "Concern 1 - including severity and recommended action",
      "Concern 2 - with risk level and timeline for resolution"
    ],
    "goalProgress": [
      "Goal 1: Description of progress made this week",
      "Goal 2: Description of progress or barriers encountered"
    ],
    "recommendations": [
      "Recommendation 1 - specific, actionable next step",
      "Recommendation 2 - with responsible party and timeframe"
    ],
    "activityStats": {
      "totalNotes": 0,
      "totalHours": 0,
      "participantsServed": 0
    }
  }
}

Content Guidelines:
1. Achievements: Focus on measurable outcomes, successful interventions, and participant milestones. Include specific examples.
2. Concerns: Flag any risks, missed appointments, behavioral changes, or service gaps. Rate severity (low/medium/high).
3. Goal Progress: Map activities to NDIS plan goals. Note any goals at risk of not being met.
4. Recommendations: Provide specific, actionable next steps for the following week. Assign responsibility where possible.
5. Activity Stats: Aggregate numerical data from the week's activities.

Critical Rules:
- Use NDIS-approved terminology throughout.
- Be factual and objective - avoid subjective assessments.
- Prioritize items by urgency and impact.
- Include at least 3 items in each section where data supports it.
- If insufficient data is provided for a section, include a note: "[Insufficient data for this period - manual review recommended]".
- Activity stats should be estimated from the available data. Set to 0 if no data is available.
- Reference specific dates where possible.
- Keep the executive summary concise but informative.`;

interface WeeklySummaryRequest {
  startDate: string;
  endDate: string;
  caseNotes?: string; // Optional manually provided notes
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: WeeklySummaryRequest = await req.json();
    console.log('[Weekly Summary] Processing for user:', user.id);

    if (!body.startDate || !body.endDate) {
      return new Response(
        JSON.stringify({ error: 'startDate and endDate are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const start = new Date(body.startDate);
    const end = new Date(body.endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return new Response(
        JSON.stringify({ error: 'startDate and endDate must be valid dates' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (start >= end) {
      return new Response(
        JSON.stringify({ error: 'startDate must be before endDate' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch activity logs for the date range
    const { data: activityLogs, error: logsError } = await supabase
      .from('activity_logs')
      .select('action, details, participant_id, hours_spent, created_at')
      .eq('user_id', user.id)
      .gte('created_at', body.startDate)
      .lte('created_at', body.endDate)
      .order('created_at', { ascending: true });

    if (logsError) {
      console.warn('[Weekly Summary] Error fetching activity logs:', logsError.message);
    }

    // Also fetch case notes history
    const { data: caseNotes, error: notesError } = await supabase
      .from('case_notes_history')
      .select('generated_note, input_content, created_at')
      .eq('user_id', user.id)
      .gte('created_at', body.startDate)
      .lte('created_at', body.endDate)
      .order('created_at', { ascending: true });

    if (notesError) {
      console.warn('[Weekly Summary] Error fetching case notes:', notesError.message);
    }

    // Build prompt with available data
    const promptParts: string[] = [];
    const startFormatted = start.toLocaleDateString('en-AU');
    const endFormatted = end.toLocaleDateString('en-AU');

    promptParts.push(`Reporting Period: ${startFormatted} to ${endFormatted}`);

    if (activityLogs && activityLogs.length > 0) {
      promptParts.push(`\nActivity Logs (${activityLogs.length} entries):`);
      const participantIds = new Set<string>();
      let totalHours = 0;

      for (const log of activityLogs) {
        const action = typeof log.action === 'string' ? log.action : '';
        const date = typeof log.created_at === 'string' ? log.created_at : '';
        const hours = typeof log.hours_spent === 'number' ? log.hours_spent : 0;
        const pid = typeof log.participant_id === 'string' ? log.participant_id : '';

        promptParts.push(`[${new Date(date).toLocaleDateString('en-AU')}] ${action}`);
        if (pid) participantIds.add(pid);
        totalHours += hours;
      }

      promptParts.push(`\nAggregate Data:`);
      promptParts.push(`- Total activities: ${activityLogs.length}`);
      promptParts.push(`- Total hours logged: ${totalHours}`);
      promptParts.push(`- Unique participants: ${participantIds.size}`);
    }

    if (caseNotes && caseNotes.length > 0) {
      promptParts.push(`\nCase Notes Generated (${caseNotes.length} entries):`);
      for (const note of caseNotes) {
        const date = typeof note.created_at === 'string' ? note.created_at : '';
        const content = typeof note.input_content === 'string' ? note.input_content.slice(0, 200) : '';
        promptParts.push(`[${new Date(date).toLocaleDateString('en-AU')}] ${content}...`);
      }
    }

    if (body.caseNotes) {
      promptParts.push(`\nManually Provided Notes:\n${body.caseNotes}`);
    }

    if ((!activityLogs || activityLogs.length === 0) && (!caseNotes || caseNotes.length === 0) && !body.caseNotes) {
      promptParts.push(`\nNote: No activity logs or case notes found for this period. Generate a summary template with placeholder guidance.`);
    }

    promptParts.push('\nGenerate a comprehensive weekly summary in the specified JSON format.');

    const prompt = promptParts.join('\n');

    const result = await gemini.generate(
      prompt,
      WEEKLY_SUMMARY_SYSTEM_PROMPT,
      'flash',
      true // Parse as JSON
    );

    if (!result.success || !result.data) {
      console.error('[Weekly Summary] AI generation failed:', result.error);
      return new Response(
        JSON.stringify({ error: result.error || 'Failed to generate weekly summary' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const processingTime = Date.now() - startTime;
    const summaryData = result.data as Record<string, unknown>;

    // Ensure sections exist with defaults
    const sections = (summaryData.sections || {}) as Record<string, unknown>;
    const activityStats = (sections.activityStats || {}) as Record<string, number>;

    const normalizedData = {
      success: true,
      summary: (summaryData.summary as string) || 'Summary generation completed.',
      sections: {
        achievements: (sections.achievements as string[]) || [],
        concerns: (sections.concerns as string[]) || [],
        goalProgress: (sections.goalProgress as string[]) || [],
        recommendations: (sections.recommendations as string[]) || [],
        activityStats: {
          totalNotes: activityStats.totalNotes || 0,
          totalHours: activityStats.totalHours || 0,
          participantsServed: activityStats.participantsServed || 0,
        },
      },
    };

    console.log('[Weekly Summary] Success | Period:', startFormatted, '-', endFormatted, '| Time:', processingTime, 'ms');

    return new Response(
      JSON.stringify({
        success: true,
        data: normalizedData,
        model: result.model,
        processingTime,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Weekly Summary] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
