/**
 * SC CoC Cover Letter API Route
 *
 * Generates comprehensive Change of Circumstances cover letters
 * with clinical evidence, SC level justification, and anticipated
 * planner questions for NDIS plan review submissions.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { gemini } from '@/lib/gemini';
import type { CoverLetterData } from '@/types/sc-toolkit';

const COC_COVER_LETTER_SYSTEM_PROMPT = `You are a Senior NDIS Support Coordinator with 15+ years of experience writing Change of Circumstances (CoC) cover letters that consistently achieve successful plan reviews. You have deep expertise in NDIS legislation, the NDIS Act 2013 (Section 48), and NDIA operational guidelines for Change of Circumstances requests.

**Your Mandate:**
Generate a comprehensive, professionally structured CoC cover letter in JSON format that will accompany supporting clinical documentation for an NDIS plan review request.

**Critical Rules:**
1. Use ONLY NDIS-approved terminology throughout.
2. Link every recommendation to specific functional evidence.
3. Frame all requests in terms of "reasonable and necessary" criteria under the NDIS Act.
4. Anticipate and pre-address common planner objections.
5. Reference specific clinical assessments and their findings.
6. Clearly articulate the comparison between current and recommended SC levels.
7. Do NOT fabricate clinical data — if evidence is unclear, note it as "[Evidence to be confirmed]".
8. All dates should be in Australian format (DD/MM/YYYY).

**Output Format:**
Return a single JSON object matching this exact structure:

{
  "participant": {
    "name": "",
    "dateOfBirth": "",
    "ndisNumber": "",
    "address": "",
    "email": "",
    "phone": ""
  },
  "plan": {
    "startDate": "",
    "endDate": "",
    "reportingPeriod": ""
  },
  "overview": {
    "summaryText": ""
  },
  "keyChanges": [
    {
      "title": "",
      "description": ""
    }
  ],
  "clinicalEvidence": {
    "introText": "",
    "assessments": [
      {
        "measure": "",
        "score": "",
        "interpretation": ""
      }
    ],
    "conclusionText": ""
  },
  "scRequest": {
    "introText": "",
    "comparison": {
      "currentLevel": "",
      "recommendedLevel": "",
      "currentHoursAnnual": "",
      "recommendedHoursAnnual": "",
      "currentHoursMonthly": "",
      "recommendedHoursMonthly": ""
    },
    "activitiesIntro": "",
    "activities": [
      {
        "area": "",
        "description": ""
      }
    ]
  },
  "anticipatedQuestions": [
    {
      "question": "",
      "response": ""
    }
  ],
  "documents": {
    "included": [
      {
        "name": "",
        "date": "",
        "pages": ""
      }
    ],
    "progressive": [
      {
        "name": "",
        "expectedDate": ""
      }
    ],
    "progressiveNote": ""
  },
  "closing": {
    "statementText": "",
    "priorityReasons": []
  }
}

**Content Guidelines:**
- The "overview.summaryText" should be a compelling 2-3 paragraph executive summary.
- Include at least 3 key changes with specific functional impact descriptions.
- Clinical evidence should reference standardized assessment tools where applicable.
- The SC request comparison should clearly quantify the difference in hours.
- Include at least 4 anticipated questions that a planner would ask, with evidence-based responses.
- The closing statement should reference "reasonable and necessary" criteria directly.
- Extract participant details, plan dates, and clinical information from the provided report text.`;

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
    const reportText = typeof requestBody.reportText === 'string' ? requestBody.reportText : undefined;
    const scLevel = requestBody.scLevel;

    if (!reportText || reportText.trim().length === 0) {
      return NextResponse.json(
        { error: 'reportText is required and must not be empty' },
        { status: 400 }
      );
    }

    if (scLevel !== 2 && scLevel !== 3) {
      return NextResponse.json(
        { error: 'scLevel must be 2 or 3' },
        { status: 400 }
      );
    }

    // Build prompt with SC level context
    const scLevelContext = scLevel === 3
      ? 'Level 3 — Specialist Support Coordination (high complexity participants requiring intensive coordination, crisis management, and multi-agency liaison)'
      : 'Level 2 — Support Coordination (standard coordination for participants requiring assistance to implement their plan)';

    const prompt = `**SC Level Context:** ${scLevelContext}

**Report / Supporting Documentation:**
${reportText}

---

Generate a comprehensive CoC cover letter in the specified JSON format. Extract all available participant and clinical details from the report text above. For any information not present in the source material, use placeholder text clearly marked with "[TO BE COMPLETED]".

Ensure the cover letter:
1. Clearly justifies the need for Level ${scLevel} Support Coordination
2. Links all recommendations to functional evidence from the report
3. Addresses "reasonable and necessary" criteria
4. Pre-empts common planner objections with evidence-based responses`;

    // Call AI — use 'flash' model for cover letter generation
    const result = await gemini.generate<CoverLetterData>(
      prompt,
      COC_COVER_LETTER_SYSTEM_PROMPT,
      'flash',
      true
    );

    if (!result.success || !result.data) {
      console.error('[SC CoC Cover Letter] AI generation failed:', result.error);
      return NextResponse.json(
        { error: result.error || 'Failed to generate cover letter' },
        { status: 500 }
      );
    }

    console.log('[SC CoC Cover Letter] Success for user:', user.id);

    return NextResponse.json({
      success: true,
      data: {
        coverLetterData: result.data,
        model: result.model || 'gemini-2.0-flash',
      },
    });
  } catch (error) {
    console.error('[SC CoC Cover Letter] API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
