/**
 * Audit trail and compliance type definitions
 */

import { BaseEntity, Nullable } from './common';
import { AuditAction, ConsentStatus } from './enums';

/**
 * Audit Log Entry
 */
export interface AuditLog extends BaseEntity {
  // Event Details
  timestamp: Date;
  action: AuditAction;
  resource: string; // e.g., 'participant', 'report', 'user'
  resourceId: string;
  resourceType: string;

  // Actor Information
  userId: string;
  userName: string;
  userRole: string;
  userEmail?: string;

  // Target Information (if different from resource)
  targetUserId?: string;
  targetUserName?: string;
  participantId?: string;
  participantName?: string;

  // Technical Details
  ipAddress: string;
  userAgent: string;
  device?: string;
  location?: string;
  sessionId?: string;

  // Change Details
  changes?: AuditChange[];
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;

  // Description
  description: string;
  details?: string;

  // Status
  success: boolean;
  errorMessage?: string;

  // Security
  securityLevel: SecurityLevel;
  flagged: boolean;
  flagReason?: string;

  // Metadata
  tags?: string[];
  organizationId: string;
}

/**
 * Security levels
 */
export type SecurityLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * Audit Change (field-level tracking)
 */
export interface AuditChange {
  field: string;
  fieldLabel: string;
  oldValue: unknown;
  newValue: unknown;
  changeType: 'create' | 'update' | 'delete';
}

/**
 * Consent Record
 */
export interface ConsentRecord extends BaseEntity {
  // Participant
  participantId: string;
  participantName?: string;

  // Consent Type
  consentType: ConsentType;
  purpose: string;
  description?: string;

  // Status
  status: ConsentStatus;
  version: number; // Track consent form version

  // Dates
  grantedDate?: Nullable<Date>;
  expiryDate?: Nullable<Date>;
  revokedDate?: Nullable<Date>;
  lastReviewedDate?: Nullable<Date>;

  // Grantor Information
  grantedBy: string; // Participant or Guardian
  grantedByRelationship?: string; // 'self', 'parent', 'guardian', 'nominee'
  guardianName?: string;
  guardianContact?: string;

  // Scope
  scope: ConsentScope;
  limitations?: string[];
  specificProviders?: string[];

  // Documentation
  consentFormUrl?: string;
  signature?: string;
  witnessSignature?: string;
  witnessName?: string;
  witnessRole?: string;

  // Reminders
  reminderSent?: boolean;
  reminderDate?: Nullable<Date>;

  // Metadata
  notes?: string;
  organizationId: string;
}

/**
 * Consent Types
 */
export type ConsentType =
  | 'personal_information_collection'
  | 'information_sharing'
  | 'photography_video'
  | 'ndis_access'
  | 'treatment'
  | 'research'
  | 'marketing'
  | 'third_party_disclosure'
  | 'telehealth'
  | 'data_storage';

/**
 * Consent Scope
 */
export interface ConsentScope {
  // Who can access
  providers?: string[];
  organizations?: string[];
  individuals?: string[];

  // What can be accessed
  includePersonalInfo: boolean;
  includeMedicalInfo: boolean;
  includeNDISInfo: boolean;
  includeReports: boolean;
  includePhotos: boolean;
  includeVideos: boolean;

  // How it can be used
  allowSharing: boolean;
  allowResearch: boolean;
  allowMarketing: boolean;
  allowThirdParty: boolean;

  // Where data can be stored
  dataStorageLocations?: string[];
}

/**
 * Compliance Check
 */
export interface ComplianceCheck extends BaseEntity {
  // Check Details
  checkType: ComplianceCheckType;
  title: string;
  description: string;

  // Target
  targetType: 'participant' | 'user' | 'organization' | 'report' | 'plan';
  targetId: string;

  // Schedule
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'manual';
  lastChecked?: Nullable<Date>;
  nextCheck?: Nullable<Date>;

  // Results
  status: 'pass' | 'fail' | 'warning' | 'not-applicable';
  score?: number; // 0-100
  issues?: ComplianceIssue[];

  // Actions
  requiresAction: boolean;
  actionRequired?: string;
  actionTakenBy?: string;
  actionTakenAt?: Nullable<Date>;

  // Auditor
  checkedBy?: string;
  approvedBy?: string;
  approvedAt?: Nullable<Date>;

  // Documentation
  evidenceUrls?: string[];
  reportUrl?: string;

  // Metadata
  organizationId: string;
}

/**
 * Compliance Check Types
 */
export type ComplianceCheckType =
  | 'ndis_quality_safeguards'
  | 'privacy_act_compliance'
  | 'data_security'
  | 'consent_validity'
  | 'record_retention'
  | 'professional_standards'
  | 'service_agreements'
  | 'incident_management'
  | 'feedback_complaints';

/**
 * Compliance Issue
 */
export interface ComplianceIssue {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  description: string;
  recommendation: string;
  dueDate?: Date;
  resolved: boolean;
  resolvedDate?: Nullable<Date>;
  resolvedBy?: string;
  notes?: string;
}

/**
 * Security Event
 */
export interface SecurityEvent extends BaseEntity {
  // Event Details
  eventType: SecurityEventType;
  severity: SecurityLevel;
  title: string;
  description: string;

  // Actor
  userId?: string;
  userName?: string;
  ipAddress: string;
  userAgent?: string;

  // Detection
  detectedAt: Date;
  detectedBy: 'system' | 'user' | 'automated';

  // Response
  status: 'open' | 'investigating' | 'resolved' | 'false-positive';
  acknowledgedBy?: string;
  acknowledgedAt?: Nullable<Date>;
  resolvedBy?: string;
  resolvedAt?: Nullable<Date>;

  // Impact
  affectedResources?: string[];
  dataExposed: boolean;
  userImpacted?: string[];

  // Actions
  actionsTaken?: string[];
  preventiveMeasures?: string[];

  // Reporting
  reportedToAuthorities: boolean;
  reportedAt?: Nullable<Date>;
  incidentNumber?: string;

  // Metadata
  organizationId: string;
  tags?: string[];
}

/**
 * Security Event Types
 */
export type SecurityEventType =
  | 'unauthorized_access'
  | 'failed_login_attempts'
  | 'privilege_escalation'
  | 'data_breach'
  | 'suspicious_activity'
  | 'malware_detection'
  | 'phishing_attempt'
  | 'ddos_attack'
  | 'configuration_change'
  | 'policy_violation';

/**
 * Data Access Log
 */
export interface DataAccessLog extends BaseEntity {
  // Access Details
  userId: string;
  userName: string;
  userRole: string;

  // Resource Accessed
  resourceType: 'participant' | 'report' | 'plan' | 'user' | 'session';
  resourceId: string;
  participantId?: string;
  participantName?: string;

  // Access Type
  accessType: 'view' | 'download' | 'export' | 'print' | 'share';
  purpose?: string;

  // Technical
  timestamp: Date;
  ipAddress: string;
  duration?: number; // seconds
  dataVolume?: number; // KB

  // Authorization
  authorized: boolean;
  authorizationMethod: 'role-based' | 'explicit-consent' | 'emergency-access';
  consentRecordId?: string;

  // Metadata
  organizationId: string;
}

/**
 * Privacy Impact Assessment
 */
export interface PrivacyImpactAssessment extends BaseEntity {
  // Assessment Details
  title: string;
  description: string;
  scope: string;

  // Project/Initiative
  projectName: string;
  projectOwner: string;
  startDate: Date;
  completionDate?: Nullable<Date>;

  // Assessment
  dataCollected: string[];
  purposeOfCollection: string;
  legalBasis: string;
  dataSharing: boolean;
  thirdParties?: string[];
  dataRetention: string;
  securityMeasures: string[];

  // Risk Assessment
  risks: PrivacyRisk[];
  overallRiskLevel: 'low' | 'medium' | 'high';

  // Mitigation
  mitigationStrategies: string[];

  // Approval
  status: 'draft' | 'in-review' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: Nullable<Date>;
  approvedBy?: string;
  approvedAt?: Nullable<Date>;

  // Next Review
  nextReviewDate?: Date;

  // Metadata
  organizationId: string;
}

/**
 * Privacy Risk
 */
export interface PrivacyRisk {
  id: string;
  description: string;
  likelihood: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  mitigation: string;
  residualRisk: 'low' | 'medium' | 'high';
}

/**
 * Audit statistics
 */
export interface AuditStats {
  totalActivities: number;
  todayActivities: number;
  securityAlerts: number;
  consentRecords: number;
  consentExpiring: number;
  consentRevoked: number;
  complianceScore: number; // 0-100
  failedLogins: number;
  dataAccessEvents: number;
}

/**
 * Audit filter params
 */
export interface AuditFilterParams {
  action?: AuditAction | AuditAction[];
  userId?: string;
  participantId?: string;
  resource?: string;
  dateFrom?: Date;
  dateTo?: Date;
  securityLevel?: SecurityLevel | SecurityLevel[];
  flagged?: boolean;
  success?: boolean;
  search?: string;
}

/**
 * Consent filter params
 */
export interface ConsentFilterParams {
  status?: ConsentStatus | ConsentStatus[];
  participantId?: string;
  consentType?: ConsentType | ConsentType[];
  expiringWithinDays?: number;
  search?: string;
}

/**
 * Audit export options
 */
export interface AuditExportOptions {
  format: 'csv' | 'pdf' | 'json';
  includeChanges: boolean;
  includeSystemEvents: boolean;
  dateRange: {
    from: Date;
    to: Date;
  };
  filters?: AuditFilterParams;
}
