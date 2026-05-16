"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, AlertTriangle, Info, X, TriangleAlert } from "lucide-react";
import { useToastStore, type ToastKind } from "@/stores/toast.store";
import { cn } from "@/lib/utils/cn";
import { duration as motionDuration, easing } from "@/config/motion";

const ICON: Record<ToastKind, typeof Info> = {
  info: Info,
  success: CheckCircle2,
  error: AlertTriangle,
  warning: TriangleAlert,
};

const ACCENT: Record<ToastKind, string> = {
  info: "var(--color-text-mid)",
  success: "var(--color-success)",
  error: "var(--color-danger)",
  warning: "var(--color-warning)",
};

function ToastRow({ id }: { id: string }) {
  const toast = useToastStore((s) => s.toasts.find((t) => t.id === id));
  const dismiss = useToastStore((s) => s.dismiss);

  useEffect(() => {
    if (!toast || toast.duration <= 0) return;
    const t = setTimeout(() => dismiss(id), toast.duration);
    return () => clearTimeout(t);
  }, [toast, id, dismiss]);

  if (!toast) return null;
  const Icon = ICON[toast.kind];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 4, scale: 0.97 }}
      transition={{ duration: motionDuration.fast, ease: easing.standard }}
      className={cn(
        "pointer-events-auto flex items-start gap-2.5",
        "w-[min(360px,calc(100vw-2rem))] rounded-[var(--radius-md)] p-3",
        "glass-hi shadow-[var(--shadow-lg)]",
      )}
    >
      <Icon
        className="mt-0.5 h-4 w-4 shrink-0"
        style={{ color: ACCENT[toast.kind] }}
        aria-hidden
      />
      <p className="flex-1 text-[12.5px] leading-snug text-[var(--color-text-hi)]">
        {toast.message}
      </p>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => dismiss(id)}
        className="flex h-5 w-5 items-center justify-center rounded-[var(--radius-xs)] text-[var(--color-text-lo)] hover:bg-[var(--color-surface-glass)] hover:text-[var(--color-text-mid)]"
      >
        <X className="h-3 w-3" aria-hidden />
      </button>
    </motion.div>
  );
}

export function Toaster() {
  const ids = useToastStore((s) => s.toasts.map((t) => t.id));
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[var(--z-toast)] flex flex-col gap-2">
      <AnimatePresence initial={false}>
        {ids.map((id) => (
          <ToastRow key={id} id={id} />
        ))}
      </AnimatePresence>
    </div>
  );
}
