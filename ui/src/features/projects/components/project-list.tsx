"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createProject, getProjects } from "@/features/projects/api";
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
import { toast } from "sonner";

const STATUS_OPTIONS = ["DRAFT", "ACTIVE", "ARCHIVED"];

export function CreateProjectDialog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [budget, setBudget] = useState("");
  const [status, setStatus] = useState("DRAFT");

  const mutation = useMutation({
    mutationFn: () =>
      createProject({
        title,
        budget: budget ? Number(budget) : 0,
        status,
      }),
    onSuccess: () => {
      toast.success("Project created");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setOpen(false);
      setTitle("");
      setBudget("");
      setStatus("DRAFT");
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
              Add a new project to your organization.
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
  const { data, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => getProjects(1, 50),
  });

  if (isLoading) return <Skeleton className="h-40 w-full" />;

  const projects = data?.data ?? [];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {projects.length === 0 && (
        <p className="col-span-full text-sm text-muted-foreground">
          No projects yet.
        </p>
      )}
      {projects.map((project) => (
        <a
          key={project.id}
          href={`/dashboard/projects/${project.id}`}
          className="block rounded-lg border bg-card p-4 transition-colors hover:border-primary"
        >
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium">{project.title}</h3>
            <Badge variant="outline" className="capitalize">
              {project.status.toLowerCase()}
            </Badge>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Budget: ${Number(project.budget ?? 0).toLocaleString()}
          </p>
        </a>
      ))}
    </div>
  );
}
