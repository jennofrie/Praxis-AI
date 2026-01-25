/**
 * Senior Planner (Section 34 Auditor) and CoC Assessor type definitions
 */

import { BaseEntity } from './common';

// ============================================================================
// SECTION 34 AUDITOR TYPES
// ============================================================================

/**
 * Document types that can be audited
 */
export type AuditDocumentType =
  | 'functional_capacity_assessment'
  | 'progress_report'
  | 'assistive_technology_assessment'
  | 'home_modification_report'
  | 'sil_assessment'
  | 'therapy_report'
  | 'plan_review_request'
  | 'other';

/**
 * Audit status based on overall score
 */
export type AuditStatus = 'excellent' | 'good' | 'needs_improvement' | 'critical' | 'security_blocked';

/**
 * Section 34 Audit Result from AI
 */
export interface AuditResult {
  // Overall Assessment
  overallScore: number; // 0-100
  status: AuditStatus;

  // Sub-scores (each 0-100)
  scores: {
    compliance: number;      // NDIS Act & Rules compliance
    nexus: number;           // Link between disability & supports
    valueForMoney: number;   // VFM demonstration
    evidence: number;        // Quality of clinical evidence
    significantChange: number; // Change documentation (if applicable)
  };

  // AI-Generated Content
  plannerSummary: string;    // Executive summary for planners
  strengths: string[];       // What's done well
  improvements: string[];    // Areas to improve
  redFlags: string[];        // Critical issues requiring attention
  languageFixes: LanguageFix[]; // Suggested language corrections
  plannerQuestions: string[]; // Questions a planner might ask

  // Security/Content Restriction
  contentRestriction?: boolean; // True if non-NDIS content detected
  restrictionReason?: string;

  // Metadata
  modelUsed: string;
  processingTime: number; // ms
  timestamp: Date;
}

/**
 * Language fix suggestion
 */
export interface LanguageFix {
  original: string;
  suggested: string;
  reason: string;
  category: 'clinical_language' | 'ndis_terminology' | 'clarity' | 'objectivity';
}

/**
 * Audit request to Edge Function
 */
export interface AuditRequest {
  documentType: AuditDocumentType;
  documentName?: string;
  content?: string;           // Plain text content
  fileData?: string;          // Base64 encoded PDF
  fileMimeType?: string;      // 'application/pdf', 'text/plain', etc.
}

/**
 * Stored audit record in database
 */
export interface ReportAudit extends BaseEntity {
  userId: string;
  documentType: AuditDocumentType;
  documentName: string;
  documentContent?: string;   // Original content (truncated for storage)

  // Scores
  overallScore: number;
  status: AuditStatus;
  complianceScore: number;
  nexusScore: number;
  vfmScore: number;
  evidenceScore: number;
  significantChangeScore: number;

  // AI Results (stored as JSONB)
  plannerSummary: string;
  strengths: string[];
  improvements: string[];
  redFlags: string[];
  languageFixes: LanguageFix[];
  plannerQuestions: string[];

  // Metadata
  contentRestricted: boolean;
  modelUsed: string;
  processingTimeMs: number;
}

/**
 * Audit history item (for sidebar)
 */
export interface AuditHistoryItem {
  id: string;
  documentType: AuditDocumentType;
  documentName: string;
  overallScore: number;
  status: AuditStatus;
  createdAt: Date;
}

// ============================================================================
// COC (CHANGE OF CIRCUMSTANCES) ASSESSOR TYPES
// ============================================================================

/**
 * CoC Trigger Categories
 */
export const COC_TRIGGER_CATEGORIES = [
  { id: 'health_condition', label: 'Change in health condition', description: 'New diagnosis, deterioration, or improvement' },
  { id: 'living_situation', label: 'Change in living situation', description: 'Moving home, change in support arrangements' },
  { id: 'support_needs', label: 'Change in support needs', description: 'Increase or decrease in required supports' },
  { id: 'goals_aspirations', label: 'Change in goals/aspirations', description: 'New life goals or changed priorities' },
  { id: 'informal_supports', label: 'Change in informal supports', description: 'Family/carer availability changes' },
  { id: 'equipment_at', label: 'Equipment or AT needs', description: 'New or replacement assistive technology' },
  { id: 'plan_utilisation', label: 'Plan under/over utilisation', description: 'Budget not being used as expected' },
  { id: 'crisis_emergency', label: 'Crisis or emergency', description: 'Urgent situation requiring immediate response' },
] as const;

export type CoCTriggerCategory = typeof COC_TRIGGER_CATEGORIES[number]['id'];

/**
 * CoC Eligibility Verdict
 */
export type CoCEligibilityVerdict =
  | 'likely_eligible'
  | 'possibly_eligible'
  | 'not_eligible'
  | 'security_blocked';

/**
 * CoC Assessment Result from AI
 */
export interface CoCAssessmentResult {
  // Core Assessment
  confidenceScore: number;     // 0-100
  eligibilityVerdict: CoCEligibilityVerdict;
  recommendedPathway: CoCPathway;

  // Dual Reports
  scReport: string;            // Support Coordinator focused report
  participantReport: string;   // Participant-friendly report

  // Guidance
  evidenceSuggestions: EvidenceSuggestion[];
  ndisReferences: NDISReference[];
  nextSteps: NextStep[];

  // Security/Content Restriction
  contentRestriction?: boolean;
  restrictionReason?: string;

  // Metadata
  modelUsed: string;
  processingTime: number;
  timestamp: Date;
}

/**
 * Recommended pathway for CoC
 */
export type CoCPathway =
  | 'plan_reassessment'
  | 'plan_variation'
  | 'light_touch_review'
  | 'scheduled_review'
  | 'no_action_required'
  | 'crisis_response';

/**
 * Evidence suggestion with priority
 */
export interface EvidenceSuggestion {
  id: string;
  title: string;
  description: string;
  priority: 'essential' | 'recommended' | 'optional';
  category: 'medical' | 'functional' | 'financial' | 'other';
  examples?: string[];
}

/**
 * NDIS reference/legislation citation
 */
export interface NDISReference {
  title: string;
  section: string;
  relevance: string;
  url?: string;
}

/**
 * Next step in action timeline
 */
export interface NextStep {
  order: number;
  title: string;
  description: string;
  timeframe: string;
  responsible: 'participant' | 'sc' | 'provider' | 'ndia';
}

/**
 * CoC Assessment request to Edge Function
 */
export interface CoCAssessmentRequest {
  circumstances: string;       // Description of change
  triggers: CoCTriggerCategory[];
  documentNames?: string[];
  content?: string;            // Additional text evidence
  fileData?: string;           // Base64 encoded PDF
  fileMimeType?: string;
}

/**
 * Stored CoC assessment record in database
 */
export interface CoCAssessment extends BaseEntity {
  userId: string;
  description: string;
  triggers: CoCTriggerCategory[];
  documentNames: string[];

  // Assessment Results
  confidenceScore: number;
  eligibilityVerdict: CoCEligibilityVerdict;
  recommendedPathway: CoCPathway;

  // Reports (stored as text)
  scReport: string;
  participantReport: string;

  // Guidance (stored as JSONB)
  evidenceSuggestions: EvidenceSuggestion[];
  ndisReferences: NDISReference[];
  nextSteps: NextStep[];

  // Metadata
  contentRestricted: boolean;
  modelUsed: string;
  processingTimeMs: number;
}

/**
 * CoC history item (for sidebar)
 */
export interface CoCHistoryItem {
  id: string;
  description: string;
  confidenceScore: number;
  eligibilityVerdict: CoCEligibilityVerdict;
  recommendedPathway: CoCPathway;
  createdAt: Date;
}

// ============================================================================
// VIEW MODE TYPES
// ============================================================================

/**
 * CoC view mode toggle
 */
export type CoCViewMode = 'sc' | 'participant';

/**
 * Toolkit mode toggle
 */
export type ToolkitMode = 'clinician' | 'planner' | 'coc';

// ============================================================================
// PDF EXPORT TYPES
// ============================================================================

/**
 * PDF export result
 */
export interface PDFExportResult {
  filename: string;
  pdfBlob: Blob;
}

/**
 * Senior Planner PDF options
 */
export interface SeniorPlannerPDFOptions {
  auditResult: AuditResult;
  documentName: string;
  documentTypeLabel: string;
  skipDownload?: boolean;
}

/**
 * CoC PDF options
 */
export interface CoCPDFOptions {
  assessmentResult: CoCAssessmentResult;
  viewMode: CoCViewMode;
  skipDownload?: boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get status color based on audit status
 */
export function getAuditStatusColor(status: AuditStatus): string {
  switch (status) {
    case 'excellent': return 'text-emerald-600';
    case 'good': return 'text-blue-600';
    case 'needs_improvement': return 'text-amber-600';
    case 'critical': return 'text-red-600';
    case 'security_blocked': return 'text-slate-600';
    default: return 'text-slate-600';
  }
}

/**
 * Get verdict color based on eligibility verdict
 */
export function getVerdictColor(verdict: CoCEligibilityVerdict): string {
  switch (verdict) {
    case 'likely_eligible': return 'text-emerald-600';
    case 'possibly_eligible': return 'text-amber-600';
    case 'not_eligible': return 'text-red-600';
    case 'security_blocked': return 'text-slate-600';
    default: return 'text-slate-600';
  }
}

/**
 * Get audit status from score
 */
export function getAuditStatusFromScore(score: number): AuditStatus {
  if (score >= 85) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 50) return 'needs_improvement';
  return 'critical';
}

/**
 * Get document type label
 */
export function getDocumentTypeLabel(type: AuditDocumentType): string {
  const labels: Record<AuditDocumentType, string> = {
    functional_capacity_assessment: 'Functional Capacity Assessment',
    progress_report: 'Progress Report',
    assistive_technology_assessment: 'Assistive Technology Assessment',
    home_modification_report: 'Home Modification Report',
    sil_assessment: 'SIL Assessment',
    therapy_report: 'Therapy Report',
    plan_review_request: 'Plan Review Request',
    other: 'Other Document',
  };
  return labels[type];
}

/**
 * Get pathway label
 */
export function getPathwayLabel(pathway: CoCPathway): string {
  const labels: Record<CoCPathway, string> = {
    plan_reassessment: 'Full Plan Reassessment',
    plan_variation: 'Plan Variation',
    light_touch_review: 'Light Touch Review',
    scheduled_review: 'Wait for Scheduled Review',
    no_action_required: 'No Action Required',
    crisis_response: 'Crisis Response',
  };
  return labels[pathway];
}
