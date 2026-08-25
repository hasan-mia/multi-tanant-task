export interface UserSummary {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role?: string | null;
  avatar?: string | null;
}

export interface Assignee {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar?: string | null;
  role_id?: string | null;
  assigned_at?: string;
}
