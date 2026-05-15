"use client";

import { useQuery } from "@tanstack/react-query";

export type GitHubEventType =
  | "PushEvent"
  | "PullRequestEvent"
  | "IssuesEvent"
  | "IssueCommentEvent"
  | "WatchEvent"
  | "CreateEvent"
  | "ForkEvent"
  | "PullRequestReviewEvent"
  | "ReleaseEvent"
  | "PublicEvent"
  | "DeleteEvent";

export interface GitHubEvent {
  id: string;
  type: GitHubEventType | string;
  repo: { name: string; url: string };
  createdAt: string;
  /** Short human description of what happened. */
  description: string;
  /** Optional secondary line (commit message, PR title…). */
  detail?: string;
}

interface RawEvent {
  id: string;
  type: string;
  created_at: string;
  repo: { name: string };
  payload: Record<string, unknown>;
}

function describe(e: RawEvent): { description: string; detail?: string } {
  const p = e.payload as Record<string, unknown>;
  switch (e.type) {
    case "PushEvent": {
      const commits = (p["commits"] as { message: string }[] | undefined) ?? [];
      const count = (p["size"] as number | undefined) ?? commits.length;
      const msg = commits[0]?.message?.split("\n")[0];
      return {
        description: `pushed ${count} commit${count === 1 ? "" : "s"}`,
        ...(msg ? { detail: msg } : {}),
      };
    }
    case "PullRequestEvent": {
      const action = p["action"] as string;
      const pr = p["pull_request"] as { title: string; merged?: boolean } | undefined;
      const verb = action === "closed" && pr?.merged ? "merged" : action;
      return {
        description: `${verb} PR`,
        ...(pr?.title ? { detail: pr.title } : {}),
      };
    }
    case "IssuesEvent": {
      const action = p["action"] as string;
      const issue = p["issue"] as { title: string } | undefined;
      return {
        description: `${action} issue`,
        ...(issue?.title ? { detail: issue.title } : {}),
      };
    }
    case "IssueCommentEvent":
      return { description: "commented on issue" };
    case "WatchEvent":
      return { description: "starred" };
    case "ForkEvent":
      return { description: "forked" };
    case "CreateEvent": {
      const ref = p["ref_type"] as string;
      return { description: `created ${ref}` };
    }
    case "DeleteEvent": {
      const ref = p["ref_type"] as string;
      return { description: `deleted ${ref}` };
    }
    case "PullRequestReviewEvent":
      return { description: "reviewed PR" };
    case "ReleaseEvent":
      return { description: "released" };
    case "PublicEvent":
      return { description: "made repo public" };
    default:
      return { description: e.type.replace(/Event$/, "").toLowerCase() };
  }
}

export function useGitHubEvents(username: string) {
  return useQuery<GitHubEvent[]>({
    queryKey: ["github-events", username],
    enabled: username.trim().length > 0,
    queryFn: async ({ signal }) => {
      const res = await fetch(
        `https://api.github.com/users/${encodeURIComponent(username.trim())}/events/public`,
        { signal, headers: { Accept: "application/vnd.github+json" } },
      );
      if (res.status === 404) throw new Error("User not found");
      if (res.status === 403) throw new Error("Rate limit reached");
      if (!res.ok) throw new Error(`GitHub API ${res.status}`);
      const raw = (await res.json()) as RawEvent[];
      return raw.map((e) => {
        const { description, detail } = describe(e);
        return {
          id: e.id,
          type: e.type,
          repo: { name: e.repo.name, url: `https://github.com/${e.repo.name}` },
          createdAt: e.created_at,
          description,
          ...(detail !== undefined ? { detail } : {}),
        };
      });
    },
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  });
}
