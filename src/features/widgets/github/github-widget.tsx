"use client";

import { memo } from "react";
import {
  GitCommit,
  GitPullRequest,
  CircleDot,
  Star,
  GitFork,
  Plus,
  Trash2,
  Eye,
  Package,
  Globe,
  ExternalLink,
  Github as GithubIcon,
  Settings2,
  type LucideIcon,
} from "lucide-react";
import { useGitHubEvents, type GitHubEventType } from "./use-github-events";
import { formatRelativeTime } from "@/lib/utils/format";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";
import type { WidgetProps } from "@/types/widget.types";
import type { GitHubConfig } from "./config";

const ICONS: Record<string, LucideIcon> = {
  PushEvent: GitCommit,
  PullRequestEvent: GitPullRequest,
  PullRequestReviewEvent: GitPullRequest,
  IssuesEvent: CircleDot,
  IssueCommentEvent: CircleDot,
  WatchEvent: Star,
  ForkEvent: GitFork,
  CreateEvent: Plus,
  DeleteEvent: Trash2,
  ReleaseEvent: Package,
  PublicEvent: Globe,
};

function GitHubWidgetInner({ config }: WidgetProps<GitHubConfig>) {
  const trimmed = config.username.trim();
  const { data, isLoading, isError, error, refetch, isFetching } = useGitHubEvents(trimmed);

  if (!trimmed) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
        <GithubIcon className="h-6 w-6 text-[var(--color-text-lo)]" aria-hidden />
        <div className="text-[12px] text-[var(--color-text-mid)]">No username set</div>
        <div className="inline-flex items-center gap-1 text-[11px] text-[var(--color-text-lo)]">
          <Settings2 className="h-3 w-3" aria-hidden />
          Open settings and add your GitHub handle.
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
        <div className="text-[12px] text-[var(--color-danger)]">
          {error instanceof Error ? error.message : "Failed to load"}
        </div>
        <button
          type="button"
          onClick={() => void refetch()}
          className="text-[11px] text-[var(--color-accent)] hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="flex h-full flex-col gap-2">
        <Skeleton className="h-3 w-24" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-3 flex-1" />
            <Skeleton className="h-2.5 w-8" />
          </div>
        ))}
      </div>
    );
  }

  const visible = data.slice(0, Math.max(1, Math.min(50, config.limit)));

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center justify-between">
        <a
          href={`https://github.com/${trimmed}`}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "inline-flex items-center gap-1.5 text-[11px] text-[var(--color-text-mid)]",
            "hover:text-[var(--color-text-hi)] no-underline",
          )}
        >
          <GithubIcon className="h-3 w-3" aria-hidden />
          @{trimmed}
          <ExternalLink className="h-2.5 w-2.5 opacity-50" aria-hidden />
        </a>
        {isFetching && (
          <span className="text-[10px] text-[var(--color-text-lo)]">refreshing…</span>
        )}
      </div>

      <ul className="-mr-1 flex flex-1 flex-col gap-1 overflow-y-auto pr-1">
        {visible.length === 0 ? (
          <li className="py-6 text-center text-[12px] text-[var(--color-text-lo)]">
            No public activity yet.
          </li>
        ) : (
          visible.map((e) => {
            const Icon = ICONS[e.type as GitHubEventType] ?? Eye;
            return (
              <li
                key={e.id}
                className={cn(
                  "flex items-start gap-2 rounded-[var(--radius-sm)] px-2 py-1.5",
                  "border border-transparent",
                  "transition-[border-color,background-color] duration-[var(--duration-fast)]",
                  "hover:border-[var(--color-border)] hover:bg-[var(--color-bg-base)]",
                )}
              >
                <Icon
                  className="mt-0.5 h-3 w-3 shrink-0 text-[var(--color-text-lo)]"
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-1.5 text-[11.5px]">
                    <span className="shrink-0 text-[var(--color-text-mid)]">{e.description}</span>
                    <a
                      href={e.repo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-w-0 truncate text-[var(--color-text-hi)] no-underline hover:text-[var(--color-accent)]"
                    >
                      {e.repo.name}
                    </a>
                  </div>
                  {e.detail && (
                    <div className="truncate text-[10.5px] text-[var(--color-text-lo)]">
                      {e.detail}
                    </div>
                  )}
                </div>
                <span className="shrink-0 text-[10px] text-[var(--color-text-lo)] tabular">
                  {formatRelativeTime(e.createdAt)}
                </span>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}

export const GitHubWidget = memo(GitHubWidgetInner);
