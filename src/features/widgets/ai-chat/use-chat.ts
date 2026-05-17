"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useCallback, useState } from "react";
import { getDb, type DbChatMessage } from "@/lib/db/dexie";
import { newRowId, nowIso } from "@/lib/db/helpers";
import { getProvider } from "./providers";
import { buildDashboardContext } from "./context";
import type { AIChatConfig } from "./config";

interface ChatMsg {
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
 * Generic SSE line parser — works for both Anthropic and OpenAI-compatible
 * streams (both emit `data: {json}` lines separated by blank lines).
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

interface RequestPlan {
  url: string;
  headers: Record<string, string>;
  body: string;
  /** Pull the incremental text out of one parsed SSE event. */
  extractDelta: (ev: unknown) => string;
}

function buildRequest(
  config: AIChatConfig,
  apiKey: string | null,
  messages: ChatMsg[],
  systemPrompt: string,
): RequestPlan {
  const provider = getProvider(config.provider);
  const base = (config.baseUrl.trim() || provider.defaultBaseUrl).replace(/\/+$/, "");

  if (provider.kind === "anthropic") {
    return {
      url: `${base}/messages`,
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey ?? "",
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: config.maxTokens,
        system: systemPrompt,
        messages,
        stream: true,
      }),
      extractDelta: (ev) => {
        const e = ev as { type?: string; delta?: { type?: string; text?: string } };
        return e.type === "content_block_delta" &&
          e.delta?.type === "text_delta" &&
          e.delta.text
          ? e.delta.text
          : "";
      },
    };
  }

  // OpenAI-compatible (OpenAI, DeepSeek, Gemini, Groq, xAI, Mistral,
  // OpenRouter, Ollama, LM Studio, …)
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (apiKey) headers["authorization"] = `Bearer ${apiKey}`;

  return {
    url: `${base}/chat/completions`,
    headers,
    body: JSON.stringify({
      model: config.model,
      max_tokens: config.maxTokens,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      stream: true,
    }),
    extractDelta: (ev) => {
      const e = ev as { choices?: Array<{ delta?: { content?: string } }> };
      return e.choices?.[0]?.delta?.content ?? "";
    },
  };
}

function parseError(status: number, body: string, providerLabel: string): string {
  try {
    const p = JSON.parse(body) as {
      error?: { message?: string } | string;
    };
    if (typeof p.error === "string") return p.error;
    if (p.error?.message) return p.error.message;
  } catch {
    /* fall through */
  }
  return `${providerLabel} API ${status}`;
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
      if (!content) return;

      const provider = getProvider(config.provider);
      if (provider.requiresKey && !apiKey) {
        setError(`Add your ${provider.label} API key in settings.`);
        return;
      }

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

      const messages: ChatMsg[] = history
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

      const assistantId = newRowId();
      await db.chat_messages.put({
        id: assistantId,
        instance_id: instanceId,
        role: "assistant",
        content: "",
        created_at: nowIso(),
      });

      try {
        // Inject real dashboard data so the model uses facts, not guesses.
        // Best-effort: if it fails, fall back to the bare system prompt.
        let systemPrompt = config.systemPrompt;
        try {
          const ctx = await buildDashboardContext();
          if (ctx) systemPrompt = `${config.systemPrompt}\n\n${ctx}`;
        } catch {
          /* keep bare prompt */
        }

        const plan = buildRequest(config, apiKey, messages, systemPrompt);
        const res = await fetch(plan.url, {
          method: "POST",
          headers: plan.headers,
          body: plan.body,
        });

        if (!res.ok) {
          throw new Error(parseError(res.status, await res.text(), provider.label));
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
          const piece = plan.extractDelta(event);
          if (piece) {
            acc += piece;
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
