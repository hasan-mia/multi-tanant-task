"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getUtilization } from "@/features/reports/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type MetricKey = "completionRate" | "totalTasks" | "completedTasks" | "overdueTasks";

const METRICS: { key: MetricKey; label: string; color: string }[] = [
  { key: "completionRate", label: "Completion %", color: "#059669" },
  { key: "totalTasks", label: "Total Tasks", color: "#2563eb" },
  { key: "completedTasks", label: "Completed", color: "#16a34a" },
  { key: "overdueTasks", label: "Overdue", color: "#dc2626" },
];

export function MetricsDashboard() {
  const [metric, setMetric] = useState<MetricKey>("completionRate");
  const { data, isLoading } = useQuery({
    queryKey: ["utilization"],
    queryFn: () => getUtilization(1, 50),
  });

  const rows = data?.data ?? [];
  const active = METRICS.find((m) => m.key === metric)!;

  const summary = useMemo(() => {
    const rows = data?.data ?? [];
    const totalUsers = rows.length;
    const totalTasks = rows.reduce((a, r) => a + r.totalTasks, 0);
    const completed = rows.reduce((a, r) => a + r.completedTasks, 0);
    const overdue = rows.reduce((a, r) => a + r.overdueTasks, 0);
    const avgCompletion =
      totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;
    return { totalUsers, totalTasks, completed, overdue, avgCompletion };
  }, [data]);

  if (isLoading) {
    return <Skeleton className="h-72 w-full" />;
  }

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Members" value={summary.totalUsers} />
        <StatCard label="Total Tasks" value={summary.totalTasks} />
        <StatCard label="Completed" value={summary.completed} />
        <StatCard label="Overdue" value={summary.overdue} />
        <StatCard label="Avg Completion" value={`${summary.avgCompletion}%`} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
          <CardTitle>Team Utilization</CardTitle>
          <Select value={metric} onValueChange={(v) => setMetric((v as MetricKey) ?? "completionRate")}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {METRICS.map((m) => (
                <SelectItem key={m.key} value={m.key}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
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
                <Tooltip labelFormatter={(label) => `Member: ${label}`} />
                <Bar
                  dataKey={metric}
                  fill={active.color}
                  radius={[4, 4, 0, 0]}
                  name={active.label}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="mt-1 text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
