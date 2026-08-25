export type RoleCode = "ADMIN" | "MANAGER" | "MEMBER";

export type PermissionCode =
  | "users.view"
  | "users.create"
  | "users.update"
  | "users.delete"
  | "projects.view"
  | "projects.create"
  | "projects.update"
  | "projects.delete"
  | "projects.archive"
  | "tasks.view"
  | "tasks.create"
  | "tasks.update"
  | "tasks.delete"
  | "tasks.assign"
  | "tasks.update_status"
  | "reports.view";

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role_id: string;
  role: RoleCode | string | null;
  org_id: string;
  avatar?: string | null;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
  permissions: PermissionCode[];
}
