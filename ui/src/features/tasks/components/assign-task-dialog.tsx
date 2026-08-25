"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { assignTask, unassignTask, getAssignees } from "@/features/tasks/api";
import { getUsers } from "@/features/users/api";
import { Can } from "@/components/common/can";
import { useDebounce } from "@/hooks/use-debounce";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { UserPlus, X } from "lucide-react";
import { toast } from "sonner";

function fullName(u: { first_name: string; last_name: string; email: string }) {
  const n = `${u.first_name} ${u.last_name}`.trim();
  return n || u.email;
}

export function AssignTaskDialog({
  taskId,
  projectId,
}: {
  taskId: string;
  projectId: string;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const { data: assignees, isLoading: loadingAssignees } = useQuery({
    queryKey: ["assignees", taskId],
    queryFn: () => getAssignees(taskId),
    enabled: open,
  });

  const { data: users, isLoading: loadingUsers } = useQuery({
    queryKey: ["users", debouncedSearch],
    queryFn: () => getUsers(1, 50, debouncedSearch || undefined),
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: (userId: string) => assignTask(taskId, userId),
    onSuccess: () => {
      toast.success("Task assigned");
      queryClient.invalidateQueries({ queryKey: ["assignees", taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    },
    onError: (e) => toast.error(e.message),
  });

  const unassignMutation = useMutation({
    mutationFn: (userId: string) => unassignTask(taskId, userId),
    onSuccess: () => {
      toast.success("Removed from task");
      queryClient.invalidateQueries({ queryKey: ["assignees", taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    },
    onError: (e) => toast.error(e.message),
  });

  const assigneeIds = new Set((assignees ?? []).map((a) => a.id));
  const candidateUsers = (users?.data ?? []).filter(
    (u) => !assigneeIds.has(u.id),
  );

  return (
    <Can permission="tasks.assign">
      <>
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          <UserPlus className="size-4" />
          Assign
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign task</DialogTitle>
              <DialogDescription>
                Add a member from your organization to this task.
              </DialogDescription>
            </DialogHeader>

            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Current assignees
              </p>
              {loadingAssignees ? (
                <Skeleton className="h-7 w-40" />
              ) : (assignees ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No one assigned yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(assignees ?? []).map((a) => (
                    <Badge
                      key={a.id}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {fullName(a)}
                      <Can permission="tasks.assign">
                        <button
                          type="button"
                          aria-label={`Remove ${fullName(a)}`}
                          disabled={unassignMutation.isPending}
                          onClick={() => unassignMutation.mutate(a.id)}
                          className="rounded-full hover:text-destructive"
                        >
                          <X className="size-3" />
                        </button>
                      </Can>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Input
                placeholder="Search members by name or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="max-h-56 space-y-1 overflow-y-auto rounded-lg border p-1">
                {loadingUsers ? (
                  <Skeleton className="h-9 w-full" />
                ) : candidateUsers.length === 0 ? (
                  <p className="p-2 text-sm text-muted-foreground">
                    No members found.
                  </p>
                ) : (
                  candidateUsers.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      disabled={mutation.isPending}
                      onClick={() => mutation.mutate(u.id)}
                      className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm hover:bg-muted"
                    >
                      <span>
                        {fullName(u)}
                        <span className="ml-1 text-xs text-muted-foreground">
                          {u.email}
                        </span>
                      </span>
                      <UserPlus className="size-4 text-muted-foreground" />
                    </button>
                  ))
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="ml-auto flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" /> Close
            </button>
          </DialogContent>
        </Dialog>
      </>
    </Can>
  );
}
