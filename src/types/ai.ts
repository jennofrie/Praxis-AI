/**
 * AI and automation type definitions
 */

import { BaseEntity, Nullable } from './common';
import { AIModelStatus, AIModelType, ReportType, SessionNoteFormat } from './enums';

/**
 * AI Generation Request
 */
export interface AIGenerationRequest extends BaseEntity {
  // Request Details
  requestId: string;
  userId: string;
  userName?: string;

  // Generation Type
  generationType: AIGenerationType;
  targetType: 'report' | 'session_note' | 'goal' | 'evidence_matrix' | 'recommendation' | 'summary';
  targetId?: string; // If updating existing

  // Input Data
  inputData: AIGenerationInput;
  context?: AIContext;

  // AI Configuration
  modelType: AIModelType;
  temperature?: number; // 0-1
  maxTokens?: number;
  customPrompt?: string;

  // Status
  status: AIGenerationStatus;
  queuePosition?: number;
  startedAt?: Nullable<Date>;
  completedAt?: Nullable<Date>;
  duration?: number; // seconds

  // Output
  result?: AIGenerationResult;
  confidence?: number; // 0-100
  qualityScore?: number; // 0-100

  // Review
  requiresReview: boolean;
  reviewedBy?: string;
  reviewedAt?: Nullable<Date>;
  reviewStatus?: 'pending' | 'approved' | 'rejected' | 'needs-revision';
  reviewComments?: string;

  // Error Handling
  error?: AIError;
  retryCount: number;
  maxRetries: number;

  // Metadata
  priority: 'low' | 'normal' | 'high' | 'urgent';
  tags?: string[];
  organizationId: string;
}

/**
 * AI Generation Types
 */
export type AIGenerationType =
  | 'report_generation'
  | 'session_note_enhancement'
  | 'goal_suggestion'
  | 'evidence_mapping'
  | 'recommendation_generation'
  | 'text_summarization'
  | 'clinical_analysis'
  | 'quality_check'
  | 'translation';

/**
 * AI Generation Status
 */
export type AIGenerationStatus =
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'pending-review';

/**
 * AI Generation Input
 */
export interface AIGenerationInput {
  // Primary Input
  prompt?: string;
  text?: string;
  data?: Record<string, unknown>;

  // Participant Context
  participantId?: string;
  participantData?: {
    age: number;
    diagnosis: string[];
    goals?: string[];
    background?: string;
  };

  // Session Context
  sessionId?: string;
  sessionNotes?: string;
  sessionFormat?: SessionNoteFormat;

  // Report Context
  reportType?: ReportType;
  reportTemplate?: string;
  previousReports?: string[];

  // Additional Context
  guidelines?: string[];
  restrictions?: string[];
  includeEvidence?: boolean;
  includeRecommendations?: boolean;
}

/**
 * AI Context (additional information for better generation)
 */
export interface AIContext {
  // Clinical Context
  clinicalHistory?: string[];
  currentGoals?: string[];
  interventions?: string[];
  assessmentResults?: Record<string, unknown>;

  // NDIS Context
  ndisPlan?: {
    funding: number;
    categories: string[];
    goals: string[];
  };

  // Template Context
  templateStructure?: string;
  requiredSections?: string[];
  exampleContent?: Record<string, string>;

  // Style Preferences
  tone?: 'formal' | 'conversational' | 'clinical';
  length?: 'brief' | 'moderate' | 'comprehensive';
  includeReferences?: boolean;
}

/**
 * AI Generation Result
 */
export interface AIGenerationResult {
  // Generated Content
  content: string;
  structuredContent?: Record<string, unknown>;

  // Metadata
  model: string;
  modelVersion?: string;
  tokensUsed: number;
  confidence: number;
  qualityScore: number;

  // Sections (if applicable)
  sections?: GeneratedSection[];

  // Suggestions
  suggestions?: string[];
  alternativeVersions?: string[];

  // Quality Indicators
  readabilityScore?: number;
  clinicalAccuracy?: number;
  ndisAlignment?: number;

  // References
  sources?: AISource[];
  citations?: string[];

  // Warnings
  warnings?: AIWarning[];
  flaggedContent?: string[];
}

/**
 * Generated Section
 */
export interface GeneratedSection {
  id: string;
  title: string;
  content: string;
  confidence: number;
  aiGenerated: boolean;
  requiresReview: boolean;
  suggestions?: string[];
}

/**
 * AI Source (for citation tracking)
 */
export interface AISource {
  type: 'guideline' | 'research' | 'template' | 'previous-report' | 'clinical-note';
  title: string;
  reference?: string;
  relevance: number; // 0-100
  excerpt?: string;
}

/**
 * AI Warning
 */
export interface AIWarning {
  type: 'low-confidence' | 'missing-data' | 'potential-error' | 'needs-verification' | 'compliance-issue';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  details?: string;
  section?: string;
  suggestion?: string;
}

/**
 * AI Error
 */
export interface AIError {
  code: string;
  message: string;
  details?: string;
  timestamp: Date;
  recoverable: boolean;
  suggestedAction?: string;
}

/**
 * AI Model Configuration
 */
export interface AIModelConfig extends BaseEntity {
  // Model Details
  modelType: AIModelType;
  modelName: string;
  provider: 'openai' | 'google' | 'anthropic' | 'local';
  version: string;

  // Status
  status: AIModelStatus;
  isDefault: boolean;
  isEnabled: boolean;

  // API Configuration
  apiEndpoint?: string;
  apiKey?: string; // Encrypted
  maxConcurrentRequests: number;
  rateLimitPerMinute: number;

  // Model Parameters
  defaultTemperature: number;
  defaultMaxTokens: number;
  supportedGenerationTypes: AIGenerationType[];

  // Performance
  averageResponseTime: number; // seconds
  successRate: number; // 0-100
  averageConfidence: number; // 0-100

  // Costs
  costPerToken?: number;
  monthlyBudget?: number;
  currentMonthCost?: number;

  // Usage Stats
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  lastUsed?: Nullable<Date>;

  // Metadata
  organizationId: string;
  notes?: string;
}

/**
 * AI Chat Message
 */
export interface AIChatMessage extends BaseEntity {
  // Session
  sessionId: string;
  userId: string;

  // Message
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;

  // Context
  participantId?: string;
  reportId?: string;
  goalId?: string;

  // AI Response Details (for assistant messages)
  modelUsed?: AIModelType;
  confidence?: number;
  sources?: AISource[];
  actions?: AIAction[];

  // User Feedback
  helpful?: boolean;
  feedback?: string;
  rating?: number; // 1-5

  // Metadata
  tokenCount?: number;
  responseTime?: number; // ms
}

/**
 * AI Action (suggested or taken by AI)
 */
export interface AIAction {
  id: string;
  type: 'insert' | 'generate' | 'summarize' | 'translate' | 'check' | 'suggest';
  label: string;
  description?: string;
  targetId?: string;
  targetType?: string;
  executed: boolean;
  executedAt?: Date;
}

/**
 * AI Template (for consistent AI generations)
 */
export interface AITemplate extends BaseEntity {
  // Template Details
  name: string;
  description: string;
  category: 'report' | 'session' | 'goal' | 'assessment' | 'other';
  type?: ReportType;

  // Prompt Engineering
  systemPrompt: string;
  userPromptTemplate: string;
  variables: TemplateVariable[];

  // Model Configuration
  preferredModel: AIModelType;
  temperature: number;
  maxTokens: number;

  // Output Configuration
  expectedFormat: 'text' | 'structured' | 'sections';
  outputSchema?: Record<string, unknown>;
  postProcessing?: string[];

  // Quality Control
  qualityThreshold: number; // Minimum acceptable quality score
  requiresReview: boolean;
  reviewers?: string[];

  // Usage
  isActive: boolean;
  usageCount: number;
  averageQuality: number;
  lastUsed?: Nullable<Date>;

  // Metadata
  createdBy: string;
  organizationId: string;
  tags?: string[];
  version: number;
}

/**
 * Template Variable
 */
export interface TemplateVariable {
  name: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'array' | 'object';
  required: boolean;
  default?: unknown;
  description?: string;
  validation?: string;
}

/**
 * AI Suggestion
 */
export interface AISuggestion {
  id: string;
  type: 'goal' | 'intervention' | 'recommendation' | 'evidence' | 'modification';
  title: string;
  description: string;
  confidence: number;
  reasoning?: string;
  benefits?: string[];
  considerations?: string[];
  relatedData?: Record<string, unknown>;
  accepted?: boolean;
  acceptedAt?: Nullable<Date>;
  acceptedBy?: string;
}

/**
 * AI Quality Check Result
 */
export interface AIQualityCheck {
  // Overall
  overallScore: number; // 0-100
  passed: boolean;
  timestamp: Date;

  // Specific Checks
  checks: QualityCheckItem[];

  // Issues Found
  issues: QualityIssue[];

  // Suggestions
  suggestions: string[];

  // Metadata
  checkedBy: AIModelType;
  duration: number; // ms
}

/**
 * Quality Check Item
 */
export interface QualityCheckItem {
  name: string;
  category: 'grammar' | 'clinical-accuracy' | 'completeness' | 'consistency' | 'compliance';
  passed: boolean;
  score: number; // 0-100
  details?: string;
}

/**
 * Quality Issue
 */
export interface QualityIssue {
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  description: string;
  location?: string; // Section or line number
  suggestion: string;
  autoFixable: boolean;
}

/**
 * AI Statistics
 */
export interface AIStats {
  // Usage
  totalGenerations: number;
  generationsToday: number;
  generationsThisWeek: number;
  generationsThisMonth: number;

  // Queue
  queueLength: number;
  averageWaitTime: number; // seconds
  averageProcessingTime: number; // seconds

  // Quality
  averageConfidence: number;
  averageQualityScore: number;
  successRate: number;

  // Models
  modelStats: Record<AIModelType, ModelStats>;

  // Costs
  totalCost: number;
  costThisMonth: number;
}

/**
 * Model Statistics
 */
export interface ModelStats {
  status: AIModelStatus;
  requestsToday: number;
  averageResponseTime: number;
  successRate: number;
  averageConfidence: number;
  costToday: number;
}

/**
 * AI Filter Params
 */
export interface AIFilterParams {
  status?: AIGenerationStatus | AIGenerationStatus[];
  generationType?: AIGenerationType | AIGenerationType[];
  userId?: string;
  participantId?: string;
  modelType?: AIModelType;
  dateFrom?: Date;
  dateTo?: Date;
  minConfidence?: number;
  requiresReview?: boolean;
}

/**
 * AI Generation create input
 */
export type AIGenerationCreateInput = Omit<
  AIGenerationRequest,
  'id' | 'createdAt' | 'updatedAt' | 'status' | 'queuePosition' | 'result' | 'retryCount'
>;
