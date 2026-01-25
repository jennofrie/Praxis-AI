/**
 * Praxis AI Platform - Type Definitions
 *
 * Central export file for all TypeScript types and interfaces
 * Production-ready with ZERO tolerance for 'any' types
 *
 * @packageDocumentation
 */

// ============================================================================
// ENUMS
// ============================================================================
export * from './enums';

// ============================================================================
// COMMON TYPES
// ============================================================================
export * from './common';

// ============================================================================
// PARTICIPANT TYPES
// ============================================================================
export * from './participant';

// ============================================================================
// REPORT TYPES
// ============================================================================
export * from './report';

// ============================================================================
// USER & AUTHENTICATION TYPES
// ============================================================================
export * from './user';

// ============================================================================
// NDIS TYPES
// ============================================================================
export * from './ndis';

// ============================================================================
// AUDIT & COMPLIANCE TYPES
// ============================================================================
export * from './audit';

// ============================================================================
// AI & AUTOMATION TYPES
// ============================================================================
export * from './ai';

// ============================================================================
// SENIOR PLANNER & COC TYPES
// ============================================================================
export * from './senior-planner';

// ============================================================================
// TYPE GUARDS (for runtime type checking)
// ============================================================================

import { ParticipantStatus, ReportStatus, UserRole, NDISPlanStatus } from './enums';

/**
 * Type guard: Check if value is a valid ParticipantStatus
 */
export function isParticipantStatus(value: unknown): value is ParticipantStatus {
  return Object.values(ParticipantStatus).includes(value as ParticipantStatus);
}

/**
 * Type guard: Check if value is a valid ReportStatus
 */
export function isReportStatus(value: unknown): value is ReportStatus {
  return Object.values(ReportStatus).includes(value as ReportStatus);
}

/**
 * Type guard: Check if value is a valid UserRole
 */
export function isUserRole(value: unknown): value is UserRole {
  return Object.values(UserRole).includes(value as UserRole);
}

/**
 * Type guard: Check if value is a valid NDISPlanStatus
 */
export function isNDISPlanStatus(value: unknown): value is NDISPlanStatus {
  return Object.values(NDISPlanStatus).includes(value as NDISPlanStatus);
}

/**
 * Type guard: Check if value is a valid date
 */
export function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

/**
 * Type guard: Check if value is a non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Type guard: Check if value is a valid email
 */
export function isValidEmail(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
}

/**
 * Type guard: Check if value is a valid NDIS number
 */
export function isValidNDISNumber(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const ndisRegex = /^\d{9}$/;
  return ndisRegex.test(value);
}

/**
 * Type guard: Check if value is a valid ABN
 */
export function isValidABN(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const abnRegex = /^\d{11}$/;
  return abnRegex.test(value.replace(/\s/g, ''));
}

/**
 * Type guard: Check if value is a valid UUID
 */
export function isValidUUID(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Deep Partial - Make all properties optional recursively
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Deep Required - Make all properties required recursively
 */
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

/**
 * Mutable - Remove readonly modifiers
 */
export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

/**
 * Without - Remove specific keys from type
 */
export type Without<T, K extends keyof T> = Omit<T, K>;

/**
 * ValueOf - Get union of all values in object type
 */
export type ValueOf<T> = T[keyof T];

/**
 * Awaited Type - Unwrap Promise type
 */
export type Awaited<T> = T extends Promise<infer U> ? U : T;

/**
 * AsyncReturnType - Get return type of async function
 */
export type AsyncReturnType<T extends (...args: unknown[]) => Promise<unknown>> = Awaited<ReturnType<T>>;

/**
 * Exact - Enforce exact type match (no extra properties)
 */
export type Exact<T, Shape> = T extends Shape
  ? Exclude<keyof T, keyof Shape> extends never
    ? T
    : never
  : never;

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Maximum file upload size (10 MB)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Supported file types for uploads
 */
export const SUPPORTED_FILE_TYPES = ['pdf', 'docx', 'xlsx', 'jpg', 'jpeg', 'png', 'mp4'] as const;

/**
 * Default pagination limit
 */
export const DEFAULT_PAGE_LIMIT = 50;

/**
 * Maximum pagination limit
 */
export const MAX_PAGE_LIMIT = 100;

/**
 * Session timeout (30 minutes)
 */
export const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

/**
 * AI confidence threshold for auto-approval
 */
export const AI_CONFIDENCE_THRESHOLD = 85;

/**
 * NDIS number regex pattern
 */
export const NDIS_NUMBER_PATTERN = /^\d{9}$/;

/**
 * ABN regex pattern
 */
export const ABN_PATTERN = /^\d{11}$/;

/**
 * Phone number regex pattern (Australian)
 */
export const AU_PHONE_PATTERN = /^(\+?61|0)[2-478](?:[ -]?[0-9]){8}$/;

// ============================================================================
// API RESPONSE WRAPPERS
// ============================================================================

import { APIResponse, PaginatedResponse } from './common';

/**
 * Success response helper
 */
export function successResponse<T>(data: T, message?: string): APIResponse<T> {
  return {
    success: true,
    data,
    message,
  };
}

/**
 * Error response helper
 */
export function errorResponse<T = never>(message: string, code = 'UNKNOWN_ERROR'): APIResponse<T> {
  return {
    success: false,
    error: {
      code,
      message,
      timestamp: new Date(),
    },
  };
}

/**
 * Create paginated response
 */
export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResponse<T> {
  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasMore: page * limit < total,
  };
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Assert that value is never (for exhaustive checks)
 */
export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${value}`);
}

/**
 * Check if object has property
 */
export function hasProperty<K extends string>(
  obj: unknown,
  key: K
): obj is Record<K, unknown> {
  return typeof obj === 'object' && obj !== null && key in obj;
}

/**
 * Safe JSON parse with type checking
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

// ============================================================================
// TYPE DOCUMENTATION
// ============================================================================

/**
 * @fileoverview
 *
 * This file serves as the central hub for all type definitions in the Praxis AI Platform.
 *
 * ## Type Safety Rules
 *
 * 1. ZERO TOLERANCE for 'any' types
 * 2. All functions must have explicit return types
 * 3. All component props must be typed with interfaces
 * 4. Use type guards for runtime validation
 * 5. Use enums for fixed sets of values
 * 6. Use union types for variable sets
 * 7. Use generic types for reusable components
 *
 * ## Import Examples
 *
 * ```typescript
 * // Import specific types
 * import { Participant, Report, User } from '@/types';
 *
 * // Import enums
 * import { ParticipantStatus, ReportType } from '@/types';
 *
 * // Import type guards
 * import { isValidEmail, isValidNDISNumber } from '@/types';
 *
 * // Import utility types
 * import type { Optional, Nullable } from '@/types';
 * ```
 *
 * ## Adding New Types
 *
 * 1. Create a new file in src/types/ if it's a new domain
 * 2. Follow existing naming conventions
 * 3. Export from this index file
 * 4. Add JSDoc comments for all interfaces
 * 5. Create type guards if needed
 * 6. Update CLAUDE.md if adding new patterns
 */
