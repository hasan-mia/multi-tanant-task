import { isAxiosError } from "axios";
import type { AxiosError } from "axios";

function messageFromPayload(payload: unknown): string | null {
  if (!payload) return null;
  if (typeof payload === "string" && payload.trim()) return payload;
  if (typeof payload !== "object") return null;

  const record = payload as Record<string, unknown>;
  for (const key of ["message", "error", "detail", "title"]) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return null;
}

/** Extract a user-facing message from axios / unknown errors. */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    const fromBody = messageFromPayload((error as AxiosError).response?.data);
    if (fromBody) return fromBody;
    if (error.message) return error.message;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
