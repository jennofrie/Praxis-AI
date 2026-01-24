import { NextRequest, NextResponse } from 'next/server';
import { gemini, SYSTEM_PROMPTS } from '@/lib/gemini';

interface SessionNote {
  date: string;
  content: string;
  progressIndicator: 'positive' | 'neutral' | 'regression';
}

interface GoalProgressRequest {
  goalTitle: string;
  goalDomain: string;
  targetDate?: string;
  sessions: SessionNote[];
  currentStatus?: 'not-started' | 'in-progress' | 'achieved' | 'on-hold';
}

interface GoalProgressResponse {
  status: 'Progressing' | 'Stable' | 'Regressing' | 'Achieved';
  summaryNarrative: string;
  keyObservations: string[];
  recommendations: string[];
  suggestedGoalModification: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const body: GoalProgressRequest = await request.json();

    if (!body.goalTitle || !body.sessions || body.sessions.length === 0) {
      return NextResponse.json(
        { error: 'Goal title and at least one session are required' },
        { status: 400 }
      );
    }

    // Format sessions for the prompt
    const sessionsFormatted = body.sessions
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(s => `**${s.date}** [${s.progressIndicator.toUpperCase()}]:\n${s.content}`)
      .join('\n\n');

    const prompt = `
**Goal:** ${body.goalTitle}
**Domain:** ${body.goalDomain}
**Target Date:** ${body.targetDate || 'Not specified'}
**Current Status:** ${body.currentStatus || 'In Progress'}
**Total Sessions:** ${body.sessions.length}

**Session Notes (chronological order):**
${sessionsFormatted}

---

Analyze the progress trajectory and provide a comprehensive summary.
`;

    const result = await gemini.generate<GoalProgressResponse>(
      prompt,
      SYSTEM_PROMPTS.goalProgress,
      'pro',
      true
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to analyze goal progress' },
        { status: 500 }
      );
    }

    const data = result.data as GoalProgressResponse;

    // Calculate progress metrics
    const positiveCount = body.sessions.filter(s => s.progressIndicator === 'positive').length;
    const regressionCount = body.sessions.filter(s => s.progressIndicator === 'regression').length;
    const progressRatio = positiveCount / body.sessions.length;

    return NextResponse.json({
      success: true,
      data: {
        ...data,
        metrics: {
          totalSessions: body.sessions.length,
          positiveIndicators: positiveCount,
          neutralIndicators: body.sessions.length - positiveCount - regressionCount,
          regressionIndicators: regressionCount,
          progressRatio: Math.round(progressRatio * 100),
          daysRemaining: body.targetDate 
            ? Math.ceil((new Date(body.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            : null,
        },
      },
      model: result.model,
    });
  } catch (error) {
    console.error('Goal Progress API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
