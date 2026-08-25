import axios from "axios";
import { useAuthStore } from "@/features/auth/store";
import { getApiErrorMessage } from "@/lib/api-error";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export const apiClient = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: { "Content-Type": "application/json" },
  withCredentials: false,
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

async function doRefresh(refreshToken: string) {
  const res = await axios.post(
    `${BASE_URL}/api/auth/refresh`,
    { refreshToken },
    { headers: { "Content-Type": "application/json" } },
  );
  const payload = res.data.data as {
    access_token: string;
    refresh_token: string;
  };
  useAuthStore.getState().setTokens(payload.access_token, payload.refresh_token);
  return payload;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const original = error.config as
      | (typeof error.config & { _retry?: boolean })
      | undefined;
    const url = original?.url ?? "";

    if (
      status === 401 &&
      original &&
      !original._retry &&
      !url.includes("/auth/")
    ) {
      original._retry = true;
      const { refreshToken } = useAuthStore.getState();
      if (refreshToken) {
        try {
          const refreshed = await doRefresh(refreshToken);
          original.headers.Authorization = `Bearer ${refreshed.access_token}`;
          return apiClient(original);
        } catch {
          useAuthStore.getState().logout();
          return Promise.reject(new Error("Session expired. Please sign in."));
        }
      }
    }

    if (status === 401) {
      useAuthStore.getState().logout();
    }

    return Promise.reject(
      new Error(getApiErrorMessage(error, "Something went wrong")),
    );
  },
);
