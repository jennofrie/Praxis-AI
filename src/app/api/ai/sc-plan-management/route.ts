/**
 * SC Plan Management Expert API Route
 *
 * AI-powered NDIS plan management guidance with price guide references,
 * document compliance analysis, and practical plan management advice.
 * Supports both text queries and document analysis.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { gemini } from '@/lib/gemini';
import type { PlanManagementResult } from '@/types/sc-toolkit';

const PLAN_MANAGEMENT_SYSTEM_PROMPT = `You are an expert NDIS Plan Management Advisor with 15+ years of experience across plan management, support coordination, and NDIA compliance. You have encyclopedic knowledge of the NDIS Price Guide, NDIS Act 2013, NDIS Rules, and all NDIA operational guidelines.

**Your Role:**
Provide accurate, actionable guidance on NDIS plan management queries. This includes:
- Price guide interpretation and line item identification
- Claiming rules and compliance requirements
- Plan management vs self-management vs agency-managed guidance
- Service agreement requirements
- Invoice verification and common billing errors
- Provider compliance obligations
- Participant rights and plan flexibility
- Document compliance assessment

**Response Format:**
Return a JSON object with this exact structure:

{
  "queryType": "question" | "document_analysis" | "general_inquiry" | "needs_clarification",
  "summary": "2-3 sentence executive summary of the response",
  "response": {
    "mainAnswer": "Detailed answer to the query",
    "keyPoints": ["Key point 1", "Key point 2"],
    "priceGuideReferences": [
      {
        "lineItem": "Line item number",
        "category": "Category name",
        "description": "Line item description",
        "priceLimit": "Price limit amount",
        "notes": "Important notes about this line item"
      }
    ],
    "verificationChecklist": ["Check item 1", "Check item 2"],
    "practicalGuidance": ["Practical step 1", "Practical step 2"],
    "commonMistakes": ["Common mistake 1", "Common mistake 2"],
    "documentFindings": null,
    "relatedTopics": ["Related topic 1", "Related topic 2"]
  },
  "confidenceLevel": "high" | "medium" | "low",
  "disclaimer": "Standard disclaimer text"
}

**When analyzing documents, populate documentFindings:**
{
  "documentType": "Type of document analyzed",
  "complianceStatus": "compliant" | "needs_attention" | "non_compliant" | "not_applicable",
  "issues": [
    {
      "issue": "Description of the issue",
      "severity": "critical" | "high" | "medium" | "low",
      "recommendation": "How to fix this"
    }
  ],
  "strengths": ["What's done well"],
  "missingElements": ["What's missing"]
}

**Critical Rules:**
1. ALWAYS cite specific NDIS Price Guide line items when discussing pricing.
2. ALWAYS include the current price limits (note: prices are updated annually — indicate the reference period).
3. NEVER provide legal advice — frame guidance as "general information" and recommend consulting NDIA directly for complex situations.
4. Flag any areas of regulatory uncertainty with "Note: This area is subject to NDIA interpretation."
5. Include a standard disclaimer about the advisory nature of the response.
6. If the query is unclear, set queryType to "needs_clarification" and ask specific follow-up questions.
7. For document analysis, be thorough but fair — highlight strengths alongside issues.
8. Reference the NDIS Quality and Safeguards Commission requirements where relevant.`;

const STANDARD_DISCLAIMER = 'This guidance is provided for informational purposes only and does not constitute legal or financial advice. Always verify current NDIS Price Guide rates and consult with the NDIA or a registered plan manager for binding decisions. Prices and rules may have changed since the AI knowledge cutoff date.';

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
    const query = typeof requestBody.query === 'string' ? requestBody.query : undefined;
    const fileData = typeof requestBody.fileData === 'string' ? requestBody.fileData : undefined;
    const fileMimeType = typeof requestBody.fileMimeType === 'string' ? requestBody.fileMimeType : undefined;
    const fileName = typeof requestBody.fileName === 'string' ? requestBody.fileName : undefined;
    const useProModel = typeof requestBody.useProModel === 'boolean' ? requestBody.useProModel : false;

    if (!query && !fileData) {
      return NextResponse.json(
        { error: 'Either query or fileData is required' },
        { status: 400 }
      );
    }

    // Build prompt based on input type
    const promptParts: string[] = [];

    if (query) {
      promptParts.push(`**User Query:**\n${query}`);
    }

    if (fileData && fileName) {
      promptParts.push(`**Document for Analysis:**`);
      promptParts.push(`- File Name: ${fileName}`);
      promptParts.push(`- File Type: ${fileMimeType || 'Unknown'}`);

      // For text-based content, include it directly
      if (fileMimeType?.startsWith('text/') || fileMimeType === 'application/json') {
        try {
          const decodedContent = Buffer.from(fileData, 'base64').toString('utf-8');
          promptParts.push(`- Content:\n${decodedContent}`);
        } catch {
          promptParts.push('- Note: File content could not be decoded. Please provide text content directly.');
        }
      } else {
        promptParts.push('- Note: Binary file provided. Analysis will be based on available text extraction.');
        // For binary files, we send the file data as text context if possible
        promptParts.push(`- Base64 content length: ${fileData.length} characters`);
      }
    }

    if (fileData && !query) {
      promptParts.push('\n**Instruction:** Perform a comprehensive compliance and content analysis of the provided document. Return findings in the documentFindings field.');
    }

    const prompt = promptParts.join('\n');

    // Select model based on user preference
    const modelType = useProModel ? 'pro' as const : 'flash' as const;

    // Call AI
    const result = await gemini.generate<PlanManagementResult>(
      prompt,
      PLAN_MANAGEMENT_SYSTEM_PROMPT,
      modelType,
      true
    );

    if (!result.success || !result.data) {
      console.error('[SC Plan Management] AI generation failed:', result.error);
      return NextResponse.json(
        { error: result.error || 'Failed to process plan management query' },
        { status: 500 }
      );
    }

    const planManagementResult = result.data;

    // Ensure disclaimer is present
    if (!planManagementResult.disclaimer) {
      planManagementResult.disclaimer = STANDARD_DISCLAIMER;
    }

    // Ensure all response arrays exist
    if (planManagementResult.response) {
      planManagementResult.response.keyPoints = planManagementResult.response.keyPoints || [];
      planManagementResult.response.priceGuideReferences = planManagementResult.response.priceGuideReferences || [];
      planManagementResult.response.verificationChecklist = planManagementResult.response.verificationChecklist || [];
      planManagementResult.response.practicalGuidance = planManagementResult.response.practicalGuidance || [];
      planManagementResult.response.commonMistakes = planManagementResult.response.commonMistakes || [];
      planManagementResult.response.relatedTopics = planManagementResult.response.relatedTopics || [];
    }

    console.log('[SC Plan Management] Success for user:', user.id, '| Model:', result.model);

    return NextResponse.json({
      success: true,
      data: {
        result: planManagementResult,
        modelUsed: result.model || 'gemini-2.5-flash',
      },
    });
  } catch (error) {
    console.error('[SC Plan Management] API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
