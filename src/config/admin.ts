/**
 * Admin Configuration
 * Defines admin users and their permissions
 */

import { UserRole } from '@/types/enums';

// Admin email addresses - these users have full admin access
export const ADMIN_EMAILS = [
  'markaberiongibson@gmail.com',
  'daguiljennofrie@gmail.com',
] as const;

// Role-based permissions
export const ROLE_PERMISSIONS = {
  [UserRole.ADMIN]: {
    canAccessSettings: true,
    canManageUsers: true,
    canEditPrompts: true,
    canChangeAIProvider: true,
    canViewSystemStatus: true,
    canManageIntegrations: true,
    canViewAllParticipants: true,
    canExportData: true,
    canDeleteData: true,
  },
  [UserRole.PRACTICE_MANAGER]: {
    canAccessSettings: true,
    canManageUsers: true,
    canEditPrompts: false,
    canChangeAIProvider: false,
    canViewSystemStatus: true,
    canManageIntegrations: false,
    canViewAllParticipants: true,
    canExportData: true,
    canDeleteData: false,
  },
  [UserRole.SENIOR_OT]: {
    canAccessSettings: false,
    canManageUsers: false,
    canEditPrompts: false,
    canChangeAIProvider: false,
    canViewSystemStatus: false,
    canManageIntegrations: false,
    canViewAllParticipants: true,
    canExportData: true,
    canDeleteData: false,
  },
  [UserRole.OT]: {
    canAccessSettings: false,
    canManageUsers: false,
    canEditPrompts: false,
    canChangeAIProvider: false,
    canViewSystemStatus: false,
    canManageIntegrations: false,
    canViewAllParticipants: false,
    canExportData: true,
    canDeleteData: false,
  },
  [UserRole.ASSISTANT_OT]: {
    canAccessSettings: false,
    canManageUsers: false,
    canEditPrompts: false,
    canChangeAIProvider: false,
    canViewSystemStatus: false,
    canManageIntegrations: false,
    canViewAllParticipants: false,
    canExportData: false,
    canDeleteData: false,
  },
  [UserRole.VIEWER]: {
    canAccessSettings: false,
    canManageUsers: false,
    canEditPrompts: false,
    canChangeAIProvider: false,
    canViewSystemStatus: false,
    canManageIntegrations: false,
    canViewAllParticipants: false,
    canExportData: false,
    canDeleteData: false,
  },
} as const;

export type Permission = keyof typeof ROLE_PERMISSIONS[UserRole.ADMIN];

/**
 * Check if an email is an admin
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase() as typeof ADMIN_EMAILS[number]);
}

/**
 * Get the role for a user based on their email
 * Admin emails get ADMIN role, others default to OT
 */
export function getUserRole(email: string | null | undefined): UserRole {
  if (isAdminEmail(email)) {
    return UserRole.ADMIN;
  }
  // Default role for authenticated users
  return UserRole.OT;
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.[permission] ?? false;
}
