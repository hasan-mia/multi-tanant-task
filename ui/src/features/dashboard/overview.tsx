"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getUtilization } from "@/features/reports/api";
import { getProjects } from "@/features/projects/api";
import { useAuthStore } from "@/features/auth/store";

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "#60A5FA",
  DRAFT: "#FBBF24",
  ARCHIVED: "#94A3B8",
};

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  );
}

export function OverviewDashboard() {
  const hasReports = useAuthStore((s) => s.hasPermission("reports.view"));
  const hasProjects = useAuthStore((s) => s.hasPermission("projects.view"));

  const utilization = useQuery({
    queryKey: ["utilization"],
    queryFn: () => getUtilization(1, 50),
    enabled: hasReports,
  });

  const projectsQuery = useQuery({
    queryKey: ["projects", "dashboard"],
    queryFn: () => getProjects(1, 50),
    enabled: hasProjects,
  });

  const rows = utilization.data?.data ?? [];
  const summary = utilization.data?.summary;
  const projects = projectsQuery.data?.data ?? [];

  const totalTasks =
    summary?.totalTasks ?? rows.reduce((a, r) => a + r.totalTasks, 0);
  const completed =
    summary?.completedTasks ?? rows.reduce((a, r) => a + r.completedTasks, 0);
  const overdue =
    summary?.overdueTasks ?? rows.reduce((a, r) => a + r.overdueTasks, 0);
  const avgCompletion =
    totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;

  const statusCounts = { ACTIVE: 0, DRAFT: 0, ARCHIVED: 0 };
  projects.forEach((p) => {
    statusCounts[p.status] = (statusCounts[p.status] ?? 0) + 1;
  });
  const statusData = (["ACTIVE", "DRAFT", "ARCHIVED"] as const).map((s) => ({
    name: s.charAt(0) + s.slice(1).toLowerCase(),
    value: statusCounts[s],
    color: STATUS_COLORS[s],
  }));

  const loading = (hasReports && utilization.isLoading) || (hasProjects && projectsQuery.isLoading);

  if (loading) return <Skeleton className="h-72 w-full" />;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Overview Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Live metrics pulled from your workspace.
        </p>
      </div>

      {/* KPI cards (dynamic) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Members" value={rows.length} />
        <StatCard label="Total Tasks" value={totalTasks.toLocaleString()} />
        <StatCard label="Completed" value={completed.toLocaleString()} />
        <StatCard label="Overdue" value={overdue.toLocaleString()} />
        <StatCard label="Avg Completion" value={`${avgCompletion}%`} />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Team Utilization</CardTitle>
            <CardDescription>Tasks handled per member</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={rows}
                  margin={{ top: 8, right: 8, left: 0, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid hsl(var(--border))",
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="totalTasks" fill="#60A5FA" radius={[4, 4, 0, 0]} name="Tasks" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Project Status</CardTitle>
            <CardDescription>Distribution across statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <div className="h-48 w-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {statusData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: 8,
                        border: "1px solid hsl(var(--border))",
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="space-y-2 text-sm">
                {statusData.map((s) => (
                  <li key={s.name} className="flex items-center gap-2">
                    <span
                      className="size-3 rounded-sm"
                      style={{ backgroundColor: s.color }}
                    />
                    <span className="text-muted-foreground">{s.name}</span>
                    <span className="ml-auto font-medium">{s.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tables */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Projects</CardTitle>
            <CardDescription>Latest workspaces</CardDescription>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <p className="text-sm text-muted-foreground">No projects yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.slice(0, 5).map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.title}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {p.organization?.name ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {p.status.toLowerCase()}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Team Utilization</CardTitle>
            <CardDescription>Per-member task breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            {rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data available.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Tasks</TableHead>
                    <TableHead>Done</TableHead>
                    <TableHead>Overdue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.userId}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell>{r.totalTasks}</TableCell>
                      <TableCell>{r.completedTasks}</TableCell>
                      <TableCell
                        className={
                          r.overdueTasks > 0 ? "text-red-500" : undefined
                        }
                      >
                        {r.overdueTasks}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
