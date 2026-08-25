"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAuthStore } from "@/features/auth/store";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function UserMenu() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const displayName = user
    ? `${user.first_name} ${user.last_name}`.trim() || user.email
    : "";

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <div className="flex items-center gap-3">
      <div className="hidden items-center gap-2 sm:flex">
        <Avatar className="size-8">
          <AvatarFallback className="bg-primary/10 text-primary">
            {displayName ? initials(displayName) : "?"}
          </AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium">{displayName}</span>
      </div>
      <Button variant="outline" size="sm" onClick={handleLogout}>
        <LogOut className="size-4" />
        Sign out
      </Button>
    </div>
  );
}
