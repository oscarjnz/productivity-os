"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/features/auth/auth-provider";
import { SyncProvider } from "@/lib/sync/sync-provider";
import { PreferencesEffect } from "@/features/auth/preferences-effect";
import { Toaster } from "@/components/ui/toaster";

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            gcTime: 10 * 60_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
          mutations: { retry: 0 },
        },
      }),
  );

  return (
    <QueryClientProvider client={client}>
      <AuthProvider>
        <SyncProvider>
          <PreferencesEffect />
          {children}
          <Toaster />
        </SyncProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
