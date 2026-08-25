"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAuthStore } from "@/features/auth/store";
import { Button } from "@/components/ui/button";

export function UserMenu() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <div className="flex items-center gap-3">
      {user && (
        <span className="text-sm text-muted-foreground">{user.email}</span>
      )}
      <Button variant="outline" size="sm" onClick={handleLogout}>
        <LogOut className="size-4" />
        Sign out
      </Button>
    </div>
  );
}
