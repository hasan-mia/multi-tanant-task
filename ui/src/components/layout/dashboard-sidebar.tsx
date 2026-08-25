"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FolderKanban,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
} from "lucide-react";
import { dashboardNav } from "@/config/navigation";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useAuthStore } from "@/features/auth/store";
import { useSidebarStore } from "@/components/layout/sidebar-store";

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function SidebarNav({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname();
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const userRole = useAuthStore((s) => s.user?.role);

  const visibleItems = dashboardNav.filter((item) => {
    if (item.permission && !hasPermission(item.permission)) return false;
    if (item.roles && (!userRole || !item.roles.includes(userRole as never))) {
      return false;
    }
    return true;
  });

  return (
    <nav className="flex-1 space-y-1.5 overflow-y-auto p-3">
      {visibleItems.map((item) => {
        const active =
          item.match === "prefix"
            ? pathname === item.href || pathname.startsWith(`${item.href}/`)
            : pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.title}
            href={item.href}
            title={collapsed ? item.title : undefined}
            className={cn(
              "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
              collapsed && "justify-center px-0",
              active
                ? "bg-[#60A5FA]/10 text-[#60A5FA] shadow-[inset_2px_0_0_0_#60A5FA]"
                : "text-[#94A3B8] hover:bg-[#171E2E] hover:text-white",
            )}
          >
            <Icon className="size-5 shrink-0" />
            {!collapsed && <span>{item.title}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarUserFooter({ collapsed }: { collapsed: boolean }) {
  const user = useAuthStore((s) => s.user);
  const displayName = user
    ? `${user.first_name} ${user.last_name}`.trim() || user.email
    : "";
  return (
    <div className="flex flex-col items-center gap-2 p-3">
      <div className="rounded-full border border-[#1E293B] bg-[#0F1626] p-1 shadow-lg shadow-black/30">
        <Avatar className={cn("shrink-0 rounded-full ring-2 ring-[#1E293B]", collapsed ? "size-10" : "size-16")}>
          {user?.avatar && <AvatarImage src={user.avatar} alt={displayName} />}
          <AvatarFallback className="bg-[#1E293B] text-[#60A5FA]">
            {displayName ? initials(displayName) : "?"}
          </AvatarFallback>
        </Avatar>
      </div>
      {!collapsed && (
        <div className="text-center">
          <p className="truncate text-sm font-medium text-white mb-1">
            {displayName}
          </p>
          {user?.role && (
            <Badge className="shrink-0 border border-[#1E293B] bg-[#1E293B] capitalize text-[#60A5FA]">
              {user.role.toLowerCase()}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

function SidebarLogout() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  return (
    <div className="border-t border-[#1E293B] p-3">
      <Button
        variant="ghost"
        onClick={() => {
          logout();
          router.push("/login");
        }}
        className="w-full justify-center gap-3 rounded-md border border-[#1E293B] bg-[#171E2E] font-semibold text-white hover:bg-[#1E293B] hover:text-[#60A5FA]"
      >
        <LogOut className="size-5" />
        <span className="md:inline">Logout</span>
      </Button>
    </div>
  );
}

function SidebarBody({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#090D16] text-[#94A3B8]">
      <SidebarUserFooter collapsed={collapsed} />
      <SidebarNav collapsed={collapsed} />
      <SidebarLogout />
    </div>
  );
}

/** Desktop sidebar (collapsible). */
export function DashboardSidebar() {
  const collapsed = useSidebarStore((s) => s.collapsed);
  const toggle = useSidebarStore((s) => s.toggle);

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col border-[#1E293B] bg-[#090D16] transition-[width] duration-200 md:flex px-1",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex h-16 items-center gap-2 border-b border-[#1E293B] px-4">
        {collapsed ? (
          <button
            type="button"
            onClick={toggle}
            title="Expand sidebar"
            aria-label="Expand sidebar"
            className="mx-auto flex size-8 items-center justify-center rounded-md text-[#94A3B8] transition-colors hover:bg-[#171E2E] hover:text-white"
          >
            <PanelLeftOpen className="size-5" />
          </button>
        ) : (
          <>
            <div className="flex size-8 items-center justify-center rounded-lg bg-[#60A5FA] text-[#090D16]">
              <FolderKanban className="size-5" />
            </div>
            <span className="font-semibold tracking-tight text-white">
              ProjectHub
            </span>
            <div className="ml-auto flex items-center gap-1">
              <ThemeToggle />
              <button
                type="button"
                onClick={toggle}
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
                className="flex size-8 items-center justify-center rounded-md text-[#94A3B8] transition-colors hover:bg-[#171E2E] hover:text-white"
              >
                <PanelLeftClose className="size-5" />
              </button>
            </div>
          </>
        )}
      </div>
      <SidebarBody collapsed={collapsed} />
    </aside>
  );
}

/** Mobile sidebar (drawer). */
export function MobileSidebar({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-64 p-0">
        <div className="flex h-16 items-center gap-2 border-b border-[#1E293B] px-4">
          <div className="flex size-8 items-center justify-center rounded-lg bg-[#60A5FA] text-[#090D16]">
            <FolderKanban className="size-5" />
          </div>
          <span className="font-semibold tracking-tight text-white">
            ProjectHub
          </span>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
        <SidebarBody collapsed={false} />
      </SheetContent>
    </Sheet>
  );
}
