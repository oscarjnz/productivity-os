"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";

interface TeamLogoProps {
  src: string | null;
  alt: string;
  size?: number;
  className?: string;
}

/**
 * Resilient team crest — if the upstream image fails (some ESPN logos 404),
 * we render an initials chip in the team's neutral color.
 */
export function TeamLogo({ src, alt, size = 18, className }: TeamLogoProps) {
  const [errored, setErrored] = useState(false);
  const initials = alt
    .split(/[\s.-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  if (!src || errored) {
    return (
      <span
        aria-hidden
        className={cn(
          "inline-flex shrink-0 items-center justify-center",
          "rounded-full border border-[var(--color-border)]",
          "bg-[var(--color-bg-raised)] text-[var(--color-text-mid)]",
          "text-[8px] font-semibold tabular tracking-tight",
          className,
        )}
        style={{ width: size, height: size }}
        title={alt}
      >
        {initials || "·"}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      loading="lazy"
      onError={() => setErrored(true)}
      className={cn("shrink-0 object-contain", className)}
    />
  );
}
