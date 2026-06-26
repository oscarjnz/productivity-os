"use client";

import { useEffect, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { useGlobalShortcuts } from "@/lib/hooks/use-global-shortcuts";
import { hydrateLayoutFromDb, useLayoutStore } from "@/stores/layout.store";
import { useAuth } from "@/features/auth/auth-provider";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";

// Off the critical path: cmdk (palette) and the onboarding banner aren't
// needed for first paint. Loading them lazily trims the initial bundle.
const CommandPalette = dynamic(
  () => import("@/features/command-palette/command-palette").then((m) => m.CommandPalette),
  { ssr: false },
);
const WelcomeBanner = dynamic(
  () => import("@/features/onboarding/welcome-banner").then((m) => m.WelcomeBanner),
  { ssr: false },
);

export default function DashboardLayout({ children }: { children: ReactNode }) {
  useGlobalShortcuts();

  const { user, loading: authLoading, cloudReady } = useAuth();
  const hydrated = useLayoutStore((s) => s.hydrated);

  // Guest mode (no user): hydrate from Dexie. When a user is logged in, the
  // auth provider drives hydration via the cloud initial sync and we must
  // NOT also pull from Dexie here — that races with the cloud replace and
  // can briefly flash a stale layout from a previous session.
  useEffect(() => {
    if (authLoading) return;
    if (user) return;
    void hydrateLayoutFromDb();
  }, [authLoading, user]);

  // Render the dashboard only once we know what to show:
  //   - auth resolved (so we know if there's a user)
  //   - cloud sync done (logged in) OR Dexie hydration done (guest)
  const ready = !authLoading && cloudReady && hydrated;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[1400px] flex-col px-5 pt-5 pb-10 md:px-7">
      <DashboardHeader />
      <WelcomeBanner />
      <main className="flex-1">
        {ready ? children : <DashboardSkeleton />}
      </main>
      <CommandPalette />
    </div>
  );
}

function DashboardSkeleton() {
  // Mirrors the live grid's responsive collapse: 1 column on mobile, 6 on
  // tablet, 12 on desktop. Spans are expressed against the 12-col base and
  // capped at each breakpoint so the skeleton never overflows a narrow screen.
  return (
    <div
      className={cn(
        "grid w-full gap-3",
        "grid-cols-1 sm:grid-cols-6 lg:grid-cols-12",
      )}
      aria-label="Loading dashboard"
    >
      <Skeleton className="h-40 sm:col-span-4 lg:col-span-7" />
      <Skeleton className="h-40 sm:col-span-2 lg:col-span-5" />
      <Skeleton className="h-56 sm:col-span-2 lg:col-span-4" />
      <Skeleton className="h-56 sm:col-span-2 lg:col-span-4" />
      <Skeleton className="h-56 sm:col-span-2 lg:col-span-4" />
    </div>
  );
}
