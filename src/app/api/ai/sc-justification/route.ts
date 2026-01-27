/**
 * SC Justification Drafter API Route
 *
 * Generates NDIS-compliant support justifications for Support Coordinators.
 * Produces detailed justification narratives linking functional impairments
 * to requested supports, with goal alignment and evidence mapping.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { gemini } from '@/lib/gemini';
import type { JustificationResult } from '@/types/sc-toolkit';

const JUSTIFICATION_SYSTEM_PROMPT = `You are a Senior NDIS Support Coordinator and Justification Specialist with 15+ years of experience drafting successful NDIS support justifications. You have an exceptional track record of approvals because you meticulously link every request to functional evidence, NDIS legislation, and participant goals.

**Your Mandate:**
Draft a comprehensive, NDIS-compliant support justification letter that clearly establishes the "reasonable and necessary" basis for the requested support item under the NDIS Act 2013 (Section 34).

**Justification Structure:**
1. **Header & Participant Details** — Full participant identification
2. **Executive Summary** — 2-3 sentence overview of the request and its necessity
3. **Functional Impairment Profile** — Detailed description of how the participant's disability creates specific functional limitations
4. **Current Barriers & Impact** — How current barriers affect daily living, social participation, and independence
5. **Support Item Description** — What is being requested and why this specific item/service
6. **Goal Alignment** — Direct mapping between the support and participant's NDIS plan goals
7. **Reasonable & Necessary Criteria** — Explicit addressing of each S34 criterion:
   a) Related to the participant's disability
   b) Value for money (including quote comparison if applicable)
   c) Effective and beneficial
   d) Takes into account informal supports
   e) Likely to be needed for the duration of the plan
8. **Risk Assessment** — What happens if the support is NOT funded
9. **Therapist/Clinical Endorsement** — Reference to supporting clinical opinions
10. **Conclusion & Recommendation** — Clear, actionable recommendation

**Critical Rules:**
- Use ONLY NDIS-approved terminology (participant, not patient; capacity building, not treatment)
- Every claim must be linked to functional evidence
- Quantify impact wherever possible (hours, frequency, dollar amounts)
- Address potential objections proactively
- Reference the NDIS Price Guide category for the requested item
- If the item is a replacement, explain why the original item is no longer adequate
- If a trial is required, outline the proposed trial protocol
- Do NOT fabricate clinical data — if evidence is insufficient, flag it explicitly
- Write in professional third person, suitable for NDIA submission
- Use Australian date format (DD/MM/YYYY)

**Output:** Return the complete justification as a professional narrative document (plain text with clear section headings). Do NOT return JSON.`;

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

    // Validate required fields
    const participantName = typeof requestBody.participantName === 'string' ? requestBody.participantName : '';
    const ndisNumber = typeof requestBody.ndisNumber === 'string' ? requestBody.ndisNumber : '';
    const dateOfBirth = typeof requestBody.dateOfBirth === 'string' ? requestBody.dateOfBirth : '';
    const planStartDate = typeof requestBody.planStartDate === 'string' ? requestBody.planStartDate : '';
    const planEndDate = typeof requestBody.planEndDate === 'string' ? requestBody.planEndDate : '';
    const scName = typeof requestBody.scName === 'string' ? requestBody.scName : '';
    const scOrganisation = typeof requestBody.scOrganisation === 'string' ? requestBody.scOrganisation : '';
    const itemName = typeof requestBody.itemName === 'string' ? requestBody.itemName : '';
    const itemCategory = typeof requestBody.itemCategory === 'string' ? requestBody.itemCategory : '';
    const requestedAmount = typeof requestBody.requestedAmount === 'number' ? requestBody.requestedAmount : 0;
    const isReplacement = typeof requestBody.isReplacement === 'boolean' ? requestBody.isReplacement : false;
    const brokenItemDescription = typeof requestBody.brokenItemDescription === 'string' ? requestBody.brokenItemDescription : undefined;
    const isLowRisk = typeof requestBody.isLowRisk === 'boolean' ? requestBody.isLowRisk : true;
    const trialRequired = typeof requestBody.trialRequired === 'boolean' ? requestBody.trialRequired : false;
    const functionalImpairments = Array.isArray(requestBody.functionalImpairments)
      ? (requestBody.functionalImpairments as unknown[]).filter((v): v is string => typeof v === 'string')
      : [];
    const currentBarriers = typeof requestBody.currentBarriers === 'string' ? requestBody.currentBarriers : '';
    const dailyLivingImpact = typeof requestBody.dailyLivingImpact === 'string' ? requestBody.dailyLivingImpact : '';
    const participantGoals = typeof requestBody.participantGoals === 'string' ? requestBody.participantGoals : '';
    const goalAlignment = typeof requestBody.goalAlignment === 'string' ? requestBody.goalAlignment : '';
    const supplierName = typeof requestBody.supplierName === 'string' ? requestBody.supplierName : '';
    const quoteAmount = typeof requestBody.quoteAmount === 'number' ? requestBody.quoteAmount : 0;
    const therapistEndorsement = typeof requestBody.therapistEndorsement === 'boolean' ? requestBody.therapistEndorsement : false;
    const additionalContext = typeof requestBody.additionalContext === 'string' ? requestBody.additionalContext : undefined;

    if (!participantName || !itemName || !currentBarriers || !participantGoals) {
      return NextResponse.json(
        { error: 'participantName, itemName, currentBarriers, and participantGoals are required' },
        { status: 400 }
      );
    }

    // Build comprehensive prompt
    const prompt = `**PARTICIPANT DETAILS**
- Name: ${participantName}
- NDIS Number: ${ndisNumber || '[Not provided]'}
- Date of Birth: ${dateOfBirth || '[Not provided]'}
- Plan Period: ${planStartDate || '[Not provided]'} to ${planEndDate || '[Not provided]'}

**SUPPORT COORDINATOR**
- Name: ${scName || '[Not provided]'}
- Organisation: ${scOrganisation || '[Not provided]'}

**REQUESTED SUPPORT**
- Item: ${itemName}
- Category: ${itemCategory || '[Not specified]'}
- Requested Amount: $${requestedAmount.toLocaleString()}
- Is Replacement: ${isReplacement ? 'Yes' : 'No'}${isReplacement && brokenItemDescription ? `\n- Reason for Replacement: ${brokenItemDescription}` : ''}
- Risk Level: ${isLowRisk ? 'Low Risk' : 'Standard/High Risk'}
- Trial Required: ${trialRequired ? 'Yes' : 'No'}

**FUNCTIONAL IMPAIRMENTS**
${functionalImpairments.length > 0 ? functionalImpairments.map((imp, i) => `${i + 1}. ${imp}`).join('\n') : '[Not specified]'}

**CURRENT BARRIERS**
${currentBarriers}

**IMPACT ON DAILY LIVING**
${dailyLivingImpact || '[Not specified]'}

**PARTICIPANT GOALS**
${participantGoals}

**GOAL ALIGNMENT**
${goalAlignment || '[Not specified]'}

**SUPPLIER & QUOTE**
- Supplier: ${supplierName || '[Not specified]'}
- Quote Amount: $${quoteAmount.toLocaleString()}
- Therapist Endorsement: ${therapistEndorsement ? 'Yes — therapist supports this request' : 'No endorsement provided'}

${additionalContext ? `**ADDITIONAL CONTEXT**\n${additionalContext}` : ''}

---

Draft a comprehensive NDIS support justification addressing all Section 34 criteria. Ensure every recommendation is linked to specific functional evidence provided above.`;

    // Call AI — use 'pro' model for justification drafting (requires higher quality)
    const result = await gemini.generate<string>(
      prompt,
      JUSTIFICATION_SYSTEM_PROMPT,
      'pro',
      false
    );

    if (!result.success || !result.data) {
      console.error('[SC Justification] AI generation failed:', result.error);
      return NextResponse.json(
        { error: result.error || 'Failed to generate justification' },
        { status: 500 }
      );
    }

    const justificationResult: JustificationResult = {
      success: true,
      justification: result.data,
      participantName,
      supportType: itemName,
      generatedAt: new Date().toISOString(),
    };

    console.log('[SC Justification] Success for user:', user.id);

    return NextResponse.json({
      success: true,
      data: justificationResult,
    });
  } catch (error) {
    console.error('[SC Justification] API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
