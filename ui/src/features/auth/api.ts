import { apiClient } from "@/lib/api-client";
import type { AuthResponse, PermissionCode, User } from "./types";

export async function login(
  email: string,
  password: string,
): Promise<AuthResponse> {
  const res = await apiClient.post("/auth/login", { email, password });
  return res.data.data as AuthResponse;
}

export async function fetchMe(): Promise<{
  user: User;
  permissions: PermissionCode[];
} | null> {
  try {
    const res = await apiClient.get("/auth/me");
    const data = res.data.data as User & { permissions: PermissionCode[] };
    const { permissions, ...user } = data;
    return { user: user as User, permissions };
  } catch {
    return null;
  }
}

export async function refreshTokens(refreshToken: string): Promise<{
  access_token: string;
  refresh_token: string;
}> {
  const res = await apiClient.post("/auth/refresh", { refreshToken });
  return res.data.data as { access_token: string; refresh_token: string };
}
