import { apiClient } from "@/lib/api-client";
import type { Paginated } from "@/features/projects/types";
import type { UserSummary } from "./types";

export async function getUsers(
  page = 1,
  limit = 50,
  search?: string,
): Promise<Paginated<UserSummary>> {
  const res = await apiClient.get("/users", {
    params: { page, limit, search: search || undefined },
  });
  return res.data.data as Paginated<UserSummary>;
}
