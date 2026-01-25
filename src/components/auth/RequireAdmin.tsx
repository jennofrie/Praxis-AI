"use client";

import { ReactNode } from "react";
import { useAdmin } from "@/components/providers/AdminContext";
import { Loader2, ShieldAlert } from "lucide-react";

interface RequireAdminProps {
  children: ReactNode;
  fallback?: ReactNode;
  showAccessDenied?: boolean;
}

/**
 * Wrapper component that only renders children if user is an admin.
 * Use for protecting admin-only UI sections or entire pages.
 *
 * @param children - Content to render if user is admin
 * @param fallback - Optional custom fallback to show non-admins (default: nothing)
 * @param showAccessDenied - If true, show access denied message instead of fallback
 */
export function RequireAdmin({
  children,
  fallback = null,
  showAccessDenied = false
}: RequireAdminProps) {
  const { isAdmin, isLoading } = useAdmin();

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
      </div>
    );
  }

  // User is admin - render children
  if (isAdmin) {
    return <>{children}</>;
  }

  // User is not admin - show access denied or fallback
  if (showAccessDenied) {
    return (
      <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-8">
        <div className="flex flex-col items-center text-center">
          <ShieldAlert className="w-12 h-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-300">
            Access Denied
          </h3>
          <p className="text-sm text-red-600 dark:text-red-400 mt-2 max-w-md">
            You don&apos;t have permission to access this area.
            Please contact an administrator if you believe this is an error.
          </p>
        </div>
      </div>
    );
  }

  // Return fallback (default: nothing)
  return <>{fallback}</>;
}

/**
 * Higher-order component for protecting entire page components.
 * Redirects non-admins to home page.
 *
 * Usage:
 * export default withAdminProtection(MyAdminPage);
 */
export function withAdminProtection<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  return function AdminProtectedComponent(props: P) {
    const { isAdmin, isLoading } = useAdmin();

    if (isLoading) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      );
    }

    if (!isAdmin) {
      return (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-8 max-w-md">
            <div className="flex flex-col items-center text-center">
              <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
              <h2 className="text-xl font-bold text-red-800 dark:text-red-300">
                Admin Access Required
              </h2>
              <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                This page is restricted to administrators only.
                Please contact your system administrator if you need access.
              </p>
              <a
                href="/"
                className="mt-6 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Return to Dashboard
              </a>
            </div>
          </div>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };
}
