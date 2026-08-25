import { apiClient } from "@/lib/api-client";
import type { Paginated, Project } from "./types";

export async function getProjects(
  page = 1,
  limit = 10,
): Promise<Paginated<Project>> {
  const res = await apiClient.get("/projects", { params: { page, limit } });
  return res.data.data as Paginated<Project>;
}

export async function getProject(id: string): Promise<Project> {
  const res = await apiClient.get(`/projects/${id}`);
  return res.data.data as Project;
}

export async function createProject(input: {
  title: string;
  budget?: number;
  status?: string;
}): Promise<Project> {
  const res = await apiClient.post("/projects", input);
  return res.data.data as Project;
}

export async function archiveProject(id: string): Promise<Project> {
  const res = await apiClient.post(`/projects/${id}/archive`);
  return res.data.data as Project;
}
