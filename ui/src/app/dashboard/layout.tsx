"use client";

import { useState } from "react";
import { AuthGuard } from "@/components/auth/auth-guard";
import {
  DashboardSidebar,
  MobileSidebar,
} from "@/components/layout/dashboard-sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-muted/30">
        <DashboardSidebar />
        <MobileSidebar open={mobileOpen} onOpenChange={setMobileOpen} />
        <div className="flex min-w-0 flex-1 flex-col">
          <DashboardHeader onMenuClick={() => setMobileOpen(true)} />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
