"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { OverviewDashboard } from "@/features/dashboard/overview";
import { useAuthStore } from "@/features/auth/store";

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hasProjectView = useAuthStore((s) => s.hasPermission("projects.view"));

  useEffect(() => {
    // Only redirect authenticated members (tasks-only) away from the
    // overview. Unauthenticated users are handled by the layout guard,
    // which sends them to /login.
    if (user && !hasProjectView) router.replace("/dashboard/tasks");
  }, [user, hasProjectView, router]);

  if (!user || !hasProjectView) return null;

  return <OverviewDashboard />;
}
