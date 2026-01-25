/**
 * Participant-related type definitions
 */

import { BaseEntity, Address, ContactInfo, Nullable } from './common';
import { ParticipantStatus, GoalStatus } from './enums';

/**
 * Main Participant interface
 */
export interface Participant extends BaseEntity {
  // Personal Information
  firstName: string;
  lastName: string;
  preferredName?: string;
  dateOfBirth: Date;
  gender: Gender;
  pronouns?: string;
  avatar?: string;

  // NDIS Information
  ndisNumber: string;
  ndisPlanId?: string;

  // Contact Information
  contactInfo: ContactInfo;
  address: Address;

  // Guardian/Legal Representative (if applicable)
  guardian?: Guardian;

  // Medical Information
  diagnosis: string[];
  medications?: Medication[];
  allergies?: string[];
  medicalNotes?: string;

  // Status & Engagement
  status: ParticipantStatus;
  enrollmentDate: Date;
  dischargeDate?: Nullable<Date>;
  dischargeReason?: string;

  // Session Tracking
  nextSession?: Nullable<Date>;
  lastActivity?: Nullable<Date>;
  totalSessions: number;
  averageSessionsPerWeek: number;

  // Goals
  goals?: Goal[];
  activeGoalsCount: number;

  // Case Manager
  assignedOTId: string;
  assignedOTName?: string;

  // Metadata
  tags?: string[];
  notes?: string;
  priority?: 'low' | 'medium' | 'high';
}

/**
 * Gender options
 */
export type Gender = 'male' | 'female' | 'non-binary' | 'prefer-not-to-say' | 'other';

/**
 * Guardian/Legal Representative
 */
export interface Guardian {
  name: string;
  relationship: string;
  contactInfo: ContactInfo;
  legalAuthority: boolean;
  ndisNominee: boolean;
}

/**
 * Medication
 */
export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  prescribedBy?: string;
  startDate: Date;
  endDate?: Nullable<Date>;
  notes?: string;
}

/**
 * Participant Goal
 */
export interface Goal extends BaseEntity {
  participantId: string;
  title: string;
  description: string;
  category: GoalCategory;
  status: GoalStatus;

  // Timeline
  startDate: Date;
  targetDate: Date;
  achievedDate?: Nullable<Date>;

  // Progress Tracking
  progress: number; // 0-100
  milestones?: Milestone[];

  // NDIS Alignment
  ndisOutcome?: string;
  fundingCategory?: 'core' | 'capacity_building' | 'capital';

  // Measurement
  measurementMethod?: string;
  baselineScore?: number;
  currentScore?: number;
  targetScore?: number;

  // Metadata
  priority: 'low' | 'medium' | 'high';
  reviewDate?: Date;
  notes?: string;
}

/**
 * Goal Categories
 */
export type GoalCategory =
  | 'fine_motor_skills'
  | 'gross_motor_skills'
  | 'sensory_regulation'
  | 'self_care'
  | 'social_participation'
  | 'communication'
  | 'cognitive'
  | 'behavioral'
  | 'environmental_modification'
  | 'other';

/**
 * Goal Milestone
 */
export interface Milestone {
  id: string;
  title: string;
  description: string;
  targetDate: Date;
  achieved: boolean;
  achievedDate?: Nullable<Date>;
  notes?: string;
}

/**
 * Session record
 */
export interface Session extends BaseEntity {
  participantId: string;
  therapistId: string;
  therapistName?: string;

  // Session Details
  date: Date;
  duration: number; // minutes
  sessionType: 'initial_assessment' | 'follow_up' | 'review' | 'goal_setting' | 'discharge';
  location: 'clinic' | 'home' | 'school' | 'community' | 'telehealth';

  // Billing
  billable: boolean;
  billedHours: number;
  serviceCode?: string;
  claimNumber?: string;
  claimStatus?: 'pending' | 'approved' | 'rejected' | 'paid';

  // Clinical Notes
  notes?: string;
  noteFormat?: 'soap' | 'dap' | 'narrative';
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;

  // Attendance
  attended: boolean;
  cancellationReason?: string;
  cancelledBy?: string;

  // Goals Addressed
  goalsAddressed?: string[];

  // Attachments
  attachments?: string[];

  // Signatures
  therapistSignature?: string;
  participantSignature?: string;
  signedAt?: Nullable<Date>;
}

/**
 * Participant filter params
 */
export interface ParticipantFilterParams {
  status?: ParticipantStatus | ParticipantStatus[];
  search?: string;
  assignedOTId?: string;
  hasUpcomingReview?: boolean;
  planStatus?: string;
  tags?: string[];
  dateFrom?: Date;
  dateTo?: Date;
}

/**
 * Participant summary (for lists)
 */
export interface ParticipantSummary {
  id: string;
  firstName: string;
  lastName: string;
  ndisNumber: string;
  avatar?: string;
  status: ParticipantStatus;
  nextSession?: Nullable<Date>;
  lastActivity?: Nullable<Date>;
  activeGoalsCount: number;
  assignedOTName?: string;
}

/**
 * Participant statistics
 */
export interface ParticipantStats {
  totalParticipants: number;
  activeParticipants: number;
  inactiveParticipants: number;
  pendingReview: number;
  averageSessionsPerWeek: number;
  totalBillableHours: number;
  newThisMonth: number;
  dischargedThisMonth: number;
}

/**
 * Participant create input
 */
export type ParticipantCreateInput = Omit<
  Participant,
  'id' | 'createdAt' | 'updatedAt' | 'totalSessions' | 'averageSessionsPerWeek' | 'activeGoalsCount'
>;

/**
 * Participant update input
 */
export type ParticipantUpdateInput = Partial<ParticipantCreateInput>;
