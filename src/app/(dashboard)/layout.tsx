"use client";

import { useEffect, type ReactNode } from "react";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { CommandPalette } from "@/features/command-palette/command-palette";
import { WelcomeBanner } from "@/features/onboarding/welcome-banner";
import { useGlobalShortcuts } from "@/lib/hooks/use-global-shortcuts";
import { hydrateLayoutFromDb } from "@/stores/layout.store";

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
