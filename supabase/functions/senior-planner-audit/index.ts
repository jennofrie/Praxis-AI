/**
 * Senior Planner Audit (Section 34 Auditor) Edge Function
 * AI-powered audit of NDIS clinical documents for planner compliance review
 *
 * Features:
 * - Tiered model usage: Premium (Gemini 2.5 Pro) with usage limits per 24h
 *   - Regular users: 2 Pro uses per document type per 24h
 *   - Admin users: 10 Pro uses per document type per 24h
 * - Content caching: Same content returns cached result (1 hour TTL)
 * - Automatic fallback to Standard tier (Gemini 2.0 Flash) after limit reached
 *
 * POST - Analyze document content for Section 34 compliance
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { GeminiClient, ModelTier } from "../_shared/gemini.ts";
import { SENIOR_PLANNER_SYSTEM_PROMPT, buildPromptWithContext, DOCUMENT_TYPE_CONFIGS } from "./system-prompt.ts";

// Constants
const MAX_PRO_USES_PER_DAY = 2;
const MAX_PRO_USES_PER_DAY_ADMIN = 10;
const CACHE_TTL_HOURS = 1;
const MIN_CONTENT_LENGTH = 100;

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
  content?: string;
  fileData?: string;
  fileMimeType?: string;
  userId?: string; // Optional: passed from API route
}

// Enhanced types for production-grade output schema
interface StrengthItem {
  category: string;
  finding: string;
  section34Reference: string;
  quote: string;
  quoteLocation: string;
}

interface ImprovementItem {
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  finding: string;
  remediation: string;
  section34Reference: string;
  quote: string;
  quoteLocation: string;
}

interface RedFlagItem {
  flag: string;
  reason: string;
  section34Reference: string;
  riskLevel: 'high' | 'critical';
  quote: string;
  quoteLocation: string;
}

interface LanguageFix {
  original: string;
  suggested: string;
  reason: string;
  section34Impact: string;
  quoteLocation: string;
}

interface MainstreamInterfaceCheck {
  healthSystemRisk: boolean;
  educationSystemRisk: boolean;
  housingSystemRisk: boolean;
  justiceSystemRisk: boolean;
  notes: string;
}

interface AuditResult {
  overallScore: number;
  status: 'approved' | 'revision_required' | 'critical' | 'security_blocked';
  scores: {
    compliance: number;
    nexus: number;
    valueForMoney: number;
    evidence: number;
    significantChange: number | null;
  };
  plannerSummary: string;
  strengths: StrengthItem[];
  improvements: ImprovementItem[];
  redFlags: RedFlagItem[];
  languageFixes: LanguageFix[];
  plannerQuestions: string[];
  mainstreamInterfaceCheck: MainstreamInterfaceCheck;
  assessmentToolsUsed: string[];
  contentRestriction?: boolean;
  restrictionReason?: string | null;
}

const gemini = new GeminiClient();

// Generate SHA-256 hash of content for cache key
async function generateContentHash(content: string): Promise<string> {
  // Use first 10KB + length for hash to handle large documents efficiently
  const contentForHash = content.slice(0, 10240) + `|length:${content.length}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(contentForHash);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Check cache for existing result
async function checkCache(
  supabase: ReturnType<typeof createClient>,
  contentHash: string,
  documentType: string
): Promise<{ result: AuditResult; model: string; tier: ModelTier } | null> {
  try {
    const { data, error } = await supabase
      .from('audit_cache')
      .select('result, model_used')
      .eq('content_hash', contentHash)
      .eq('document_type', documentType)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !data) return null;

    // Determine tier from model name
    const tier: ModelTier = data.model_used.includes('2.5-pro') ? 'premium' : 'standard';

    console.log('[Cache] HIT - returning cached result');
    return { result: data.result as AuditResult, model: data.model_used, tier };
  } catch {
    return null;
  }
}

// Store result in cache
async function storeCache(
  supabase: ReturnType<typeof createClient>,
  contentHash: string,
  documentType: string,
  result: AuditResult,
  modelUsed: string
): Promise<void> {
  try {
    const expiresAt = new Date(Date.now() + CACHE_TTL_HOURS * 60 * 60 * 1000).toISOString();

    await supabase
      .from('audit_cache')
      .upsert({
        content_hash: contentHash,
        document_type: documentType,
        result,
        model_used: modelUsed,
        expires_at: expiresAt,
      }, {
        onConflict: 'content_hash,document_type',
      });

    console.log('[Cache] Stored result with TTL:', CACHE_TTL_HOURS, 'hours');
  } catch (error) {
    console.error('[Cache] Failed to store:', error);
  }
}

// Check if user is an admin
async function checkIsAdmin(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (error || !data) {
      console.log('[Admin Check] Could not verify admin status:', error?.message);
      return false;
    }

    const isAdmin = data.role === 'admin';
    console.log(`[Admin Check] User ${userId.slice(0, 8)}... | Role: ${data.role} | IsAdmin: ${isAdmin}`);
    return isAdmin;
  } catch (error) {
    console.error('[Admin Check] Exception:', error);
    return false;
  }
}

// Check and update Pro usage count
async function checkProUsage(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  documentType: string,
  maxLimit: number
): Promise<{ canUsePro: boolean; currentCount: number }> {
  try {
    // Use the database function to check and reset if needed
    const { data, error } = await supabase.rpc('check_and_reset_pro_usage', {
      p_user_id: userId,
      p_document_type: documentType,
    });

    if (error) {
      console.error('[Usage] Error checking usage:', error);
      // Default to allowing Pro on error (better UX)
      return { canUsePro: true, currentCount: 0 };
    }

    const currentCount = data?.[0]?.current_count ?? 0;
    const canUsePro = currentCount < maxLimit;

    console.log(`[Usage] User ${userId.slice(0, 8)}... | DocType: ${documentType} | Count: ${currentCount}/${maxLimit} | CanUsePro: ${canUsePro}`);

    return { canUsePro, currentCount };
  } catch (error) {
    console.error('[Usage] Exception:', error);
    return { canUsePro: true, currentCount: 0 };
  }
}

// Increment Pro usage count
async function incrementProUsage(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  documentType: string
): Promise<void> {
  try {
    await supabase.rpc('increment_pro_usage', {
      p_user_id: userId,
      p_document_type: documentType,
    });
    console.log('[Usage] Incremented Pro usage for user');
  } catch (error) {
    console.error('[Usage] Failed to increment:', error);
  }
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: AuditRequest = await req.json();
    console.log('[Senior Planner Audit] Processing request...');
    console.log('[Senior Planner Audit] Document type:', body.documentType);

    // Get user ID from auth header or body
    let userId = body.userId;
    if (!userId) {
      // Try to get from auth header
      const authHeader = req.headers.get('Authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        const { data: { user } } = await supabase.auth.getUser(token);
        userId = user?.id;
      }
    }

    // Validate input
    if (!body.documentType) {
      return new Response(
        JSON.stringify({ error: 'Document type is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get content from either text or file
    let contentToAnalyze = body.content || '';

    // If PDF is provided, mention it in context
    if (body.fileData && body.fileMimeType === 'application/pdf') {
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

    // Generate content hash for caching
    const contentHash = await generateContentHash(contentToAnalyze);
    console.log('[Senior Planner Audit] Content hash:', contentHash.slice(0, 16) + '...');

    // Check cache first
    const cachedResult = await checkCache(supabase, contentHash, body.documentType);
    if (cachedResult) {
      const processingTime = Date.now() - startTime;
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            ...cachedResult.result,
            processingTime,
          },
          model: cachedResult.model,
          tier: cachedResult.tier,
          cached: true,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine which model tier to use
    let usePremium = false;
    if (userId) {
      // Check if user is admin (gets 10 Pro uses vs 2 for regular users)
      const isAdmin = await checkIsAdmin(supabase, userId);
      const maxLimit = isAdmin ? MAX_PRO_USES_PER_DAY_ADMIN : MAX_PRO_USES_PER_DAY;

      const { canUsePro } = await checkProUsage(supabase, userId, body.documentType, maxLimit);
      usePremium = canUsePro;
    }

    console.log('[Senior Planner Audit] Using tier:', usePremium ? 'PREMIUM (Gemini 2.5 Pro)' : 'STANDARD (Gemini 2.0 Flash)');

    // Build the enhanced prompt with document context and date awareness
    const documentName = body.documentName || 'Unnamed Document';

    // Build content prompt
    const contentPrompt = `
**DOCUMENT CONTENT TO ANALYZE:**
---
${contentToAnalyze}
---

Perform your 3-pass analysis (Skeptic → Validator → Outcome Predictor) and output ONLY the JSON response as specified.
`;

    // Use enhanced system prompt with document-type context
    const enhancedSystemPrompt = buildPromptWithContext(
      SENIOR_PLANNER_SYSTEM_PROMPT,
      body.documentType,
      documentName,
      new Date()
    );

    // Generate using tiered model
    console.log('[Senior Planner Audit] Analyzing document with enhanced 3-pass pipeline...');
    const result = await gemini.generateWithTieredFallback<AuditResult>(
      contentPrompt,
      enhancedSystemPrompt,
      usePremium,
      true
    );

    if (!result.success) {
      console.error('[Senior Planner Audit] Analysis failed:', result.error);
      return new Response(
        JSON.stringify({ error: result.error || 'Failed to analyze document' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Increment Pro usage if we used premium tier
    if (userId && result.tierUsed === 'premium') {
      await incrementProUsage(supabase, userId, body.documentType);
    }

    const data = result.data as AuditResult;
    const processingTime = Date.now() - startTime;

    // Validate and sanitize with enhanced schema
    const sanitizedData: AuditResult = {
      overallScore: Math.max(0, Math.min(100, data.overallScore || 0)),
      status: data.status || 'revision_required',
      scores: {
        compliance: Math.max(0, Math.min(100, data.scores?.compliance || 0)),
        nexus: Math.max(0, Math.min(100, data.scores?.nexus || 0)),
        valueForMoney: Math.max(0, Math.min(100, data.scores?.valueForMoney || 0)),
        evidence: Math.max(0, Math.min(100, data.scores?.evidenceQuality || data.scores?.evidence || 0)),
        significantChange: data.scores?.significantChange !== null
          ? Math.max(0, Math.min(100, data.scores?.significantChange || 0))
          : null,
      },
      plannerSummary: data.plannerSummary || 'Assessment pending.',
      // Sanitize strengths with enhanced structure
      strengths: (data.strengths || []).map((s: StrengthItem | string) => {
        if (typeof s === 'string') {
          return { category: 'General', finding: s, section34Reference: '', quote: '', quoteLocation: 'unknown' };
        }
        return {
          category: s.category || 'General',
          finding: s.finding || '',
          section34Reference: s.section34Reference || '',
          quote: s.quote || '',
          quoteLocation: s.quoteLocation || 'unknown',
        };
      }),
      // Sanitize improvements with enhanced structure
      improvements: (data.improvements || []).map((i: ImprovementItem | string) => {
        if (typeof i === 'string') {
          return {
            category: 'General',
            severity: 'medium' as const,
            finding: i,
            remediation: '',
            section34Reference: '',
            quote: '',
            quoteLocation: 'unknown'
          };
        }
        return {
          category: i.category || 'General',
          severity: i.severity || 'medium',
          finding: i.finding || '',
          remediation: i.remediation || '',
          section34Reference: i.section34Reference || '',
          quote: i.quote || '',
          quoteLocation: i.quoteLocation || 'unknown',
        };
      }),
      // Sanitize red flags with enhanced structure
      redFlags: (data.redFlags || []).map((r: RedFlagItem | string) => {
        if (typeof r === 'string') {
          return {
            flag: 'Issue',
            reason: r,
            section34Reference: '',
            riskLevel: 'high' as const,
            quote: '',
            quoteLocation: 'unknown'
          };
        }
        return {
          flag: r.flag || 'Issue',
          reason: r.reason || '',
          section34Reference: r.section34Reference || '',
          riskLevel: r.riskLevel || 'high',
          quote: r.quote || '',
          quoteLocation: r.quoteLocation || 'unknown',
        };
      }),
      // Sanitize language fixes
      languageFixes: (data.languageFixes || []).map((l: LanguageFix) => ({
        original: l.original || '',
        suggested: l.suggested || '',
        reason: l.reason || '',
        section34Impact: l.section34Impact || '',
        quoteLocation: l.quoteLocation || 'unknown',
      })),
      plannerQuestions: data.plannerQuestions || [],
      // Mainstream interface check (APTOS)
      mainstreamInterfaceCheck: {
        healthSystemRisk: data.mainstreamInterfaceCheck?.healthSystemRisk || false,
        educationSystemRisk: data.mainstreamInterfaceCheck?.educationSystemRisk || false,
        housingSystemRisk: data.mainstreamInterfaceCheck?.housingSystemRisk || false,
        justiceSystemRisk: data.mainstreamInterfaceCheck?.justiceSystemRisk || false,
        notes: data.mainstreamInterfaceCheck?.notes || '',
      },
      assessmentToolsUsed: data.assessmentToolsUsed || [],
      contentRestriction: data.contentRestriction || false,
      restrictionReason: data.restrictionReason || null,
    };

    // Determine status from overall score using new thresholds (80%+, 60-79%, <60%)
    if (!sanitizedData.status || sanitizedData.contentRestriction) {
      if (sanitizedData.contentRestriction) {
        sanitizedData.status = 'security_blocked';
      } else if (sanitizedData.overallScore >= 80) {
        sanitizedData.status = 'approved';
      } else if (sanitizedData.overallScore >= 60) {
        sanitizedData.status = 'revision_required';
      } else {
        sanitizedData.status = 'critical';
      }
    }

    // Store in cache
    await storeCache(supabase, contentHash, body.documentType, sanitizedData, result.model || 'unknown');

    console.log('[Senior Planner Audit] Analysis successful');
    console.log('[Senior Planner Audit] Tier used:', result.tierUsed);
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
        tier: result.tierUsed,
        cached: false,
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
