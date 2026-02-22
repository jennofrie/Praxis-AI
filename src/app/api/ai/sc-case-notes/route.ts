/**
 * SC Case Notes API Route
 *
 * Generates structured NDIS case notes from text descriptions or images.
 * Supports both text input (narrative descriptions of participant interactions)
 * and image input (photos of handwritten notes, whiteboards, etc.) for
 * AI-powered clinical formatting into NDIS-compliant case notes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { gemini } from '@/lib/gemini';
import type { CaseNoteResult } from '@/types/sc-toolkit';

const CASE_NOTE_TEXT_SYSTEM_PROMPT = `You are an expert NDIS Support Coordinator with extensive experience writing compliant, high-quality case notes. You transform informal observations, meeting summaries, and interaction descriptions into structured, professional NDIS case notes.

**Case Note Structure:**
1. **Date & Time:** [Extracted or marked as "[TO BE COMPLETED]"]
2. **Contact Type:** Phone call / Face-to-face / Email / Video call / Other
3. **Participants Present:** [List of people involved]
4. **Purpose of Contact:** [Reason for the interaction]
5. **Discussion Summary:** [Factual, objective account of what was discussed]
6. **Participant Presentation:** [Observable behavior, mood, engagement level — ONLY if directly observed]
7. **Actions Taken:** [What was done during/after the interaction]
8. **Outcomes:** [Results achieved or decisions made]
9. **Follow-Up Required:** [Next steps with timeframes]
10. **Risk/Safety Notes:** [Any identified risks — only if applicable]
11. **Goal Progress:** [Link to relevant NDIS plan goals — if applicable]

**Critical Rules:**
- Write in THIRD PERSON, past tense, objective professional language.
- Use NDIS-approved terminology ONLY (participant, not patient/client).
- Report ONLY observable facts — never interpret emotions or motives.
- Do NOT include subjective opinions unless clearly attributed (e.g., "Participant reported feeling...").
- Do NOT fabricate information — mark unknown fields as "[TO BE COMPLETED]".
- Include time spent if mentioned (for billing purposes).
- Reference specific NDIS plan goals where relevant.
- Maintain participant dignity and respect in all language.
- Avoid medical terminology unless quoting a clinical professional.
- Keep entries concise but comprehensive — aim for 150-300 words.`;

const CASE_NOTE_IMAGE_SYSTEM_PROMPT = `You are an expert NDIS Support Coordinator who can interpret handwritten notes, whiteboards, and informal documentation captured in photographs, and transform them into structured, professional NDIS case notes.

**Your Task:**
1. **Read** the image carefully — identify all text, diagrams, and relevant information.
2. **Interpret** the content in an NDIS Support Coordination context.
3. **Transform** into a structured case note following NDIS documentation standards.

**Case Note Structure:**
1. **Date & Time:** [Extracted from image or marked as "[TO BE COMPLETED]"]
2. **Contact Type:** [Inferred from context or marked as "[TO BE COMPLETED]"]
3. **Participants Present:** [Extracted or marked as "[TO BE COMPLETED]"]
4. **Purpose of Contact:** [Inferred from content]
5. **Discussion Summary:** [Professional rewrite of the captured content]
6. **Actions Taken:** [Extracted action items]
7. **Outcomes:** [Any outcomes or decisions noted]
8. **Follow-Up Required:** [Extracted follow-up items with timeframes]
9. **Risk/Safety Notes:** [If any risks are identified in the content]
10. **Goal Progress:** [If any goal-related information is present]

**Critical Rules:**
- If text is illegible, note it as "[ILLEGIBLE — manual review required]".
- Do NOT guess at unclear handwriting — flag it for review.
- Transform informal language into professional NDIS terminology.
- Maintain all factual content from the original — do not omit information.
- Write the final case note in THIRD PERSON, past tense.
- Add a note at the end: "Source: Transcribed from [image/photograph] — manual verification recommended."`;

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
    const content = typeof requestBody.content === 'string' ? requestBody.content : '';
    const type = requestBody.type;
    const customInstructions = typeof requestBody.customInstructions === 'string' ? requestBody.customInstructions : undefined;
    const imageData = typeof requestBody.imageData === 'string' ? requestBody.imageData : undefined;
    const imageMimeType = typeof requestBody.imageMimeType === 'string' ? requestBody.imageMimeType : undefined;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'content is required and must not be empty' },
        { status: 400 }
      );
    }

    if (type !== 'text' && type !== 'image') {
      return NextResponse.json(
        { error: 'type must be "text" or "image"' },
        { status: 400 }
      );
    }

    if (type === 'image' && (!imageData || !imageMimeType)) {
      return NextResponse.json(
        { error: 'imageData and imageMimeType are required for image type' },
        { status: 400 }
      );
    }

    // Build prompt
    const promptParts: string[] = [];

    if (type === 'text') {
      promptParts.push(`**Raw Interaction Notes / Description:**\n${content}`);
    } else {
      promptParts.push(`**Image Description / Context:**\n${content}`);
      if (imageData) {
        promptParts.push(`\n**Image Data:** [Base64 image provided — ${imageMimeType || 'image/jpeg'}]`);
        promptParts.push(`**Note:** Analyze the provided image content and transcribe into a structured case note.`);
      }
    }

    if (customInstructions) {
      promptParts.push(`\n**Additional Instructions from Coordinator:**\n${customInstructions}`);
    }

    promptParts.push('\n---\nGenerate a professional, NDIS-compliant case note from the above content.');

    const prompt = promptParts.join('\n');

    // Select system prompt based on input type
    const systemPrompt = type === 'image'
      ? CASE_NOTE_IMAGE_SYSTEM_PROMPT
      : CASE_NOTE_TEXT_SYSTEM_PROMPT;

    // Call AI — use 'flash' model for case notes (fast turnaround needed)
    const result = await gemini.generate<string>(
      prompt,
      systemPrompt,
      'flash',
      false
    );

    if (!result.success || !result.data) {
      console.error('[SC Case Notes] AI generation failed:', result.error);
      return NextResponse.json(
        { error: result.error || 'Failed to generate case note' },
        { status: 500 }
      );
    }

    const caseNoteResult: CaseNoteResult = {
      success: true,
      caseNote: result.data,
      model: result.model || 'gemini-2.5-flash',
    };

    console.log('[SC Case Notes] Success for user:', user.id, '| Type:', type);

    return NextResponse.json({
      success: true,
      data: caseNoteResult,
    });
  } catch (error) {
    console.error('[SC Case Notes] API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
