"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { dashboardNav } from "@/config/navigation";
import { cn } from "@/lib/utils";
import { FolderKanban } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/features/auth/store";

export function DashboardSidebar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r bg-card md:flex">
      <div className="flex h-14 items-center gap-2 border-b px-6 font-semibold">
        <FolderKanban className="size-5 text-primary" />
        ProjectHub
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {dashboardNav.map((item) => {
          const active =
            item.href === "/dashboard" && pathname === "/dashboard";
          const Icon = item.icon;
          return (
            <Link
              key={item.title}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {item.title}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-4">
        {user && (
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">
              {user.first_name} {user.last_name}
            </span>
            {user.role && (
              <Badge variant="secondary" className="capitalize">
                {user.role.toLowerCase()}
              </Badge>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
