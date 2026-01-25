/**
 * Enumeration types for Praxis AI Platform
 * All enums used across the application for type safety
 */

// Participant Status
export enum ParticipantStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING_REVIEW = 'pending_review',
  ON_HOLD = 'on_hold',
  DISCHARGED = 'discharged',
}

// Report Status
export enum ReportStatus {
  DRAFT = 'draft',
  REVIEW = 'review',
  FINAL = 'final',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ARCHIVED = 'archived',
}

// Report Types
export enum ReportType {
  FUNCTIONAL_CAPACITY = 'functional_capacity',
  PROGRESS_REPORT = 'progress_report',
  HOME_MODIFICATION = 'home_modification',
  ASSISTIVE_TECHNOLOGY = 'assistive_technology',
  SENSORY_PROFILE = 'sensory_profile',
  SIL_ASSESSMENT = 'sil_assessment',
  INITIAL_ASSESSMENT = 'initial_assessment',
  DISCHARGE_SUMMARY = 'discharge_summary',
}

// NDIS Plan Status
export enum NDISPlanStatus {
  ACTIVE = 'active',
  EXPIRING = 'expiring',
  EXPIRED = 'expired',
  DEPLETED = 'depleted',
  SUSPENDED = 'suspended',
}

// NDIS Funding Categories
export enum NDISFundingCategory {
  CORE = 'core',
  CAPACITY_BUILDING = 'capacity_building',
  CAPITAL = 'capital',
}

// User Roles
export enum UserRole {
  ADMIN = 'admin',
  SENIOR_OT = 'senior_ot',
  OT = 'ot',
  ASSISTANT_OT = 'assistant_ot',
  PRACTICE_MANAGER = 'practice_manager',
  VIEWER = 'viewer',
}

// Audit Action Types
export enum AuditAction {
  CREATE = 'create',
  EDIT = 'edit',
  DELETE = 'delete',
  VIEW = 'view',
  LOGIN = 'login',
  LOGOUT = 'logout',
  EXPORT = 'export',
  APPROVE = 'approve',
  REJECT = 'reject',
}

// AI Model Status
export enum AIModelStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  PROCESSING = 'processing',
  ERROR = 'error',
  IDLE = 'idle',
}

// AI Model Types
export enum AIModelType {
  GEMINI_PRO = 'gemini_pro',
  GEMINI_FLASH = 'gemini_flash',
  GPT_4 = 'gpt_4',
  CLINICAL_LLM_STANDARD = 'clinical_llm_standard',
  CLINICAL_LLM_ENHANCED = 'clinical_llm_enhanced',
  OLLAMA_LOCAL = 'ollama_local',
}

// Session Types
export enum SessionType {
  INITIAL_ASSESSMENT = 'initial_assessment',
  FOLLOW_UP = 'follow_up',
  REVIEW = 'review',
  GOAL_SETTING = 'goal_setting',
  DISCHARGE = 'discharge',
}

// Session Note Format
export enum SessionNoteFormat {
  SOAP = 'soap',
  DAP = 'dap',
  NARRATIVE = 'narrative',
}

// Goal Status
export enum GoalStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  ACHIEVED = 'achieved',
  PARTIALLY_ACHIEVED = 'partially_achieved',
  NOT_ACHIEVED = 'not_achieved',
  DISCONTINUED = 'discontinued',
}

// Consent Status
export enum ConsentStatus {
  GRANTED = 'granted',
  PENDING = 'pending',
  REVOKED = 'revoked',
  EXPIRED = 'expired',
}

// Notification Types
export enum NotificationType {
  PLAN_EXPIRING = 'plan_expiring',
  REVIEW_DUE = 'review_due',
  APPROVAL_PENDING = 'approval_pending',
  CONSENT_EXPIRING = 'consent_expiring',
  AI_GENERATION_COMPLETE = 'ai_generation_complete',
  SYSTEM_ALERT = 'system_alert',
}

// Priority Levels
export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

// Theme
export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system',
}

// Export Status
export enum ExportStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

// File Types
export enum FileType {
  PDF = 'pdf',
  DOCX = 'docx',
  XLSX = 'xlsx',
  IMAGE = 'image',
  VIDEO = 'video',
  OTHER = 'other',
}

// Registration Groups
export enum RegistrationGroup {
  THERAPEUTIC_SUPPORTS = 'therapeutic_supports',
  EARLY_CHILDHOOD = 'early_childhood',
  HOUSEHOLD_TASKS = 'household_tasks',
  ASSIST_TRAVEL = 'assist_travel',
}
