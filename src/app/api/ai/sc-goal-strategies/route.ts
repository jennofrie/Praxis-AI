/**
 * SC Goal Strategies API Route
 *
 * Generates NDIS-compliant goal strategies specifically for Support Coordinators.
 * Produces actionable, measurable strategies aligned with participants' NDIS plan
 * goals, including implementation steps, progress indicators, and review timelines.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { gemini } from '@/lib/gemini';
import type { SCGoalStrategiesResult } from '@/types/sc-toolkit';

const SC_GOAL_STRATEGIES_SYSTEM_PROMPT = `You are an expert NDIS Support Coordinator with 15+ years of experience developing goal strategies for NDIS participants. You specialize in creating practical, measurable, and NDIS-compliant strategies that Support Coordinators can implement to help participants achieve their plan goals.

**Your Mandate:**
Generate comprehensive goal strategies for each provided participant goal. Each strategy should be actionable, measurable, and directly implementable by a Support Coordinator.

**Strategy Structure (for each goal):**

### Goal: [Goal Title]

**Strategy Overview:**
A 2-3 sentence overview of the approach.

**Implementation Steps:**
1. **Step 1:** [Specific action] — Timeline: [Timeframe] — Responsible: [SC/Participant/Provider]
2. **Step 2:** [Specific action] — Timeline: [Timeframe] — Responsible: [SC/Participant/Provider]
3. [Continue as needed]

**Progress Indicators:**
- [Measurable indicator 1]
- [Measurable indicator 2]
- [Measurable indicator 3]

**Support Coordination Activities:**
- [Specific SC activity with NDIS line item reference if applicable]
- [Specific SC activity]

**Potential Barriers & Mitigation:**
- Barrier: [Description] → Mitigation: [Approach]

**Review Timeline:**
- [Milestone checkpoint with date/timeframe]

---

**Critical Rules:**
1. **NDIS Alignment:** Every strategy must align with NDIS principles of choice and control, capacity building, and community participation.
2. **SMART Goals:** Ensure all progress indicators are Specific, Measurable, Achievable, Relevant, and Time-bound.
3. **SC Scope:** Only include activities within the scope of Support Coordination (Level 2 or Level 3). Do not prescribe clinical interventions — refer to appropriate allied health professionals.
4. **Participant-Centred:** Frame everything in terms of participant choice, autonomy, and empowerment.
5. **NDIS Terminology:** Use approved terminology throughout (participant, capacity building, informal supports, etc.).
6. **Practical Focus:** Strategies must be implementable within a typical SC caseload — avoid unrealistic time commitments.
7. **Evidence-Based:** Reference established approaches where applicable (e.g., motivational interviewing, person-centred planning, strengths-based approach).
8. **Cultural Sensitivity:** Note any cultural considerations that may affect strategy implementation.
9. **Risk Awareness:** Include risk mitigation for participant safety and wellbeing.

**Output:** Return a comprehensive strategy document as plain text with clear Markdown formatting. Cover ALL provided goals.`;

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

    // Validate goals array
    if (!Array.isArray(requestBody.goals) || requestBody.goals.length === 0) {
      return NextResponse.json(
        { error: 'goals array is required and must contain at least one goal' },
        { status: 400 }
      );
    }

    const goals = (requestBody.goals as unknown[]).filter(
      (g): g is string => typeof g === 'string' && g.trim().length > 0
    );

    if (goals.length === 0) {
      return NextResponse.json(
        { error: 'At least one non-empty goal string is required' },
        { status: 400 }
      );
    }

    const participantContext = typeof requestBody.participantContext === 'string'
      ? requestBody.participantContext
      : undefined;

    const currentSupports = typeof requestBody.currentSupports === 'string'
      ? requestBody.currentSupports
      : undefined;

    const disabilityTypes = Array.isArray(requestBody.disabilityTypes)
      ? (requestBody.disabilityTypes as unknown[]).filter((d): d is string => typeof d === 'string')
      : undefined;

    // Build prompt
    const promptParts: string[] = [];

    promptParts.push(`**Participant Goals (${goals.length}):**`);
    goals.forEach((goal, index) => {
      promptParts.push(`${index + 1}. ${goal}`);
    });

    if (participantContext) {
      promptParts.push(`\n**Participant Context:**\n${participantContext}`);
    }

    if (currentSupports) {
      promptParts.push(`\n**Current Supports in Place:**\n${currentSupports}`);
    }

    if (disabilityTypes && disabilityTypes.length > 0) {
      promptParts.push(`\n**Disability Type(s):** ${disabilityTypes.join(', ')}`);
    }

    promptParts.push('\n---\nGenerate comprehensive SC goal strategies for each goal listed above.');

    const prompt = promptParts.join('\n');

    // Call AI — use 'flash' model for goal strategies
    const result = await gemini.generate<string>(
      prompt,
      SC_GOAL_STRATEGIES_SYSTEM_PROMPT,
      'flash',
      false
    );

    if (!result.success || !result.data) {
      console.error('[SC Goal Strategies] AI generation failed:', result.error);
      return NextResponse.json(
        { error: result.error || 'Failed to generate goal strategies' },
        { status: 500 }
      );
    }

    const strategiesResult: SCGoalStrategiesResult = {
      strategies: result.data,
      model: result.model || 'gemini-2.0-flash',
    };

    console.log('[SC Goal Strategies] Success for user:', user.id, '| Goals:', goals.length);

    return NextResponse.json({
      success: true,
      data: strategiesResult,
    });
  } catch (error) {
    console.error('[SC Goal Strategies] API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
