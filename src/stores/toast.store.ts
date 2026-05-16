"use client";

import { create } from "zustand";

export type ToastKind = "info" | "success" | "error" | "warning";

export interface Toast {
  id: string;
  kind: ToastKind;
  message: string;
  /** Auto-dismiss ms. 0 = sticky until dismissed. */
  duration: number;
}

interface ToastState {
  toasts: Toast[];
  push: (t: Omit<Toast, "id"> & { id?: string }) => string;
  dismiss: (id: string) => void;
}

function genId(): string {
  return `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export const useToastStore = create<ToastState>()((set) => ({
  toasts: [],
  push: (t) => {
    const id = t.id ?? genId();
    set((s) => {
      // Dedupe by id so a repeating condition (e.g. sync error) doesn't stack.
      const without = s.toasts.filter((x) => x.id !== id);
      return {
        toasts: [
          ...without,
          { id, kind: t.kind, message: t.message, duration: t.duration },
        ].slice(-4),
      };
    });
    return id;
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Convenience helpers. */
export const toast = {
  error: (message: string, id?: string) =>
    useToastStore.getState().push({ kind: "error", message, duration: 0, ...(id ? { id } : {}) }),
  success: (message: string) =>
    useToastStore.getState().push({ kind: "success", message, duration: 3000 }),
  info: (message: string) =>
    useToastStore.getState().push({ kind: "info", message, duration: 3000 }),
};
