"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getProjectTasks,
  updateTaskStatus,
  deleteTask,
  TASK_STATUS_TRANSITIONS,
} from "@/features/tasks/api";
import type { Task, TaskPriority, TaskStatus } from "@/features/tasks/types";
import type { Assignee } from "@/features/users/types";
import { Can, useHasPermission } from "@/components/common/can";
import { useDebounce } from "@/hooks/use-debounce";
import { AssignTaskDialog } from "@/features/tasks/components/assign-task-dialog";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

const STATUS_OPTIONS: TaskStatus[] = [
  "TODO",
  "IN_PROGRESS",
  "BLOCKED",
  "DONE",
];
const PRIORITY_OPTIONS: TaskPriority[] = ["LOW", "MEDIUM", "HIGH"];

const statusStyles: Record<TaskStatus, string> = {
  TODO: "bg-slate-100 text-slate-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  BLOCKED: "bg-red-100 text-red-700",
  DONE: "bg-green-100 text-green-700",
};

const priorityStyles: Record<TaskPriority, string> = {
  LOW: "bg-muted text-muted-foreground",
  MEDIUM: "bg-amber-100 text-amber-700",
  HIGH: "bg-orange-100 text-orange-700",
};

function assigneeName(a: Assignee) {
  const n = `${a.first_name ?? ""} ${a.last_name ?? ""}`.trim();
  return n || a.email;
}

export function TaskDataTable({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();
  const hasUpdateStatus = useHasPermission()("tasks.update_status");

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [status, setStatus] = useState("ALL");
  const [priority, setPriority] = useState("ALL");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  const onSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };
  const onStatusChange = (value: string) => {
    setStatus(value);
    setPage(1);
  };
  const onPriorityChange = (value: string) => {
    setPriority(value);
    setPage(1);
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: [
      "tasks",
      projectId,
      page,
      limit,
      status,
      priority,
      debouncedSearch,
    ],
    queryFn: () =>
      getProjectTasks(projectId, {
        page,
        limit,
        status: status === "ALL" ? undefined : status,
        priority: priority === "ALL" ? undefined : priority,
        search: debouncedSearch || undefined,
        sortBy: "created_at",
        order: "DESC",
      }),
  });

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateTaskStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      toast.success("Task status updated");
    },
    onError: (e) => toast.error(e.message),
  });

  const tasks = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Live search by task title…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="sm:max-w-xs"
        />
        <div className="flex gap-2">
          <Select value={status} onValueChange={(v) => onStatusChange(v ?? "ALL")}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s.replace("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={priority} onValueChange={(v) => onPriorityChange(v ?? "ALL")}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All priorities</SelectItem>
              {PRIORITY_OPTIONS.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-2 font-medium">Title</th>
              <th className="px-4 py-2 font-medium">Priority</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Assignees</th>
              <th className="px-4 py-2 font-medium">Due date</th>
              <th className="px-4 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6">
                  <Skeleton className="h-6 w-full" />
                </td>
              </tr>
            ) : tasks.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-6 text-center text-muted-foreground"
                >
                  No tasks found.
                </td>
              </tr>
            ) : (
              tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  projectId={projectId}
                  canUpdate={hasUpdateStatus}
                  onUpdate={(status) =>
                    mutation.mutate({ id: task.id, status })
                  }
                  updating={mutation.isPending}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {meta
            ? `Page ${meta.page} of ${meta.totalPages} · ${meta.total} tasks`
            : "—"}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!meta || meta.page <= 1 || isFetching}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!meta || meta.page >= meta.totalPages || isFetching}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

function TaskRow({
  task,
  projectId,
  canUpdate,
  onUpdate,
  updating,
}: {
  task: Task;
  projectId: string;
  canUpdate: boolean;
  onUpdate: (status: string) => void;
  updating: boolean;
}) {
  const queryClient = useQueryClient();
  const deleteMutation = useMutation({
    mutationFn: () => deleteTask(task.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      toast.success("Task deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  const nextStatuses = TASK_STATUS_TRANSITIONS[task.status] ?? [];
  const showUpdate = canUpdate && nextStatuses.length > 0;

  return (
    <tr className="border-t">
      <td className="px-4 py-2 font-medium">{task.title}</td>
      <td className="px-4 py-2">
        <Badge
          className={cn("capitalize", priorityStyles[task.priority])}
          variant="outline"
        >
          {task.priority.toLowerCase()}
        </Badge>
      </td>
      <td className="px-4 py-2">
        <Badge
          className={cn("capitalize", statusStyles[task.status])}
          variant="outline"
        >
          {task.status.replace("_", " ").toLowerCase()}
        </Badge>
      </td>
      <td className="px-4 py-2">
        {task.assignees && task.assignees.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {task.assignees.map((a) => (
              <Badge key={a.id} variant="secondary">
                {assigneeName(a)}
              </Badge>
            ))}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Unassigned</span>
        )}
      </td>
      <td className="px-4 py-2 text-muted-foreground">
        {task.due_date
          ? new Date(task.due_date).toLocaleDateString()
          : "—"}
      </td>
      <td className="px-4 py-2">
        <div className="flex flex-wrap items-center gap-2">
          <Can permission="tasks.update_status">
            {showUpdate ? (
              <Select
                disabled={updating}
                onValueChange={(value) => value ? onUpdate(value as string) : undefined}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Move to…" />
                </SelectTrigger>
                <SelectContent>
                  {nextStatuses.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <span className="text-xs text-muted-foreground">
                No transition
              </span>
            )}
          </Can>
          <AssignTaskDialog taskId={task.id} projectId={projectId} />
          <Can permission="tasks.delete">
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
            >
              <Trash2 className="size-4" />
            </Button>
          </Can>
        </div>
      </td>
    </tr>
  );
}
