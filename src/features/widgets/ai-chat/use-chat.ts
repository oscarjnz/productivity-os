"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useCallback, useState } from "react";
import { getDb, type DbChatMessage } from "@/lib/db/dexie";
import { newRowId, nowIso } from "@/lib/db/helpers";
import type { AIChatConfig } from "./config";

interface AnthropicMessage {
  role: "user" | "assistant";
  content: string;
}

export function useChatMessages(instanceId: string): DbChatMessage[] {
  const rows = useLiveQuery(
    async () => {
      const db = getDb();
      if (!db) return [];
      return db.chat_messages.where("instance_id").equals(instanceId).sortBy("created_at");
    },
    [instanceId],
    [] as DbChatMessage[],
  );
  return rows ?? [];
}

export interface ChatMutations {
  send: (text: string) => Promise<void>;
  clear: () => Promise<void>;
  isSending: boolean;
  error: string | null;
}

/**
 * Parse Anthropic SSE stream: events separated by blank lines, each starting
 * with `data: ` (sometimes preceded by `event: ...`). Yields each parsed JSON.
 */
async function* parseSSE(stream: ReadableStream<Uint8Array>): AsyncGenerator<unknown> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const ev of events) {
      const dataLine = ev.split("\n").find((l) => l.startsWith("data: "));
      if (!dataLine) continue;
      const raw = dataLine.slice(6).trim();
      if (!raw || raw === "[DONE]") continue;
      try {
        yield JSON.parse(raw);
      } catch {
        // ignore malformed chunks
      }
    }
  }
}

export function useChat(
  instanceId: string,
  config: AIChatConfig,
  apiKey: string | null,
): ChatMutations {
  const [isSending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(
    async (text: string) => {
      const db = getDb();
      if (!db) return;
      const content = text.trim();
      if (!content || !apiKey) return;

      setError(null);
      setSending(true);

      const userMsg: DbChatMessage = {
        id: newRowId(),
        instance_id: instanceId,
        role: "user",
        content,
        created_at: nowIso(),
      };
      await db.chat_messages.put(userMsg);

      const history = await db.chat_messages
        .where("instance_id")
        .equals(instanceId)
        .sortBy("created_at");

      const messages: AnthropicMessage[] = history
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

      // Create an empty assistant placeholder we'll fill as tokens stream in.
      const assistantId = newRowId();
      const assistantBase: DbChatMessage = {
        id: assistantId,
        instance_id: instanceId,
        role: "assistant",
        content: "",
        created_at: nowIso(),
      };
      await db.chat_messages.put(assistantBase);

      try {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            "anthropic-dangerous-direct-browser-access": "true",
          },
          body: JSON.stringify({
            model: config.model,
            max_tokens: config.maxTokens,
            system: config.systemPrompt,
            messages,
            stream: true,
          }),
        });

        if (!res.ok) {
          const body = await res.text();
          let msg = `Anthropic API ${res.status}`;
          try {
            const parsed = JSON.parse(body) as { error?: { message?: string } };
            if (parsed.error?.message) msg = parsed.error.message;
          } catch {
            /* ignore */
          }
          throw new Error(msg);
        }
        if (!res.body) throw new Error("No response stream");

        let acc = "";
        let lastFlush = 0;
        const flush = async (force = false): Promise<void> => {
          const now = Date.now();
          if (!force && now - lastFlush < 60) return;
          lastFlush = now;
          await db.chat_messages.update(assistantId, { content: acc });
        };

        for await (const event of parseSSE(res.body)) {
          const ev = event as {
            type?: string;
            delta?: { type?: string; text?: string };
          };
          if (ev.type === "content_block_delta" && ev.delta?.type === "text_delta" && ev.delta.text) {
            acc += ev.delta.text;
            await flush();
          }
        }

        await flush(true);

        if (acc.trim().length === 0) {
          await db.chat_messages.delete(assistantId);
          throw new Error("Empty response");
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        // Roll back both the user message and the (likely partial) assistant
        // message so the input stays useful.
        await db.chat_messages.delete(userMsg.id);
        await db.chat_messages.delete(assistantId).catch(() => undefined);
      } finally {
        setSending(false);
      }
    },
    [instanceId, config, apiKey],
  );

  const clear = useCallback(async () => {
    const db = getDb();
    if (!db) return;
    await db.chat_messages.where("instance_id").equals(instanceId).delete();
    setError(null);
  }, [instanceId]);

  return { send, clear, isSending, error };
}
