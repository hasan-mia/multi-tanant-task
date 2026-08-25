export type ProjectStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

export interface OrganizationRef {
  id: string;
  name: string;
}

export interface Project {
  id: string;
  title: string;
  budget: number;
  status: ProjectStatus;
  org_id?: string;
  organization?: OrganizationRef | null;
  created_at?: string;
  updated_at?: string;
}

export interface Paginated<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
