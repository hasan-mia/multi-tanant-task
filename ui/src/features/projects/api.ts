import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { Organization } from "@/features/organizations/types";
import type { Paginated, Project } from "./types";

export async function getProjects(
  page = 1,
  limit = 10,
  orgId?: string,
): Promise<Paginated<Project>> {
  const res = await apiClient.get("/projects", {
    params: { page, limit, orgId: orgId || undefined },
  });
  return res.data.data as Paginated<Project>;
}

export async function getProject(id: string, orgId?: string): Promise<Project> {
  const res = await apiClient.get(`/projects/${id}`, {
    params: { orgId: orgId || undefined },
  });
  return res.data.data as Project;
}

export async function createProject(input: {
  title: string;
  budget?: number;
  status?: string;
  org_id?: string;
}): Promise<Project> {
  const res = await apiClient.post("/projects", input);
  return res.data.data as Project;
}

export async function archiveProject(id: string): Promise<Project> {
  const res = await apiClient.post(`/projects/${id}/archive`);
  return res.data.data as Project;
}

export function useOrganizations() {
  return useQuery({
    queryKey: ["organizations", "options"],
    queryFn: async () => {
      const res = await apiClient.get("/organizations");
      return res.data.data as Organization[];
    },
  });
}
