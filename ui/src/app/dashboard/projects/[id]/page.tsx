"use client";

import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getProject, archiveProject } from "@/features/projects/api";
import { TaskDataTable } from "@/features/tasks/components/task-data-table";
import { CreateTaskDialog } from "@/features/tasks/components/create-task-dialog";
import { Can } from "@/components/common/can";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const queryClient = useQueryClient();

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => getProject(projectId),
  });

  const archiveMutation = useMutation({
    mutationFn: () => archiveProject(projectId),
    onSuccess: () => {
      toast.success("Project archived");
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      router.push("/dashboard");
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (!project) return <p className="text-sm text-muted-foreground">Project not found.</p>;

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
