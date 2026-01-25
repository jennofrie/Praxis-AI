/**
 * Common utility types used across the Praxis AI Platform
 */

import { LucideIcon } from 'lucide-react';

/**
 * Base entity with common fields
 */
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Soft-deletable entity
 */
export interface SoftDeletable {
  deletedAt: Date | null;
  isDeleted: boolean;
}

/**
 * Auditable entity
 */
export interface Auditable {
  createdBy: string;
  updatedBy: string;
}

/**
 * Complete base entity with all common fields
 */
export interface Entity extends BaseEntity, SoftDeletable, Auditable {}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

/**
 * Filter parameters
 */
export interface FilterParams {
  search?: string;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
  [key: string]: unknown;
}

/**
 * API Response wrapper
 */
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: APIError;
  message?: string;
}

/**
 * API Error structure
 */
export interface APIError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: Date;
}

/**
 * Validation Error
 */
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

/**
 * File upload
 */
export interface FileUpload {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: Date;
  uploadedBy: string;
}

/**
 * Address structure
 */
export interface Address {
  street: string;
  suburb: string;
  state: string;
  postcode: string;
  country: string;
}

/**
 * Contact information
 */
export interface ContactInfo {
  email: string;
  phone: string;
  mobile?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
}

/**
 * Metric card data
 */
export interface MetricCard {
  label: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: LucideIcon;
}

/**
 * Chart data point
 */
export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

/**
 * Time period
 */
export interface TimePeriod {
  startDate: Date;
  endDate: Date;
}

/**
 * Progress indicator
 */
export interface Progress {
  current: number;
  total: number;
  percentage: number;
}

/**
 * Status badge
 */
export interface StatusBadge {
  label: string;
  variant: 'success' | 'warning' | 'error' | 'info' | 'neutral';
}

/**
 * Action button
 */
export interface ActionButton {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'destructive';
  disabled?: boolean;
}

/**
 * Tab item
 */
export interface TabItem {
  id: string;
  label: string;
  count?: number;
  badge?: string;
}

/**
 * Notification
 */
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: Date;
  actionUrl?: string;
}

/**
 * Search result
 */
export interface SearchResult<T> {
  item: T;
  score: number;
  highlights?: string[];
}

/**
 * Dropdown option
 */
export interface DropdownOption<T = string> {
  label: string;
  value: T;
  disabled?: boolean;
  icon?: LucideIcon;
}

/**
 * Form field configuration
 */
export interface FormField<T = unknown> {
  name: string;
  label: string;
  type: 'text' | 'email' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox';
  required?: boolean;
  placeholder?: string;
  defaultValue?: T;
  validation?: ValidationRule[];
  options?: DropdownOption[];
}

/**
 * Validation rule
 */
export interface ValidationRule {
  type: 'required' | 'email' | 'min' | 'max' | 'pattern' | 'custom';
  value?: unknown;
  message: string;
}

/**
 * Activity log entry
 */
export interface ActivityLog {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  action: string;
  description: string;
  metadata?: Record<string, unknown>;
}

/**
 * System status
 */
export interface SystemStatus {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  message?: string;
  lastChecked: Date;
}

/**
 * Storage info
 */
export interface StorageInfo {
  used: number;
  total: number;
  percentage: number;
  unit: 'GB' | 'MB' | 'KB';
}

/**
 * ID type (UUID or custom)
 */
export type ID = string;

/**
 * Timestamp
 */
export type Timestamp = Date | string;

/**
 * Optional fields helper
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Make specific fields required helper
 */
export type RequiredFields<T, K extends keyof T> = Omit<T, K> & globalThis.Required<Pick<T, K>>;

/**
 * Nullable helper
 */
export type Nullable<T> = T | null;

/**
 * Array or single item
 */
export type MaybeArray<T> = T | T[];
