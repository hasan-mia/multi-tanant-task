"use client";

import { Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getProject, archiveProject } from "@/features/projects/api";
import { TaskDataTable } from "@/features/tasks/components/task-data-table";
import { CreateTaskDialog } from "@/features/tasks/components/create-task-dialog";
import { Can } from "@/components/common/can";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2 } from "lucide-react";
import { toast } from "sonner";

function ProjectDetailInner() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const projectId = params.id;
  const orgId = searchParams.get("orgId") ?? undefined;
  const queryClient = useQueryClient();

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", projectId, orgId],
    queryFn: () => getProject(projectId, orgId),
  });

  const archiveMutation = useMutation({
    mutationFn: () => archiveProject(projectId),
    onSuccess: () => {
      toast.success("Project archived");
      queryClient.invalidateQueries({
        queryKey: ["project", projectId, orgId],
      });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      router.push("/dashboard");
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (!project)
    return <p className="text-sm text-muted-foreground">Project not found.</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Projects
          </button>
          <h1 className="text-xl font-semibold">{project.title}</h1>
          <Badge variant="outline" className="capitalize">
            {project.status.toLowerCase()}
          </Badge>
          {project.organization && (
            <Badge variant="secondary" className="gap-1">
              <Building2 className="size-3.5" />
              {project.organization.name}
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Can permission="projects.archive">
            <Button
              variant="outline"
              disabled={project.status === "ARCHIVED" || archiveMutation.isPending}
              onClick={() => archiveMutation.mutate()}
            >
              {archiveMutation.isPending ? "Archiving…" : "Archive"}
            </Button>
          </Can>
          <CreateTaskDialog projectId={projectId} />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Tasks</h2>
        <Can permission="tasks.view" fallback={<p className="text-sm text-muted-foreground">You do not have permission to view tasks.</p>}>
          <TaskDataTable projectId={projectId} />
        </Can>
      </div>
    </div>
  );
}

export default function ProjectDetailPage() {
  return (
    <Suspense fallback={<Skeleton className="h-40 w-full" />}>
      <ProjectDetailInner />
    </Suspense>
  );
}
