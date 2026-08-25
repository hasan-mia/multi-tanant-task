import { apiClient } from "@/lib/api-client";
import type {
  CreateOrganizationInput,
  Organization,
  UpdateOrganizationInput,
} from "./types";

export async function getOrganizations(): Promise<Organization[]> {
  const res = await apiClient.get("/organizations");
  return res.data.data as Organization[];
}

export async function getOrganization(id: string): Promise<Organization> {
  const res = await apiClient.get(`/organizations/${id}`);
  return res.data.data as Organization;
}

export async function createOrganization(
  input: CreateOrganizationInput,
): Promise<Organization> {
  const res = await apiClient.post("/organizations", input);
  return res.data.data as Organization;
}

export async function updateOrganization(
  id: string,
  input: UpdateOrganizationInput,
): Promise<Organization> {
  const res = await apiClient.put(`/organizations/${id}`, input);
  return res.data.data as Organization;
}

export async function deleteOrganization(id: string): Promise<{ id: string }> {
  const res = await apiClient.delete(`/organizations/${id}`);
  return res.data.data as { id: string };
}
