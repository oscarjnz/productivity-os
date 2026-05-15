import { cn } from "@/lib/utils/cn";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

/**
 * Animated placeholder. Use during loading instead of spinners — preserves
 * layout and feels faster.
 */
export function Skeleton({ className, ...rest }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "animate-pulse rounded-[var(--radius-sm)] bg-[var(--color-border)]",
        className,
      )}
      {...rest}
    />
  );
}
