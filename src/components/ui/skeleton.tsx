import { cn } from "@/lib/utils/cn";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

/**
 * Animated placeholder. Use during loading instead of spinners — preserves
 * layout and feels faster. A subtle highlight sweep replaces the harsher
 * opacity pulse; collapses to a static tint under reduced motion via
 * the global @media rule in globals.css.
 */
export function Skeleton({ className, ...rest }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "relative overflow-hidden rounded-[var(--radius-sm)]",
        "bg-[var(--color-bg-overlay)]",
        // Highlight sweep using ::after via a pseudo from arbitrary class.
        "after:absolute after:inset-0 after:-translate-x-full",
        "after:bg-[linear-gradient(90deg,transparent_0%,oklch(1_0_0_/_0.04)_50%,transparent_100%)]",
        "after:[animation:shimmer_1.6s_var(--ease-standard)_infinite]",
        className,
      )}
      {...rest}
    />
  );
}
