import { apiClient } from "@/lib/api-client";
import type { Paginated } from "@/features/projects/types";
import type { UtilizationRow } from "./types";

export async function getUtilization(
  page = 1,
  limit = 50,
): Promise<Paginated<UtilizationRow>> {
  const res = await apiClient.get("/reports/utilization", {
    params: { page, limit },
  });
  return res.data.data as Paginated<UtilizationRow>;
}
