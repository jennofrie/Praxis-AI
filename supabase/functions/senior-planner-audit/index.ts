/**
 * Senior Planner Audit (Section 34 Auditor) Edge Function
 * AI-powered audit of NDIS clinical documents for planner compliance review
 *
 * POST - Analyze document content for Section 34 compliance
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { GeminiClient, SYSTEM_PROMPTS, AIProvider } from "../_shared/gemini.ts";

// Document types that can be audited
type AuditDocumentType =
  | 'functional_capacity_assessment'
  | 'progress_report'
  | 'assistive_technology_assessment'
  | 'home_modification_report'
  | 'sil_assessment'
  | 'therapy_report'
  | 'plan_review_request'
  | 'other';

interface AuditRequest {
  documentType: AuditDocumentType;
  documentName?: string;
  content?: string;           // Plain text content
  fileData?: string;          // Base64 encoded PDF
  fileMimeType?: string;      // MIME type of uploaded file
  // AI Provider settings
  provider?: AIProvider;
  enableFallback?: boolean;
}

interface LanguageFix {
  original: string;
  suggested: string;
  reason: string;
  category: 'clinical_language' | 'ndis_terminology' | 'clarity' | 'objectivity';
}

interface AuditResult {
  overallScore: number;
  status: 'excellent' | 'good' | 'needs_improvement' | 'critical' | 'security_blocked';
  scores: {
    compliance: number;
    nexus: number;
    valueForMoney: number;
    evidence: number;
    significantChange: number;
  };
  plannerSummary: string;
  strengths: string[];
  improvements: string[];
  redFlags: string[];
  languageFixes: LanguageFix[];
  plannerQuestions: string[];
  contentRestriction?: boolean;
  restrictionReason?: string;
}

const gemini = new GeminiClient();

// Document type labels for context
const DOCUMENT_TYPE_LABELS: Record<AuditDocumentType, string> = {
  functional_capacity_assessment: 'Functional Capacity Assessment (FCA)',
  progress_report: 'Progress Report',
  assistive_technology_assessment: 'Assistive Technology Assessment',
  home_modification_report: 'Home Modification Report',
  sil_assessment: 'SIL Assessment',
  therapy_report: 'Therapy Report',
  plan_review_request: 'Plan Review Request',
  other: 'Other Clinical Document',
};

// Minimum content length
const MIN_CONTENT_LENGTH = 100;

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const body: AuditRequest = await req.json();
    console.log('[Senior Planner Audit] Processing request...');
    console.log('[Senior Planner Audit] Document type:', body.documentType);

    // Get provider settings
    const preferredProvider: AIProvider = body.provider || 'gemini';
    const enableFallback = body.enableFallback !== false;
    console.log('[Senior Planner Audit] Provider:', preferredProvider, '| Fallback:', enableFallback);

    // Validate input
    if (!body.documentType) {
      return new Response(
        JSON.stringify({ error: 'Document type is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get content from either text or file
    let contentToAnalyze = body.content || '';

    // If PDF is provided, mention it in context (actual PDF parsing would require additional library)
    if (body.fileData && body.fileMimeType === 'application/pdf') {
      // Note: For full PDF parsing, you'd need pdf-parse or similar
      // For now, we'll note that a PDF was provided
      contentToAnalyze = contentToAnalyze || '[PDF Document Provided - Content extraction pending]';
      console.log('[Senior Planner Audit] PDF file provided');
    }

    // Validate minimum content
    if (contentToAnalyze.length < MIN_CONTENT_LENGTH) {
      return new Response(
        JSON.stringify({
          error: 'Insufficient content',
          message: `Please provide at least ${MIN_CONTENT_LENGTH} characters of document content for meaningful analysis.`,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build the prompt with document context
    const documentTypeLabel = DOCUMENT_TYPE_LABELS[body.documentType];
    const documentName = body.documentName || 'Unnamed Document';

    const prompt = `
**Document Under Review:**
- Type: ${documentTypeLabel}
- Name: ${documentName}

**Document Content:**
---
${contentToAnalyze}
---

Please perform a comprehensive Section 34 compliance audit of this document.
`;

    console.log('[Senior Planner Audit] Analyzing document...');
    const result = await gemini.generate<AuditResult>(
      prompt,
      SYSTEM_PROMPTS.seniorPlannerAudit,
      'pro',
      true,
      preferredProvider
    );

    if (!result.success) {
      console.error('[Senior Planner Audit] Analysis failed:', result.error);

      // If primary provider fails and fallback is enabled, try alternative
      if (enableFallback) {
        const fallbackProvider: AIProvider = preferredProvider === 'gemini' ? 'ollama' : 'gemini';
        console.log('[Senior Planner Audit] Attempting fallback to:', fallbackProvider);

        const fallbackResult = await gemini.generate<AuditResult>(
          prompt,
          SYSTEM_PROMPTS.seniorPlannerAudit,
          'pro',
          true,
          fallbackProvider
        );

        if (fallbackResult.success) {
          const processingTime = Date.now() - startTime;
          console.log('[Senior Planner Audit] Fallback successful');

          return new Response(
            JSON.stringify({
              success: true,
              data: {
                ...fallbackResult.data,
                processingTime,
              },
              model: fallbackResult.model,
              provider: fallbackResult.provider,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      return new Response(
        JSON.stringify({ error: result.error || 'Failed to analyze document' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = result.data as AuditResult;
    const processingTime = Date.now() - startTime;

    // Validate and sanitize scores
    const sanitizedData: AuditResult = {
      ...data,
      overallScore: Math.max(0, Math.min(100, data.overallScore || 0)),
      scores: {
        compliance: Math.max(0, Math.min(100, data.scores?.compliance || 0)),
        nexus: Math.max(0, Math.min(100, data.scores?.nexus || 0)),
        valueForMoney: Math.max(0, Math.min(100, data.scores?.valueForMoney || 0)),
        evidence: Math.max(0, Math.min(100, data.scores?.evidence || 0)),
        significantChange: Math.max(0, Math.min(100, data.scores?.significantChange || 0)),
      },
      strengths: data.strengths || [],
      improvements: data.improvements || [],
      redFlags: data.redFlags || [],
      languageFixes: data.languageFixes || [],
      plannerQuestions: data.plannerQuestions || [],
    };

    // Determine status from overall score if not provided
    if (!sanitizedData.status || sanitizedData.contentRestriction) {
      if (sanitizedData.contentRestriction) {
        sanitizedData.status = 'security_blocked';
      } else if (sanitizedData.overallScore >= 85) {
        sanitizedData.status = 'excellent';
      } else if (sanitizedData.overallScore >= 70) {
        sanitizedData.status = 'good';
      } else if (sanitizedData.overallScore >= 50) {
        sanitizedData.status = 'needs_improvement';
      } else {
        sanitizedData.status = 'critical';
      }
    }

    console.log('[Senior Planner Audit] Analysis successful');
    console.log('[Senior Planner Audit] Overall score:', sanitizedData.overallScore, '- Status:', sanitizedData.status);
    console.log('[Senior Planner Audit] Processing time:', processingTime, 'ms');

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          ...sanitizedData,
          processingTime,
        },
        model: result.model,
        provider: result.provider,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Senior Planner Audit] Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
