import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, FolderKanban } from "lucide-react";

export type NavigationItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

export const dashboardNav: NavigationItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Projects", href: "/dashboard", icon: FolderKanban },
];
