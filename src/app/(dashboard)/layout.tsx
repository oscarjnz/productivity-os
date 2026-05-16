"use client";

import { useEffect, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { useGlobalShortcuts } from "@/lib/hooks/use-global-shortcuts";
import { hydrateLayoutFromDb } from "@/stores/layout.store";

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

  useEffect(() => {
    void hydrateLayoutFromDb();
  }, []);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[1400px] flex-col px-5 pt-5 pb-10 md:px-7">
      <DashboardHeader />
      <WelcomeBanner />
      <main className="flex-1">{children}</main>
      <CommandPalette />
    </div>
  );
}
