"use client";

import { useQuery } from "@tanstack/react-query";
import { getValidGoogleToken } from "@/features/auth/google-services";

export interface GmailMessage {
  id: string;
  from: string;
  subject: string;
  snippet: string;
  date: number;
}

export interface GmailData {
  unreadCount: number;
  messages: GmailMessage[];
}

interface ListResponse {
  messages?: Array<{ id: string }>;
  resultSizeEstimate?: number;
}

interface MessageResponse {
  id: string;
  snippet: string;
  internalDate: string;
  payload: { headers: Array<{ name: string; value: string }> };
}

function header(headers: Array<{ name: string; value: string }>, name: string): string {
  return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";
}

function cleanFrom(raw: string): string {
  // "Name <email>" → "Name"; bare email → local part
  const m = /^(.*?)\s*<.*>$/.exec(raw);
  if (m && m[1]) return m[1].replace(/^"|"$/g, "").trim();
  return raw.split("@")[0] ?? raw;
}

export function useGmail(query: string, maxThreads: number, enabled: boolean) {
  return useQuery<GmailData>({
    queryKey: ["gmail", query, maxThreads],
    enabled,
    queryFn: async ({ signal }) => {
      const token = await getValidGoogleToken();
      if (!token) throw new Error("Not connected");
      const auth = { Authorization: `Bearer ${token}` };

      const listParams = new URLSearchParams({
        q: query,
        maxResults: String(Math.min(20, maxThreads)),
      });
      const listRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?${listParams.toString()}`,
        { signal, headers: auth },
      );
      if (listRes.status === 401 || listRes.status === 403)
        throw new Error("Google session expired");
      if (!listRes.ok) throw new Error(`Gmail ${listRes.status}`);
      const list = (await listRes.json()) as ListResponse;

      const ids = (list.messages ?? []).map((m) => m.id);
      const messages: GmailMessage[] = await Promise.all(
        ids.map(async (id) => {
          const mp = new URLSearchParams({
            format: "metadata",
          });
          mp.append("metadataHeaders", "From");
          mp.append("metadataHeaders", "Subject");
          const r = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?${mp.toString()}`,
            { signal, headers: auth },
          );
          const m = (await r.json()) as MessageResponse;
          return {
            id: m.id,
            from: cleanFrom(header(m.payload.headers, "From")),
            subject: header(m.payload.headers, "Subject") || "(no subject)",
            snippet: m.snippet ?? "",
            date: Number(m.internalDate) || Date.now(),
          };
        }),
      );

      return {
        unreadCount: list.resultSizeEstimate ?? ids.length,
        messages: messages.sort((a, b) => b.date - a.date),
      };
    },
    refetchInterval: 2 * 60_000,
    staleTime: 60_000,
  });
}
