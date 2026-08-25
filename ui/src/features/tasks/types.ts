export type TaskStatus = "TODO" | "IN_PROGRESS" | "BLOCKED" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

export interface Task {
  id: string;
  project_id: string;
  title: string;
  priority: TaskPriority;
  status: TaskStatus;
  due_date?: string | null;
  created_at?: string;
}

export interface TaskQuery {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  search?: string;
  sortBy?: string;
  order?: "ASC" | "DESC";
}
