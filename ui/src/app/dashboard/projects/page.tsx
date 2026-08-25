"use client";

import { ProjectList, CreateProjectDialog } from "@/features/projects/components/project-list";

export default function ProjectsPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
        <p className="text-sm text-muted-foreground">
          Browse and manage all workspaces in your organization.
        </p>
      </div>
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">All Projects</h2>
          <CreateProjectDialog />
        </div>
        <ProjectList />
      </section>
    </div>
  );
}
