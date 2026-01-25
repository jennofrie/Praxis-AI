"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { UserRole } from "@/types/enums";
import { getUserRole, hasPermission, Permission, ROLE_PERMISSIONS } from "@/config/admin";

type RolePermissions = {
  canAccessSettings: boolean;
  canManageUsers: boolean;
  canEditPrompts: boolean;
  canChangeAIProvider: boolean;
  canViewSystemStatus: boolean;
  canManageIntegrations: boolean;
  canViewAllParticipants: boolean;
  canExportData: boolean;
  canDeleteData: boolean;
};

interface AdminContextType {
  user: User | null;
  userRole: UserRole;
  isAdmin: boolean;
  isLoading: boolean;
  permissions: RolePermissions;
  hasPermission: (permission: Permission) => boolean;
  refreshUser: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

// Default permissions (no access)
const defaultPermissions: RolePermissions = {
  canAccessSettings: false,
  canManageUsers: false,
  canEditPrompts: false,
  canChangeAIProvider: false,
  canViewSystemStatus: false,
  canManageIntegrations: false,
  canViewAllParticipants: false,
  canExportData: false,
  canDeleteData: false,
};

export function AdminProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(UserRole.VIEWER);
  const [isLoading, setIsLoading] = useState(true);
  const [permissions, setPermissions] = useState(defaultPermissions);

  const supabase = createClient();

  const refreshUser = useCallback(async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      if (currentUser?.email) {
        const role = getUserRole(currentUser.email);
        setUserRole(role);
        setPermissions({ ...ROLE_PERMISSIONS[role] });
      } else {
        setUserRole(UserRole.VIEWER);
        setPermissions(defaultPermissions);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      setUser(null);
      setUserRole(UserRole.VIEWER);
      setPermissions(defaultPermissions);
    } finally {
      setIsLoading(false);
    }
  }, [supabase.auth]);

  useEffect(() => {
    refreshUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          setUser(session.user);
          const role = getUserRole(session.user.email);
          setUserRole(role);
          setPermissions({ ...ROLE_PERMISSIONS[role] });
        } else {
          setUser(null);
          setUserRole(UserRole.VIEWER);
          setPermissions(defaultPermissions);
        }
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshUser, supabase.auth]);

  const checkPermission = useCallback(
    (permission: Permission): boolean => {
      return hasPermission(userRole, permission);
    },
    [userRole]
  );

  const isAdmin = userRole === UserRole.ADMIN;

  return (
    <AdminContext.Provider
      value={{
        user,
        userRole,
        isAdmin,
        isLoading,
        permissions,
        hasPermission: checkPermission,
        refreshUser,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
}

/**
 * Hook to check if the current user is an admin
 */
export function useIsAdmin(): { isAdmin: boolean; isLoading: boolean } {
  const { isAdmin, isLoading } = useAdmin();
  return { isAdmin, isLoading };
}

/**
 * Hook to check if the current user has a specific permission
 */
export function useHasPermission(permission: Permission): { hasAccess: boolean; isLoading: boolean } {
  const { hasPermission, isLoading } = useAdmin();
  return { hasAccess: hasPermission(permission), isLoading };
}
