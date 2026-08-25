"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/features/auth/store";
import { fetchMe, refreshTokens } from "@/features/auth/api";
import { Skeleton } from "@/components/ui/skeleton";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

// Single gate for every protected route. Resolves auth once, shows a loader
// while resolving, and only renders children once the user is authenticated.
// Prevents the "render protected content then redirect" flash and removes the
// duplicated auth logic that previously lived in the layout and pages.
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const user = useAuthStore((s) => s.user);
  const [authFailed, setAuthFailed] = useState(false);

  // Safety net: ensure hydration completes even if persist rehydration
  // doesn't fire (e.g. first visit with no stored state).
  useEffect(() => {
    if (isHydrated) return;
    const timer = window.setTimeout(
      () => useAuthStore.getState().setHydrated(),
      1500,
    );
    return () => window.clearTimeout(timer);
  }, [isHydrated]);

  // Resolve identity when tokens exist but no user is loaded yet. State is
  // only updated inside async callbacks, never synchronously in the effect.
  useEffect(() => {
    if (!isHydrated || user || authFailed) return;
    if (!accessToken && !refreshToken) return;

    let cancelled = false;
    (async () => {
      try {
        let me = await fetchMe();
        if (!me && refreshToken) {
          const refreshed = await refreshTokens(refreshToken);
          useAuthStore
            .getState()
            .setTokens(refreshed.access_token, refreshed.refresh_token);
          me = await fetchMe();
        }
        if (cancelled) return;
        if (me) {
          useAuthStore.getState().setUser(me.user, me.permissions);
        } else {
          setAuthFailed(true);
        }
      } catch {
        if (!cancelled) setAuthFailed(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isHydrated, accessToken, refreshToken, user, authFailed]);

  const status: AuthStatus = (() => {
    if (!isHydrated) return "loading";
    if (user) return "authenticated";
    if (!accessToken && !refreshToken) return "unauthenticated";
    if (authFailed) return "unauthenticated";
    return "loading";
  })();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen flex-col gap-4 p-8">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  return <>{children}</>;
}
