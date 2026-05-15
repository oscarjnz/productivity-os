"use client";

import { LOCAL_USER_ID } from "@/lib/sync/entity-sync";

export function newRowId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `r_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function effectiveUserId(userId: string | null | undefined): string {
  return userId ?? LOCAL_USER_ID;
}
