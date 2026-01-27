/**
 * SC Report Synthesizer API Route
 *
 * Synthesizes clinical reports into NDIS-compliant documentation.
 * Accepts raw report text and/or coordinator notes, returns either
 * free-form synthesized text or structured ReportTemplateData.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { gemini } from '@/lib/gemini';
import type { SynthesisResult, ReportTemplateData } from '@/types/sc-toolkit';

const SYNTHESIS_SYSTEM_PROMPT = `You are a Senior Support Coordinator and Clinical Report Specialist with 15+ years of NDIS experience. You specialize in synthesizing clinical reports, allied health assessments, and coordinator observations into cohesive, NDIS-compliant documentation.

**Your Mandate:**
1. **Synthesize** the provided report text and/or coordinator notes into a unified, professional clinical narrative.
2. **Apply NDIS Compliance Standards:** Ensure all output uses NDIS-approved terminology (e.g., "participant" not "patient", "capacity building support" not "treatment").
3. **Extract Structured Data:** When possible, extract key report fields into a structured template format.
4. **Maintain Clinical Accuracy:** Never fabricate clinical data. If information is missing, flag it explicitly with "[INFORMATION REQUIRED: ...]".
5. **Professional Tone:** Write in third person, objective clinical language suitable for NDIS plan review submissions.

**Synthesis Rules:**
- Merge overlapping information from multiple sources without duplication.
- Prioritize functional impact descriptions over diagnostic labels.
- Link all recommended supports to specific functional limitations.
- Include risk factors and mitigation strategies where identified.
- Quantify support needs (frequency, duration, intensity) wherever evidence supports it.
- Flag any contradictions between report sources for clinician review.

**When coordinator notes request synthesis (keywords: "synthesize", "merge", "combine", "summarise", "summary", "integrate"):**
Return a free-form synthesized narrative as plain text.

**When coordinator notes request template extraction OR no specific instruction is given with a clinical report:**
Return a JSON object matching the ReportTemplateData structure with all extractable fields populated.

**ReportTemplateData JSON structure:**
{
  "participant_name": "",
  "ndis_number": "",
  "date_of_birth": "",
  "report_type": "",
  "assessment_date": "",
  "provider": "",
  "professional_name": "",
  "functional_capacity": "",
  "strengths": "",
  "challenges": "",
  "impact_on_daily_life": "",
  "risks": "",
  "mitigation_strategies": "",
  "recommended_supports": "",
  "frequency": "",
  "duration": "",
  "goals": "",
  "summary": ""
}

For any field where data is not available in the source material, use "[INFORMATION REQUIRED]" as the value.`;

/** Keywords that indicate the user wants free-form synthesis rather than template extraction */
const SYNTHESIS_KEYWORDS = [
  'synthesize', 'synthesise', 'merge', 'combine',
  'summarise', 'summarize', 'summary', 'integrate',
  'narrative', 'write up', 'write-up',
] as const;

/**
 * Check if coordinator notes contain synthesis-indicating keywords
 */
function requestsSynthesis(notes: string): boolean {
  const lower = notes.toLowerCase();
  return SYNTHESIS_KEYWORDS.some(keyword => lower.includes(keyword));
}

/**
 * Attempt to parse AI response as ReportTemplateData JSON
 */
function parseTemplateData(text: string): ReportTemplateData | null {
  try {
    // Try direct JSON parse
    const parsed = JSON.parse(text) as Record<string, unknown>;
    if (typeof parsed.participant_name === 'string') {
      return parsed as unknown as ReportTemplateData;
    }
  } catch {
    // Try extracting JSON from markdown code block
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch?.[1]) {
      try {
        const parsed = JSON.parse(jsonMatch[1].trim()) as Record<string, unknown>;
        if (typeof parsed.participant_name === 'string') {
          return parsed as unknown as ReportTemplateData;
        }
      } catch {
        // Fall through
      }
    }

    // Try finding a JSON object in the text
    const objectMatch = text.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      try {
        const parsed = JSON.parse(objectMatch[0]) as Record<string, unknown>;
        if (typeof parsed.participant_name === 'string') {
          return parsed as unknown as ReportTemplateData;
        }
      } catch {
        // Fall through
      }
    }
  }
  return null;
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
    const reportText = typeof requestBody.reportText === 'string' ? requestBody.reportText : undefined;
    const coordinatorNotes = typeof requestBody.coordinatorNotes === 'string' ? requestBody.coordinatorNotes : undefined;

    if (!reportText && !coordinatorNotes) {
      return NextResponse.json(
        { error: 'At least one of reportText or coordinatorNotes is required' },
        { status: 400 }
      );
    }

    // Determine whether to synthesize as free-form text or extract template data
    const wantsSynthesis = coordinatorNotes ? requestsSynthesis(coordinatorNotes) : false;

    // Build prompt
    const promptParts: string[] = [];

    if (reportText) {
      promptParts.push(`**Clinical Report Text:**\n${reportText}`);
    }

    if (coordinatorNotes) {
      promptParts.push(`**Support Coordinator Notes:**\n${coordinatorNotes}`);
    }

    if (wantsSynthesis) {
      promptParts.push('\n**Instruction:** Synthesize the above into a cohesive clinical narrative. Return as plain text.');
    } else {
      promptParts.push('\n**Instruction:** Extract structured data from the above into the ReportTemplateData JSON format. Return valid JSON only.');
    }

    const prompt = promptParts.join('\n\n');

    // Call AI — use 'pro' model for report synthesis (higher quality output)
    const result = await gemini.generate<string>(
      prompt,
      SYNTHESIS_SYSTEM_PROMPT,
      'pro',
      false
    );

    if (!result.success || !result.data) {
      console.error('[SC Report Synthesizer] AI generation failed:', result.error);
      return NextResponse.json(
        { error: result.error || 'Failed to synthesize report' },
        { status: 500 }
      );
    }

    const responseText = result.data;
    const synthesisResult: SynthesisResult = {
      model: result.model || 'gemini-2.0-flash',
    };

    if (wantsSynthesis) {
      // Return free-form synthesized text
      synthesisResult.synthesizedText = responseText;
    } else {
      // Attempt to parse as template data
      const templateData = parseTemplateData(responseText);

      if (templateData) {
        synthesisResult.templateData = templateData;
      } else {
        // Fallback: return as synthesized text if JSON parsing fails
        synthesisResult.synthesizedText = responseText;
      }
    }

    console.log('[SC Report Synthesizer] Success for user:', user.id);

    return NextResponse.json({
      success: true,
      data: synthesisResult,
    });
  } catch (error) {
    console.error('[SC Report Synthesizer] API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
