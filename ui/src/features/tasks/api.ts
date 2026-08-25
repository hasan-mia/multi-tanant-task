import { apiClient } from "@/lib/api-client";
import type { Paginated } from "@/features/projects/types";
import type { Assignee } from "@/features/users/types";
import type { Task, TaskQuery } from "./types";

export async function getProjectTasks(
  projectId: string,
  query: TaskQuery = {},
): Promise<Paginated<Task>> {
  const res = await apiClient.get(`/projects/${projectId}/tasks`, {
    params: query,
  });
  return res.data.data as Paginated<Task>;
}

export async function createTask(
  projectId: string,
  input: {
    title: string;
    priority?: string;
    status?: string;
    due_date?: string;
  },
): Promise<Task> {
  const res = await apiClient.post(
    `/projects/${projectId}/tasks`,
    input,
  );
  return res.data.data as Task;
}

export async function updateTaskStatus(
  taskId: string,
  status: string,
): Promise<Task> {
  const res = await apiClient.patch(`/tasks/${taskId}/status`, { status });
  return res.data.data as Task;
}

export const TASK_STATUS_TRANSITIONS: Record<string, string[]> = {
  TODO: ["IN_PROGRESS", "BLOCKED"],
  IN_PROGRESS: ["DONE", "BLOCKED"],
  BLOCKED: ["IN_PROGRESS"],
  DONE: [],
};

export async function assignTask(
  taskId: string,
  userId: string,
): Promise<unknown> {
  const res = await apiClient.post(`/tasks/${taskId}/assign`, { userId });
  return res.data.data;
}

export async function getAssignees(taskId: string): Promise<Assignee[]> {
  const res = await apiClient.get(`/tasks/${taskId}/assignees`);
  return (res.data.data as Assignee[]) ?? [];
}

export async function deleteTask(taskId: string): Promise<void> {
  await apiClient.delete(`/tasks/${taskId}`);
}

export async function unassignTask(
  taskId: string,
  userId: string,
): Promise<unknown> {
  const res = await apiClient.delete(`/tasks/${taskId}/assign/${userId}`);
  return res.data.data;
}

export async function getMyTasks(
  query: TaskQuery = {},
): Promise<Paginated<Task & { project?: { id: string; title: string } }>> {
  const res = await apiClient.get(`/tasks/assigned`, { params: query });
  return res.data.data;
}
