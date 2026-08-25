"use client";

import { MetricsDashboard } from "@/features/reports/components/metrics-dashboard";
import { ProjectList, CreateProjectDialog } from "@/features/projects/components/project-list";
import { Can } from "@/components/common/can";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Project Health Metrics</h2>
        </div>
        <Can permission="reports.view" fallback={<p className="text-sm text-muted-foreground">You do not have permission to view reports.</p>}>
          <MetricsDashboard />
        </Can>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Projects</h2>
          <CreateProjectDialog />
        </div>
        <ProjectList />
      </section>
    </div>
  );
}
