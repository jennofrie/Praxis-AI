/**
 * Report and documentation type definitions
 */

import { BaseEntity, Nullable } from './common';
import { ReportStatus, ReportType } from './enums';
import { LucideIcon } from 'lucide-react';

/**
 * Main Report interface
 */
export interface Report extends BaseEntity {
  // Identification
  referenceId: string; // e.g., "FCA-2024-001"
  type: ReportType;
  title: string;

  // Participant Information
  participantId: string;
  participantName?: string;
  participantNDIS?: string;

  // Author Information
  authorId: string;
  authorName?: string;
  authorRole?: string;
  coAuthors?: string[]; // User IDs

  // Status & Workflow
  status: ReportStatus;
  version: number;
  isDraft: boolean;

  // AI Generation
  isAIGenerated: boolean;
  aiConfidence?: number; // 0-100
  aiModelUsed?: string;
  humanReviewed: boolean;
  reviewedBy?: Nullable<string>;
  reviewedAt?: Nullable<Date>;

  // Content
  content: ReportContent;
  sections?: ReportSection[];

  // Dates
  reportDate: Date;
  assessmentDate?: Date;
  periodStart?: Date;
  periodEnd?: Date;

  // Approvals
  approvals?: Approval[];
  requiresApproval: boolean;
  approvedAt?: Nullable<Date>;

  // Distribution
  sharedWith?: string[]; // User IDs
  sentTo?: RecipientInfo[];

  // Attachments
  attachments?: string[];
  relatedReports?: string[];

  // NDIS Specific
  ndisClaimNumber?: string;
  serviceCodes?: string[];

  // Metadata
  tags?: string[];
  confidential: boolean;
  notes?: string;
}

/**
 * Report content structure
 */
export interface ReportContent {
  // Header
  participantDetails?: ParticipantDetails;
  reportPurpose?: string;
  dateOfAssessment?: Date;

  // Main sections (varies by report type)
  executiveSummary?: string;
  background?: string;
  clinicalObservations?: string;
  assessmentResults?: AssessmentResult[];
  functionalCapacity?: FunctionalCapacityAssessment;
  recommendations?: Recommendation[];
  goals?: string;
  interventions?: string;
  progress?: string;
  barriers?: string;
  supports?: string;

  // NDIS Evidence Matrix
  ndisEvidence?: NDISEvidence[];

  // Conclusions
  conclusion?: string;
  nextSteps?: string;

  // Signatures
  signature?: SignatureBlock;

  // Custom fields (extensible)
  customFields?: Record<string, unknown>;
}

/**
 * Report section (for structured reports)
 */
export interface ReportSection {
  id: string;
  title: string;
  order: number;
  content: string;
  aiGenerated: boolean;
  confidence?: number;
  lastEdited?: Date;
  lastEditedBy?: string;
}

/**
 * Participant details in report
 */
export interface ParticipantDetails {
  fullName: string;
  dateOfBirth: Date;
  age: number;
  ndisNumber: string;
  diagnosis: string[];
  contactInfo?: {
    phone?: string;
    email?: string;
    address?: string;
  };
  guardian?: {
    name: string;
    relationship: string;
    contact?: string;
  };
}

/**
 * Assessment result
 */
export interface AssessmentResult {
  assessmentName: string;
  date: Date;
  score?: number | string;
  interpretation?: string;
  normativeData?: string;
  domains?: AssessmentDomain[];
}

/**
 * Assessment domain/subdomain
 */
export interface AssessmentDomain {
  name: string;
  score: number | string;
  percentile?: number;
  interpretation: string;
  subdomains?: {
    name: string;
    score: number | string;
  }[];
}

/**
 * Functional Capacity Assessment
 */
export interface FunctionalCapacityAssessment {
  domains: FCADomain[];
  overallRating?: 'independent' | 'modified-independent' | 'supervision' | 'minimal-assist' | 'moderate-assist' | 'maximal-assist' | 'total-assist';
  summary?: string;
}

/**
 * FCA Domain
 */
export interface FCADomain {
  name: string;
  rating: string;
  description: string;
  evidenceObserved?: string[];
  barriers?: string[];
  supports?: string[];
}

/**
 * Recommendation
 */
export interface Recommendation {
  id: string;
  category: RecommendationCategory;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timeframe?: string;
  estimatedCost?: number;
  ndisCategory?: 'core' | 'capacity_building' | 'capital';
  implemented?: boolean;
  implementedDate?: Date;
}

/**
 * Recommendation categories
 */
export type RecommendationCategory =
  | 'assistive_technology'
  | 'home_modification'
  | 'therapy_intervention'
  | 'environmental_adjustment'
  | 'support_coordination'
  | 'skill_development'
  | 'community_access'
  | 'other';

/**
 * NDIS Evidence mapping
 */
export interface NDISEvidence {
  domain: string;
  subDomain?: string;
  observation: string;
  impactLevel: 'mild' | 'moderate' | 'significant' | 'severe';
  supportRequired: string;
  ndisOutcome?: string;
}

/**
 * Signature block
 */
export interface SignatureBlock {
  signatoryName: string;
  signatoryRole: string;
  qualifications: string;
  ahpraNumber?: string;
  providerNumber?: string;
  organization: string;
  date: Date;
  digitalSignature?: string;
}

/**
 * Approval
 */
export interface Approval {
  approverId: string;
  approverName: string;
  approverRole: string;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  timestamp: Date;
}

/**
 * Recipient info
 */
export interface RecipientInfo {
  name: string;
  email?: string;
  role?: string;
  sentAt: Date;
  opened?: boolean;
  openedAt?: Date;
}

/**
 * Report template
 */
export interface ReportTemplate extends BaseEntity {
  name: string;
  type: ReportType;
  description?: string;
  icon?: LucideIcon;

  // Template structure
  sections: TemplateSection[];
  defaultContent?: Partial<ReportContent>;

  // Settings
  isDefault: boolean;
  isActive: boolean;
  requiresApproval: boolean;

  // AI Configuration
  aiEnabled: boolean;
  aiPrompts?: Record<string, string>; // section -> prompt mapping

  // Usage stats
  usageCount: number;
  lastUsed?: Date;

  // Organization
  organizationId?: string;
  createdBy: string;
  tags?: string[];
}

/**
 * Template section
 */
export interface TemplateSection {
  id: string;
  title: string;
  order: number;
  required: boolean;
  aiGeneratable: boolean;
  placeholder?: string;
  helpText?: string;
}

/**
 * Report statistics
 */
export interface ReportStats {
  totalReports: number;
  draftReports: number;
  pendingReview: number;
  completedReports: number;
  generatedThisWeek: number;
  averageConfidence: number;
  byType: Record<ReportType, number>;
}

/**
 * Report filter params
 */
export interface ReportFilterParams {
  status?: ReportStatus | ReportStatus[];
  type?: ReportType | ReportType[];
  participantId?: string;
  authorId?: string;
  isAIGenerated?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  minConfidence?: number;
  requiresApproval?: boolean;
}

/**
 * Report summary (for lists)
 */
export interface ReportSummary {
  id: string;
  referenceId: string;
  type: ReportType;
  title: string;
  participantName: string;
  participantNDIS?: string;
  authorName?: string;
  status: ReportStatus;
  aiConfidence?: number;
  reportDate: Date;
  icon?: LucideIcon;
}

/**
 * Report create input
 */
export type ReportCreateInput = Omit<Report, 'id' | 'createdAt' | 'updatedAt' | 'version'>;

/**
 * Report update input
 */
export type ReportUpdateInput = Partial<ReportCreateInput>;

/**
 * Report export options
 */
export interface ReportExportOptions {
  format: 'pdf' | 'docx' | 'html';
  includeAttachments: boolean;
  includeSignatures: boolean;
  watermark?: string;
  template?: string;
}
