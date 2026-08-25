import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, FolderKanban, ListTodo, Building2 } from "lucide-react";
import type { PermissionCode, RoleCode } from "@/features/auth/types";

export type NavigationItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  match?: "exact" | "prefix";
  permission?: PermissionCode;
  roles?: RoleCode[];
};

export const dashboardNav: NavigationItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, match: "exact", permission: "projects.view" },
  { title: "Organizations", href: "/dashboard/organizations", icon: Building2, match: "prefix", roles: ["ADMIN"] },
  { title: "Projects", href: "/dashboard/projects", icon: FolderKanban, match: "prefix", permission: "projects.view" },
  { title: "My Tasks", href: "/dashboard/tasks", icon: ListTodo, match: "exact", permission: "tasks.view" },
];
