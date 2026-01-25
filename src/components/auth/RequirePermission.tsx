"use client";

import { ReactNode } from "react";
import { useAdmin } from "@/components/providers/AdminContext";
import { Permission } from "@/config/admin";
import { Loader2, Lock } from "lucide-react";

interface RequirePermissionProps {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
  showLocked?: boolean;
}

/**
 * Wrapper component that only renders children if user has the specified permission.
 * Use for fine-grained access control beyond admin/non-admin.
 *
 * @param permission - The permission required to view this content
 * @param children - Content to render if user has permission
 * @param fallback - Optional custom fallback for users without permission
 * @param showLocked - If true, show a locked indicator instead of fallback
 */
export function RequirePermission({
  permission,
  children,
  fallback = null,
  showLocked = false
}: RequirePermissionProps) {
  const { hasPermission, isLoading } = useAdmin();

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
      </div>
    );
  }

  // User has permission - render children
  if (hasPermission(permission)) {
    return <>{children}</>;
  }

  // User doesn't have permission - show locked or fallback
  if (showLocked) {
    return (
      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <Lock className="w-4 h-4" />
          <span className="text-sm">This feature requires additional permissions</span>
        </div>
      </div>
    );
  }

  return <>{fallback}</>;
}

/**
 * Hook to conditionally render based on permission
 * Useful when you need to check permission without wrapping in a component
 *
 * Usage:
 * const canEdit = usePermissionCheck('canEditPrompts');
 * if (canEdit) { ... }
 */
export function usePermissionCheck(permission: Permission): {
  hasAccess: boolean;
  isLoading: boolean;
} {
  const { hasPermission, isLoading } = useAdmin();
  return {
    hasAccess: hasPermission(permission),
    isLoading,
  };
}
