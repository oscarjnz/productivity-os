"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Send, Sparkles, Trash2, Key, Lock } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useApiKey } from "./use-api-key";
import { useChatMessages, useChat } from "./use-chat";
import { Markdown } from "@/components/ui/markdown";
import { cn } from "@/lib/utils/cn";
import { duration, easing } from "@/config/motion";
import type { WidgetProps } from "@/types/widget.types";
import type { AIChatConfig } from "./config";

function ApiKeyGate({ onSave }: { onSave: (k: string) => void }) {
  const [val, setVal] = useState("");
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
        <Key className="h-4 w-4" aria-hidden />
      </div>
      <div className="flex flex-col gap-1">
        <div className="text-[13px] font-medium text-[var(--color-text-hi)]">
          Anthropic API key
        </div>
        <div className="text-[11.5px] leading-snug text-[var(--color-text-lo)]">
          Stays in your browser. Never sent to Supabase or any server.
        </div>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (val.trim()) onSave(val.trim());
        }}
        className="flex w-full max-w-[280px] flex-col gap-2"
      >
        <input
          type="password"
          value={val}
          autoComplete="off"
          onChange={(e) => setVal(e.target.value)}
          placeholder="sk-ant-…"
          className={cn(
            "w-full rounded-[var(--radius-sm)]",
            "border border-[var(--color-border)] bg-[var(--color-bg-base)]",
            "px-2.5 py-1.5 text-[12.5px] text-[var(--color-text-hi)] outline-none",
            "placeholder:text-[var(--color-text-lo)]",
            "focus:border-[var(--color-accent)]",
          )}
        />
        <button
          type="submit"
          disabled={!val.trim()}
          className={cn(
            "rounded-[var(--radius-sm)] px-2.5 py-1.5",
            "bg-[var(--color-accent-soft)] text-[var(--color-accent)]",
            "border border-[oklch(0.68_0.18_270/0.2)]",
            "text-[12.5px] font-medium",
            "transition-[background-color] duration-[var(--duration-fast)]",
            "hover:bg-[oklch(0.68_0.18_270/0.18)]",
            "disabled:opacity-40 active:scale-[0.98]",
          )}
        >
          Save key
        </button>
      </form>
      <div className="flex items-center gap-1 text-[10px] text-[var(--color-text-lo)]">
        <Lock className="h-2.5 w-2.5" aria-hidden />
        IndexedDB only
      </div>
    </div>
  );
}

function AIChatWidgetInner({ instanceId, config }: WidgetProps<AIChatConfig>) {
  const { apiKey, setApiKey } = useApiKey();
  const messages = useChatMessages(instanceId);
  const { send, clear, isSending, error } = useChat(instanceId, config, apiKey);
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll on new message
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length, isSending]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const v = input.trim();
      if (!v || isSending) return;
      setInput("");
      await send(v);
    },
    [input, isSending, send],
  );

  if (!apiKey) {
    return <ApiKeyGate onSave={(k) => void setApiKey(k)} />;
  }

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.08em] text-[var(--color-text-lo)]">
          <Sparkles className="h-3 w-3" aria-hidden />
          {config.model.replace("claude-", "")}
        </span>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={() => void clear()}
            className="inline-flex items-center gap-1 text-[11px] text-[var(--color-text-lo)] hover:text-[var(--color-text-mid)]"
          >
            <Trash2 className="h-3 w-3" aria-hidden />
            Clear
          </button>
        )}
      </div>

      <div
        ref={listRef}
        className="-mr-1 flex flex-1 flex-col gap-2 overflow-y-auto pr-1"
      >
        {messages.length === 0 && !isSending && (
          <div className="flex flex-1 items-center justify-center px-4 text-center text-[11.5px] text-[var(--color-text-lo)]">
            Ask anything — quick notes, ideas, summaries.
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((m, idx) => {
            const isLast = idx === messages.length - 1;
            const isStreaming = isSending && isLast && m.role === "assistant";
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: duration.fast, ease: easing.standard }}
                className={cn(
                  "max-w-[88%] rounded-[var(--radius-md)] px-2.5 py-1.5",
                  "text-[12.5px] leading-[1.5] break-words",
                  m.role === "user"
                    ? "self-end whitespace-pre-wrap bg-[var(--color-accent-soft)] text-[var(--color-text-hi)]"
                    : "self-start bg-[var(--color-bg-base)] text-[var(--color-text-hi)] border border-[var(--color-border)]",
                )}
              >
                {m.role === "assistant" ? (
                  <>
                    {m.content ? (
                      <Markdown text={m.content} />
                    ) : (
                      <span className="inline-flex gap-1 py-0.5">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-text-lo)] [animation-delay:0ms]" />
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-text-lo)] [animation-delay:160ms]" />
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-text-lo)] [animation-delay:320ms]" />
                      </span>
                    )}
                    {isStreaming && m.content && (
                      <span className="ml-0.5 inline-block h-3 w-[2px] translate-y-[2px] animate-pulse bg-[var(--color-accent)]" />
                    )}
                  </>
                ) : (
                  m.content
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {error && (
        <div className="rounded-[var(--radius-sm)] border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] px-2.5 py-1.5 text-[11px] text-[var(--color-danger)]">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-1.5">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isSending ? "Thinking…" : "Message…"}
          disabled={isSending}
          className={cn(
            "flex-1 rounded-[var(--radius-sm)]",
            "border border-[var(--color-border)] bg-[var(--color-bg-base)]",
            "px-2.5 py-1.5 text-[12.5px] text-[var(--color-text-hi)] outline-none",
            "placeholder:text-[var(--color-text-lo)]",
            "focus:border-[var(--color-accent)]",
            "disabled:opacity-60",
          )}
        />
        <button
          type="submit"
          disabled={!input.trim() || isSending}
          aria-label="Send"
          className={cn(
            "rounded-[var(--radius-sm)] px-2.5",
            "bg-[var(--color-accent-soft)] text-[var(--color-accent)]",
            "border border-[oklch(0.68_0.18_270/0.2)]",
            "transition-[background-color] duration-[var(--duration-fast)]",
            "hover:bg-[oklch(0.68_0.18_270/0.18)]",
            "disabled:opacity-40 active:scale-[0.97]",
          )}
        >
          <Send className="h-3.5 w-3.5" aria-hidden />
        </button>
      </form>
    </div>
  );
}

export const AIChatWidget = memo(AIChatWidgetInner);
