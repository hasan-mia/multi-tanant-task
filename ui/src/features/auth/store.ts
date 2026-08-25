import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PermissionCode, RoleCode, User } from "./types";

interface SessionInput {
  user: User;
  permissions: PermissionCode[];
  accessToken: string;
  refreshToken: string;
}

interface AuthState {
  user: User | null;
  permissions: PermissionCode[];
  accessToken: string | null;
  refreshToken: string | null;
  isHydrated: boolean;
  setSession: (session: SessionInput) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: User, permissions: PermissionCode[]) => void;
  logout: () => void;
  hasPermission: (code: PermissionCode) => boolean;
  hasRole: (role: RoleCode | string) => boolean;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      permissions: [],
      accessToken: null,
      refreshToken: null,
      isHydrated: false,
      setSession: (session) =>
        set({
          user: session.user,
          permissions: session.permissions,
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
        }),
      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),
      setUser: (user, permissions) => set({ user, permissions }),
      logout: () =>
        set({
          user: null,
          permissions: [],
          accessToken: null,
          refreshToken: null,
        }),
      hasPermission: (code) => get().permissions.includes(code),
      hasRole: (role) => get().user?.role === role,
      setHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: "pm-auth",
      partialize: (state) => ({
        user: state.user,
        permissions: state.permissions,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);
