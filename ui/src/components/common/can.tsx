"use client";

import type { ReactNode } from "react";
import { useAuthStore } from "@/features/auth/store";
import type { PermissionCode } from "@/features/auth/types";

interface CanProps {
  permission?: PermissionCode;
  role?: string;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Role-Aware UI guard. Renders `children` only when the authenticated user
 * holds the required permission (or role). Otherwise renders `fallback`.
 *
 * Authorization is resolved from the permission set returned by the API at
 * login (`req.user.role_id → role_permissions → permissions.code`), exactly
 * like the backend — there is no hardcoded ADMIN/MANAGER bypass on the client.
 */
export function Can({ permission, role, children, fallback = null }: CanProps) {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const userRole = useAuthStore((s) => s.user?.role);

  const allowed = permission
    ? hasPermission(permission)
    : role
      ? userRole === role
      : true;

  return <>{allowed ? children : fallback}</>;
}

export function useHasPermission() {
  return useAuthStore((s) => s.hasPermission);
}
