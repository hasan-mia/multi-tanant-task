export type ProjectStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

export interface Project {
  id: string;
  title: string;
  budget: number;
  status: ProjectStatus;
  org_id?: string;
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
