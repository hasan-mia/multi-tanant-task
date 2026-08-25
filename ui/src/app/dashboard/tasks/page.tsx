"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyTasks, updateTaskStatus } from "@/features/tasks/api";
import { useDebounce } from "@/hooks/use-debounce";
import { useAuthStore } from "@/features/auth/store";
import { useHasPermission } from "@/components/common/can";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Can } from "@/components/common/can";
import { toast } from "sonner";

const STATUS_OPTIONS = ["TODO", "IN_PROGRESS", "BLOCKED", "DONE"];
const PRIORITY_OPTIONS = ["LOW", "MEDIUM", "HIGH"];

// Allowed status transitions, mirroring the backend rules: members progress
// linearly, managers/admins have the full set.
const MEMBER_TRANSITIONS: Record<string, string[]> = {
  TODO: ["IN_PROGRESS"],
  IN_PROGRESS: ["DONE"],
  BLOCKED: [],
  DONE: [],
};
const MANAGER_TRANSITIONS: Record<string, string[]> = {
  TODO: ["IN_PROGRESS", "BLOCKED"],
  IN_PROGRESS: ["DONE", "BLOCKED"],
  BLOCKED: ["IN_PROGRESS"],
  DONE: [],
};

const statusStyles: Record<string, string> = {
  TODO: "bg-slate-100 text-slate-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  BLOCKED: "bg-red-100 text-red-700",
  DONE: "bg-green-100 text-green-700",
};

const priorityStyles: Record<string, string> = {
  LOW: "bg-muted text-muted-foreground",
  MEDIUM: "bg-amber-100 text-amber-700",
  HIGH: "bg-orange-100 text-orange-700",
};

export default function MyTasksPage() {
  const queryClient = useQueryClient();
  const isMember = useAuthStore((s) => s.hasRole("MEMBER"));
  const canUpdate = useHasPermission()("tasks.update_status");

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

  const { data, isLoading } = useQuery({
    queryKey: [
      "my-tasks",
      page,
      limit,
      status,
      priority,
      debouncedSearch,
    ],
    queryFn: () =>
      getMyTasks({
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
      queryClient.invalidateQueries({ queryKey: ["my-tasks"] });
      toast.success("Task status updated");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const tasks = data?.data ?? [];
  const meta = data?.meta;

  const nextStatuses = (current: string) =>
    (isMember ? MEMBER_TRANSITIONS : MANAGER_TRANSITIONS)[current] ?? [];

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">My Tasks</h1>
        <p className="text-sm text-muted-foreground">
          Tasks assigned to you across all projects.
        </p>
      </div>

      <Can permission="tasks.view" fallback={<p className="text-sm text-muted-foreground">You do not have permission to view tasks.</p>}>
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Input
              placeholder="Live search by task title…"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="sm:max-w-xs"
            />
            <div className="flex gap-2">
              <select
                value={status}
                onChange={(e) => onStatusChange(e.target.value)}
                className="h-9 rounded-md border bg-background px-2 text-sm"
              >
                <option value="ALL">All statuses</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s.replace("_", " ")}
                  </option>
                ))}
              </select>
              <select
                value={priority}
                onChange={(e) => onPriorityChange(e.target.value)}
                className="h-9 rounded-md border bg-background px-2 text-sm"
              >
                <option value="ALL">All priorities</option>
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-4 py-2 font-medium">Project</th>
                  <th className="px-4 py-2 font-medium">Title</th>
                  <th className="px-4 py-2 font-medium">Priority</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Due date</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6">
                      <Skeleton className="h-6 w-full" />
                    </td>
                  </tr>
                ) : tasks.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-6 text-center text-muted-foreground"
                    >
                      No tasks assigned to you.
                    </td>
                  </tr>
                ) : (
                  tasks.map((task) => {
                    const options = nextStatuses(task.status);
                    return (
                      <tr key={task.id} className="border-t">
                        <td className="px-4 py-2 font-medium">
                          {task.project ? (
                            <Link
                              href={`/dashboard/projects/${task.project.id}`}
                              className="hover:underline"
                            >
                              {task.project.title}
                            </Link>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-4 py-2 font-medium">{task.title}</td>
                        <td className="px-4 py-2">
                          <Badge
                            className={cn(
                              "capitalize",
                              priorityStyles[task.priority] ?? "",
                            )}
                            variant="outline"
                          >
                            {task.priority.toLowerCase()}
                          </Badge>
                        </td>
                        <td className="px-4 py-2">
                          {canUpdate && options.length > 0 ? (
                            <select
                              value={task.status}
                              disabled={mutation.isPending}
                              onChange={(e) =>
                                mutation.mutate({
                                  id: task.id,
                                  status: e.target.value,
                                })
                              }
                              className="h-8 rounded-md border bg-background px-2 text-sm capitalize"
                            >
                              <option value={task.status}>
                                {task.status.replace("_", " ").toLowerCase()}
                              </option>
                              {options.map((s) => (
                                <option key={s} value={s}>
                                  {s.replace("_", " ").toLowerCase()}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <Badge
                              className={cn(
                                "capitalize",
                                statusStyles[task.status] ?? "",
                              )}
                              variant="outline"
                            >
                              {task.status.replace("_", " ").toLowerCase()}
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">
                          {task.due_date
                            ? new Date(task.due_date).toLocaleDateString()
                            : "—"}
                        </td>
                      </tr>
                    );
                  })
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
              <button
                type="button"
                className="rounded-md border px-3 py-1 disabled:opacity-50"
                disabled={!meta || meta.page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <button
                type="button"
                className="rounded-md border px-3 py-1 disabled:opacity-50"
                disabled={!meta || meta.page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </Can>
    </div>
  );
}
