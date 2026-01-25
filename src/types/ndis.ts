/**
 * NDIS (National Disability Insurance Scheme) specific type definitions
 */

import { BaseEntity, Nullable, Progress } from './common';
import { NDISPlanStatus, NDISFundingCategory } from './enums';

/**
 * NDIS Plan
 */
export interface NDISPlan extends BaseEntity {
  // Plan Identification
  planNumber: string;
  participantId: string;
  participantName?: string;
  participantNDIS?: string;

  // Plan Period
  startDate: Date;
  endDate: Date;
  reviewDate?: Date;
  dateApproved?: Date;

  // Status
  status: NDISPlanStatus;
  isActive: boolean;

  // Funding
  totalFunding: number; // Total plan budget in AUD
  utilizedFunding: number; // Amount spent
  remainingFunding: number; // Amount remaining
  utilizationPercentage: number; // 0-100

  // Funding Breakdown by Category
  fundingCategories: FundingCategory[];

  // Plan Management
  planManagementType: PlanManagementType;
  planManagerName?: string;
  planManagerContact?: string;

  // Support Coordinator
  supportCoordinatorName?: string;
  supportCoordinatorContact?: string;

  // Goals & Outcomes
  goals?: NDISGoal[];
  outcomes?: string[];

  // Service Agreements
  serviceAgreements?: ServiceAgreement[];

  // Reviews
  lastReviewDate?: Nullable<Date>;
  nextReviewDate?: Nullable<Date>;
  reviewNotes?: string;

  // Alerts
  alerts?: PlanAlert[];

  // Documents
  planDocumentUrl?: string;
  attachments?: string[];

  // Metadata
  notes?: string;
}

/**
 * Plan management types
 */
export type PlanManagementType =
  | 'self-managed'
  | 'plan-managed'
  | 'ndia-managed'
  | 'mixed';

/**
 * Funding Category (Core, Capacity Building, Capital)
 */
export interface FundingCategory {
  category: NDISFundingCategory;
  allocated: number;
  utilized: number;
  remaining: number;
  percentage: number;
  budgets: FundingBudget[];
}

/**
 * Funding Budget (specific support categories within each category)
 */
export interface FundingBudget {
  id: string;
  name: string;
  supportCategory: string;
  supportCategoryNumber?: string; // NDIS support category number
  allocated: number;
  utilized: number;
  remaining: number;
  percentage: number;
  serviceCodes?: string[];
  restrictions?: string;
}

/**
 * Common NDIS Support Categories
 */
export type NDISSupportCategory =
  // Core Supports
  | 'assistance_daily_life'
  | 'transport'
  | 'consumables'
  | 'assistance_products'
  // Capacity Building Supports
  | 'support_coordination'
  | 'improved_living_arrangements'
  | 'increased_social_participation'
  | 'finding_maintaining_employment'
  | 'improved_relationships'
  | 'improved_health_wellbeing'
  | 'improved_learning'
  | 'improved_life_choices'
  | 'improved_daily_living'
  // Capital Supports
  | 'assistive_technology'
  | 'home_modifications';

/**
 * NDIS Goal
 */
export interface NDISGoal {
  id: string;
  description: string;
  category: string;
  outcome: string; // NDIS outcome statement
  strategies?: string[];
  timeframe?: string;
  progress?: 'not-started' | 'in-progress' | 'achieved';
}

/**
 * Service Agreement
 */
export interface ServiceAgreement extends BaseEntity {
  planId: string;
  providerId: string;
  providerName: string;
  providerABN: string;
  providerNDISNumber: string;

  // Agreement Details
  agreementNumber: string;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'expired' | 'cancelled';

  // Services
  services: ServiceDetail[];
  totalValue: number;
  utilizedValue: number;

  // Terms
  termsAndConditions?: string;
  signedDate?: Date;
  signedBy?: string;

  // Documents
  agreementDocumentUrl?: string;
}

/**
 * Service Detail
 */
export interface ServiceDetail {
  serviceType: string;
  supportCategory: string;
  supportItem: string;
  itemNumber: string;
  hourlyRate?: number;
  units?: number;
  totalValue: number;
  frequency?: string;
  restrictions?: string;
}

/**
 * Plan Alert
 */
export interface PlanAlert {
  id: string;
  type: 'expiring' | 'depleted' | 'review-due' | 'over-utilization' | 'under-utilization';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  details?: string;
  createdAt: Date;
  acknowledged: boolean;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
}

/**
 * NDIS Claim
 */
export interface NDISClaim extends BaseEntity {
  // Claim Identification
  claimNumber: string;
  planId: string;
  participantId: string;

  // Service Details
  serviceDate: Date;
  sessionId?: string;
  providerNumber: string;
  providerName?: string;

  // Item Details
  supportItem: string;
  itemNumber: string;
  itemDescription: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  gst: number;

  // Status
  status: ClaimStatus;
  submittedDate?: Nullable<Date>;
  processedDate?: Nullable<Date>;
  paidDate?: Nullable<Date>;

  // Response
  claimResponseCode?: string;
  rejectionReason?: string;
  paymentAmount?: number;
  paymentReference?: string;

  // Metadata
  batchId?: string;
  notes?: string;
}

/**
 * Claim Status
 */
export type ClaimStatus =
  | 'draft'
  | 'pending'
  | 'submitted'
  | 'processing'
  | 'approved'
  | 'rejected'
  | 'paid'
  | 'cancelled';

/**
 * NDIS Support Item
 */
export interface NDISSupportItem {
  itemNumber: string;
  itemName: string;
  supportCategory: NDISSupportCategory;
  supportCategoryNumber: string;
  registrationGroup: string;
  unitOfMeasure: string;
  priceLimit: number; // Maximum price per unit
  quotaRelevant: boolean;
  ndiaRequested: boolean;
  providerTravel: boolean;
  shortNotice: boolean;
  effectiveDate: Date;
  endDate?: Nullable<Date>;
}

/**
 * Plan comparison (for renewals)
 */
export interface PlanComparison {
  previousPlan: NDISPlan;
  currentPlan: NDISPlan;
  changes: PlanChange[];
  summary: {
    fundingChange: number; // Difference in total funding
    fundingChangePercentage: number;
    categoriesIncreased: string[];
    categoriesDecreased: string[];
    newCategories: string[];
    removedCategories: string[];
  };
}

/**
 * Plan Change
 */
export interface PlanChange {
  field: string;
  previousValue: unknown;
  currentValue: unknown;
  changeType: 'increased' | 'decreased' | 'added' | 'removed' | 'modified';
  impact: 'positive' | 'negative' | 'neutral';
}

/**
 * NDIS Price Guide Entry
 */
export interface PriceGuideEntry {
  itemNumber: string;
  itemName: string;
  supportCategory: string;
  registrationGroup: string;
  unit: string;
  nationalPrice: number;
  nationalNonFace: number;
  remote: number;
  veryRemote: number;
  effectiveDate: Date;
  quotaRelevant: boolean;
}

/**
 * Plan funding overview (for dashboard)
 */
export interface PlanFundingOverview {
  planId: string;
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  utilizationRate: number;
  categoryBreakdown: {
    core: Progress;
    capacityBuilding: Progress;
    capital: Progress;
  };
  projectedEndDate?: Date;
  daysRemaining: number;
  averageDailySpend: number;
  projectedOverrun: boolean;
}

/**
 * NDIS Plan statistics
 */
export interface NDISPlanStats {
  totalPlans: number;
  activePlans: number;
  expiringPlans: number; // Expiring in next 90 days
  expiredPlans: number;
  totalFunding: number;
  utilizedFunding: number;
  averageUtilization: number;
  plansByStatus: Record<NDISPlanStatus, number>;
}

/**
 * NDIS Plan filter params
 */
export interface NDISPlanFilterParams {
  status?: NDISPlanStatus | NDISPlanStatus[];
  participantId?: string;
  expiringWithinDays?: number;
  utilizationMin?: number;
  utilizationMax?: number;
  search?: string;
}

/**
 * NDIS Plan summary (for lists)
 */
export interface NDISPlanSummary {
  id: string;
  planNumber: string;
  participantId: string;
  participantName: string;
  participantNDIS: string;
  status: NDISPlanStatus;
  startDate: Date;
  endDate: Date;
  totalFunding: number;
  utilizationPercentage: number;
  daysRemaining: number;
  alerts?: number;
}

/**
 * Plan create input
 */
export type NDISPlanCreateInput = Omit<
  NDISPlan,
  'id' | 'createdAt' | 'updatedAt' | 'utilizedFunding' | 'remainingFunding' | 'utilizationPercentage'
>;

/**
 * Plan update input
 */
export type NDISPlanUpdateInput = Partial<NDISPlanCreateInput>;
