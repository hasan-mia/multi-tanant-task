import { apiClient } from "@/lib/api-client";
import type { UtilizationResponse } from "./types";

export async function getUtilization(
  page = 1,
  limit = 50,
): Promise<UtilizationResponse> {
  const res = await apiClient.get("/reports/utilization", {
    params: { page, limit },
  });
  return res.data.data as UtilizationResponse;
}
