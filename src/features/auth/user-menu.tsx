"use client";

import Link from "next/link";
import {
  LogOut,
  User as UserIcon,
  Cloud,
  CloudOff,
  RefreshCcw,
  AlertTriangle,
  Settings,
} from "lucide-react";
import * as Popover from "@radix-ui/react-popover";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "./auth-provider";
import { AppearancePanel } from "./appearance-panel";
import { ProfilePanel } from "./profile-panel";
import { useSyncStatus } from "@/lib/sync/sync-provider";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";
import { duration, easing } from "@/config/motion";

function SyncIndicator() {
  const { status } = useSyncStatus();

  const config = {
    idle: { Icon: Cloud, label: "Synced", color: "var(--color-success)" },
    syncing: { Icon: RefreshCcw, label: "Syncing…", color: "var(--color-accent)" },
    offline: { Icon: CloudOff, label: "Offline", color: "var(--color-text-lo)" },
    error: { Icon: AlertTriangle, label: "Sync error", color: "var(--color-danger)" },
  }[status];

  const { Icon, label, color } = config;

  return (
    <div className="flex items-center gap-1.5 text-[11px]" style={{ color }}>
      <Icon
        className={cn("h-3 w-3", status === "syncing" && "animate-spin")}
        aria-hidden
      />
      <span>{label}</span>
    </div>
  );
}

export function UserMenu() {
  const { user, loading, configured, signOut } = useAuth();

  if (loading) {
    return <Skeleton className="h-8 w-8 rounded-full" />;
  }

  const initial = (user?.user_metadata?.["full_name"] as string | undefined)?.[0]
    ?? user?.email?.[0]
    ?? null;
  const avatar = user?.user_metadata?.["avatar_url"] as string | undefined;
  const displayName =
    (user?.user_metadata?.["full_name"] as string | undefined) ?? user?.email ?? null;

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label={user ? "Account" : "Settings"}
          className={cn(
            "flex h-8 w-8 items-center justify-center overflow-hidden",
            "rounded-full border border-[var(--color-border)]",
            "bg-[var(--color-bg-raised)] text-[12px] font-medium text-[var(--color-text-mid)]",
            "transition-[border-color,transform] duration-[var(--duration-fast)]",
            "hover:border-[var(--color-border-strong)] active:scale-[0.96]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-base)]",
          )}
        >
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt="" className="h-full w-full object-cover" />
          ) : initial ? (
            initial.toUpperCase()
          ) : (
            <Settings className="h-3.5 w-3.5" aria-hidden />
          )}
        </button>
      </Popover.Trigger>

      <AnimatePresence>
        <Popover.Portal>
          <Popover.Content asChild align="end" sideOffset={8}>
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -2, scale: 0.98 }}
              transition={{ duration: duration.fast, ease: easing.standard }}
              className={cn(
                "z-[var(--z-dropdown)] w-[280px] max-h-[calc(100vh-4rem)] overflow-y-auto p-1",
                "rounded-[var(--radius-md)] glass-hi shadow-[var(--shadow-lg)]",
              )}
            >
              {user && (
                <div className="border-b border-[var(--color-border)] px-3 py-2.5">
                  <div className="truncate text-[12.5px] font-medium text-[var(--color-text-hi)]">
                    {displayName}
                  </div>
                  {user.email && (
                    <div className="mt-0.5 truncate text-[11px] text-[var(--color-text-lo)]">
                      {user.email}
                    </div>
                  )}
                  <div className="mt-2">
                    <SyncIndicator />
                  </div>
                </div>
              )}

              {user && (
                <div className="border-b border-[var(--color-border)]">
                  <ProfilePanel />
                </div>
              )}

              <div className="border-b border-[var(--color-border)]">
                <AppearancePanel />
              </div>

              {user ? (
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2",
                    "rounded-[var(--radius-sm)] text-[12.5px] text-[var(--color-text-mid)]",
                    "hover:bg-[var(--color-surface-glass)] hover:text-[var(--color-text-hi)]",
                    "transition-colors duration-[var(--duration-fast)]",
                  )}
                >
                  <LogOut className="h-3.5 w-3.5" aria-hidden />
                  Sign out
                </button>
              ) : configured ? (
                <Link
                  href="/auth/login"
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2",
                    "rounded-[var(--radius-sm)] text-[12.5px] text-[var(--color-accent)]",
                    "hover:bg-[var(--color-accent-soft)]",
                    "transition-colors duration-[var(--duration-fast)]",
                  )}
                >
                  <UserIcon className="h-3.5 w-3.5" aria-hidden />
                  Sign in to sync
                </Link>
              ) : (
                <div className="px-3 py-2 text-[11px] text-[var(--color-text-lo)]">
                  Local-only mode. Configure Supabase to enable cloud sync.
                </div>
              )}
            </motion.div>
          </Popover.Content>
        </Popover.Portal>
      </AnimatePresence>
    </Popover.Root>
  );
}
