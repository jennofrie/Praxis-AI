/**
 * User and authentication type definitions
 */

import { BaseEntity, Address, ContactInfo, Nullable } from './common';
import { UserRole, Theme } from './enums';

/**
 * User interface
 */
export interface User extends BaseEntity {
  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;

  // Authentication
  passwordHash?: string; // Server-side only
  emailVerified: boolean;
  emailVerifiedAt?: Nullable<Date>;

  // Profile
  phone?: string;
  mobile?: string;
  dateOfBirth?: Date;
  address?: Address;

  // Professional Details
  role: UserRole;
  title?: string; // Dr., Mrs., etc.
  qualifications?: string[]; // BOccThy, MOT, etc.
  ahpraNumber?: string; // Australian Health Practitioner Regulation Agency
  providerNumber?: string; // NDIS Provider Number
  specializations?: string[];

  // Organization
  organizationId: string;
  organizationName?: string;
  department?: string;
  teamId?: string;

  // Employment
  employmentStatus: 'full-time' | 'part-time' | 'casual' | 'contractor' | 'inactive';
  startDate?: Date;
  endDate?: Nullable<Date>;

  // Permissions
  permissions: Permission[];
  isActive: boolean;
  isSuperAdmin: boolean;

  // Settings
  preferences: UserPreferences;
  notificationSettings: NotificationSettings;

  // Digital Signature
  digitalSignature?: string; // URL to signature image

  // Session
  lastLogin?: Nullable<Date>;
  lastActivity?: Nullable<Date>;
  sessionCount: number;

  // 2FA
  twoFactorEnabled: boolean;
  twoFactorSecret?: string; // Encrypted, server-side only

  // Metadata
  timezone?: string;
  locale?: string;
  notes?: string;
}

/**
 * User preferences
 */
export interface UserPreferences {
  theme: Theme;
  language: 'en' | 'en-AU';
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  timeFormat: '12h' | '24h';
  defaultReportTemplate?: string;
  defaultReportType?: string;
  aiAssistanceEnabled: boolean;
  autoSaveDrafts: boolean;
  compactView: boolean;
  showAvatars: boolean;
}

/**
 * Notification settings
 */
export interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  notifyOnNewParticipant: boolean;
  notifyOnReportReview: boolean;
  notifyOnPlanExpiry: boolean;
  notifyOnApprovalRequired: boolean;
  notifyOnMention: boolean;
  notifyOnAssignment: boolean;
  dailyDigest: boolean;
  weeklyReport: boolean;
}

/**
 * Permission structure
 */
export interface Permission {
  resource: PermissionResource;
  actions: PermissionAction[];
  scope?: 'own' | 'team' | 'organization' | 'all';
  conditions?: Record<string, unknown>;
}

/**
 * Permission resources
 */
export type PermissionResource =
  | 'participants'
  | 'reports'
  | 'sessions'
  | 'goals'
  | 'ndis-plans'
  | 'audits'
  | 'users'
  | 'settings'
  | 'templates'
  | 'ai-tools'
  | 'billing'
  | 'analytics';

/**
 * Permission actions
 */
export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'approve' | 'export' | 'share';

/**
 * Authentication session
 */
export interface AuthSession {
  id: string;
  userId: string;
  token: string;
  refreshToken?: string;
  ipAddress: string;
  userAgent: string;
  device?: string;
  location?: string;
  createdAt: Date;
  expiresAt: Date;
  lastActivity: Date;
  isActive: boolean;
}

/**
 * Login credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
  twoFactorCode?: string;
}

/**
 * Login response
 */
export interface LoginResponse {
  success: boolean;
  user?: User;
  token?: string;
  refreshToken?: string;
  expiresAt?: Date;
  requiresTwoFactor?: boolean;
  error?: string;
}

/**
 * Registration data
 */
export interface RegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  role?: UserRole;
  organizationId: string;
  ahpraNumber?: string;
  providerNumber?: string;
  acceptedTerms: boolean;
}

/**
 * Password reset request
 */
export interface PasswordResetRequest {
  email: string;
}

/**
 * Password reset data
 */
export interface PasswordResetData {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * User profile update
 */
export interface UserProfileUpdate {
  firstName?: string;
  lastName?: string;
  phone?: string;
  mobile?: string;
  avatar?: string;
  qualifications?: string[];
  ahpraNumber?: string;
  providerNumber?: string;
  specializations?: string[];
  digitalSignature?: string;
  preferences?: Partial<UserPreferences>;
  notificationSettings?: Partial<NotificationSettings>;
}

/**
 * User summary (for lists)
 */
export interface UserSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  role: UserRole;
  organizationName?: string;
  isActive: boolean;
  lastActivity?: Nullable<Date>;
}

/**
 * Team
 */
export interface Team extends BaseEntity {
  name: string;
  description?: string;
  organizationId: string;
  leaderId: string;
  leaderName?: string;
  memberIds: string[];
  members?: UserSummary[];
  isActive: boolean;
}

/**
 * Organization
 */
export interface Organization extends BaseEntity {
  // Basic Information
  name: string;
  abn: string; // Australian Business Number
  logo?: string;
  website?: string;

  // Contact
  contactInfo: ContactInfo;
  address: Address;

  // NDIS Registration
  ndisProviderNumber: string;
  registrationGroups: string[];
  registrationExpiry?: Date;

  // Settings
  settings: OrganizationSettings;

  // Subscription
  subscriptionTier: 'starter' | 'professional' | 'enterprise';
  subscriptionStatus: 'active' | 'trial' | 'suspended' | 'cancelled';
  subscriptionExpiry?: Date;

  // Limits
  userLimit: number;
  storageLimit: number; // GB
  currentUsers: number;
  currentStorage: number;

  // Metadata
  isActive: boolean;
  timezone: string;
  locale: string;
}

/**
 * Organization settings
 */
export interface OrganizationSettings {
  // Branding
  brandColor?: string;
  customDomain?: string;

  // Clinical Workflow
  defaultReportTemplate?: string;
  defaultReviewPeriod: number; // days
  requireReportApproval: boolean;

  // AI Configuration
  aiModelPreference: string;
  aiConfidenceThreshold: number;
  aiAutoGenerateEnabled: boolean;

  // Security
  enforcePasswordPolicy: boolean;
  requireTwoFactor: boolean;
  sessionTimeout: number; // minutes
  allowedIPRanges?: string[];

  // Compliance
  auditRetentionDays: number;
  dataRetentionDays: number;
  consentRenewalMonths: number;

  // Integrations
  enabledIntegrations?: string[];
}

/**
 * Activity status
 */
export type ActivityStatus = 'online' | 'away' | 'busy' | 'offline';

/**
 * Active session info (for UI)
 */
export interface ActiveSessionInfo {
  userId: string;
  userName: string;
  avatar?: string;
  role: UserRole;
  status: ActivityStatus;
  lastActivity: Date;
  currentPage?: string;
}

/**
 * User statistics
 */
export interface UserStats {
  totalReportsCreated: number;
  reportsThisMonth: number;
  activeParticipants: number;
  sessionsLogged: number;
  averageReportConfidence: number;
  performanceRating?: number;
}

/**
 * User filter params
 */
export interface UserFilterParams {
  role?: UserRole | UserRole[];
  organizationId?: string;
  teamId?: string;
  isActive?: boolean;
  search?: string;
  employmentStatus?: string;
}

/**
 * User create input
 */
export type UserCreateInput = Omit<
  User,
  'id' | 'createdAt' | 'updatedAt' | 'passwordHash' | 'sessionCount' | 'lastLogin' | 'lastActivity'
>;

/**
 * User update input
 */
export type UserUpdateInput = Partial<UserProfileUpdate>;
