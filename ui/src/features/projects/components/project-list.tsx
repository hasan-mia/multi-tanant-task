"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createProject, getProjects, useOrganizations } from "@/features/projects/api";
import { Can } from "@/components/common/can";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, FolderKanban } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useAuthStore } from "@/features/auth/store";

const STATUS_OPTIONS = ["DRAFT", "ACTIVE", "ARCHIVED"];

const STATUS_BADGE: Record<
  string,
  "success" | "warning" | "outline"
> = {
  active: "success",
  draft: "warning",
  archived: "outline",
};

export function CreateProjectDialog() {
  const queryClient = useQueryClient();
  const userOrgId = useAuthStore((s) => s.user?.org_id);
  const { data: orgs } = useOrganizations();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [budget, setBudget] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [orgId, setOrgId] = useState<string | undefined>(userOrgId);

  const mutation = useMutation({
    mutationFn: () =>
      createProject({
        title,
        budget: budget ? Number(budget) : 0,
        status,
        org_id: orgId,
      }),
    onSuccess: () => {
      toast.success("Project created");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setOpen(false);
      setTitle("");
      setBudget("");
      setStatus("DRAFT");
      setOrgId(userOrgId);
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Can permission="projects.create">
      <>
        <Button onClick={() => setOpen(true)}>New Project</Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Project</DialogTitle>
            <DialogDescription>
              Add a new project to an organization.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Website redesign"
              />
            </div>
            <div className="grid gap-2">
              <Label>Organization</Label>
              <Select
                value={orgId ?? "none"}
                onValueChange={(v) =>
                  setOrgId(v === "none" || v == null ? undefined : v)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select organization">
                    {(value) =>
                      value === "none"
                        ? "Select organization"
                        : (orgs?.find((o) => o.id === value)?.name ?? "")
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {orgs?.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="budget">Budget</Label>
              <Input
                id="budget"
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v ?? "DRAFT")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => mutation.mutate()}
              disabled={!title || mutation.isPending}
            >
              {mutation.isPending ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    </Can>
  );
}

export function ProjectList() {
  const userRole = useAuthStore((s) => s.user?.role);
  const isAdmin = userRole === "ADMIN";
  const { data: orgs } = useOrganizations();
  const [filterOrgId, setFilterOrgId] = useState<string | undefined>(undefined);

  const { data, isLoading } = useQuery({
    queryKey: ["projects", filterOrgId ?? "all"],
    queryFn: () => getProjects(1, 50, filterOrgId ?? "all"),
  });

  if (isLoading) return <Skeleton className="h-40 w-full" />;

  const projects = data?.data ?? [];

  return (
    <div className="space-y-3">
      {isAdmin && orgs && orgs.length > 0 && (
        <div className="flex items-center gap-2">
          <Label className="text-sm text-muted-foreground">Organization</Label>
          <Select
            value={filterOrgId ?? "all"}
            onValueChange={(v) =>
              setFilterOrgId(v === "all" || v == null ? undefined : v)
            }
          >
              <SelectTrigger className="w-56">
                  <SelectValue placeholder="All organizations">
                    {(value) =>
                      value === "all"
                        ? "All organizations"
                        : (orgs?.find((o) => o.id === value)?.name ?? "")
                    }
                  </SelectValue>
                </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All organizations</SelectItem>
              {orgs.map((org) => (
                <SelectItem key={org.id} value={org.id}>
                  {org.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {projects.length === 0 && (
          <p className="col-span-full text-sm text-muted-foreground">
            No projects yet.
          </p>
        )}
        {projects.map((project) => (
          <Link
            key={project.id}
            href={`/dashboard/projects/${project.id}?orgId=${filterOrgId ?? "all"}`}
            className="group block overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
          >
            <div className="flex items-center justify-between gap-2 border-b bg-muted/30 p-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FolderKanban className="size-4" />
                </span>
                <h3 className="truncate font-semibold leading-tight">
                  {project.title}
                </h3>
              </div>
              <Badge
                variant={STATUS_BADGE[project.status.toLowerCase()] ?? "outline"}
                className="capitalize"
              >
                {project.status.toLowerCase()}
              </Badge>
            </div>
            <div className="space-y-3 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Budget</span>
                <span className="font-medium">
                  ${Number(project.budget ?? 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="flex min-w-0 items-center gap-1 text-muted-foreground">
                  <Building2 className="size-3.5 shrink-0" />
                  <span className="truncate">
                    {project.organization?.name ?? "No organization"}
                  </span>
                </span>
                {project.created_at && (
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {new Date(project.created_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
