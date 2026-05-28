"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Send, Sparkles, Trash2, Key, Lock, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useApiKey } from "./use-api-key";
import { useChatMessages, useChat } from "./use-chat";
import { resolveAIChatConfig } from "./config";
import { getProvider, effectiveKey, type ProviderDef } from "./providers";
import { Markdown } from "@/components/ui/markdown";
import { cn } from "@/lib/utils/cn";
import { duration, easing } from "@/config/motion";
import type { WidgetProps } from "@/types/widget.types";
import type { AIChatConfig } from "./config";

function ApiKeyGate({
  provider,
  onSave,
}: {
  provider: ProviderDef;
  onSave: (k: string) => void;
}) {
  const [val, setVal] = useState("");
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
        <Key className="h-4 w-4" aria-hidden />
      </div>
      <div className="flex flex-col gap-1">
        <div className="text-[13px] font-medium text-[var(--color-text-hi)]">
          {provider.label} API key
        </div>
        <div className="text-[11.5px] leading-snug text-[var(--color-text-lo)]">
          Se queda en tu navegador. Nunca se envía a Supabase ni a ningún
          servidor.
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
          placeholder="Pega tu clave…"
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
            "border border-[var(--color-accent-border)]",
            "text-[12.5px] font-medium",
            "transition-[background-color,transform] duration-[var(--duration-fast)]",
            "[transition-timing-function:var(--ease-standard)]",
            "hover:bg-[var(--color-accent-soft-hi)]",
            "disabled:opacity-40 active:scale-[0.98]",
          )}
        >
          Guardar clave
        </button>
      </form>
      <a
        href={provider.docsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-[10.5px] text-[var(--color-accent)] hover:underline"
      >
        Conseguir una clave de {provider.label}
        <ExternalLink className="h-2.5 w-2.5" aria-hidden />
      </a>
      <div className="flex items-center gap-1 text-[10px] text-[var(--color-text-lo)]">
        <Lock className="h-2.5 w-2.5" aria-hidden />
        Solo en IndexedDB
      </div>
    </div>
  );
}

function AIChatWidgetInner({ instanceId, config }: WidgetProps<AIChatConfig>) {
  const cfg = useMemo(() => resolveAIChatConfig(config), [config]);
  const provider = useMemo(() => getProvider(cfg.provider), [cfg.provider]);
  const { apiKey, setApiKey } = useApiKey(cfg.provider);
  // User key overrides; otherwise the provider's built-in key (Groq) is used.
  const usableKey = useMemo(() => effectiveKey(provider, apiKey), [provider, apiKey]);
  const messages = useChatMessages(instanceId);
  const { send, clear, isSending, error } = useChat(instanceId, cfg, usableKey);
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

  if (provider.requiresKey && !usableKey) {
    return <ApiKeyGate provider={provider} onSave={(k) => void setApiKey(k)} />;
  }

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.08em] text-[var(--color-text-lo)]">
          <Sparkles className="h-3 w-3" aria-hidden />
          <span className="font-semibold text-[var(--color-text-mid)]">APPI</span>
          <span className="truncate max-w-[140px] normal-case opacity-60">· {cfg.model}</span>
        </span>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={() => void clear()}
            className="inline-flex items-center gap-1 text-[11px] text-[var(--color-text-lo)] hover:text-[var(--color-text-mid)]"
          >
            <Trash2 className="h-3 w-3" aria-hidden />
            Limpiar
          </button>
        )}
      </div>

      <div
        ref={listRef}
        className="-mr-1 flex flex-1 flex-col gap-2 overflow-y-auto pr-1"
      >
        {messages.length === 0 && !isSending && (
          <div className="flex flex-1 flex-col items-center justify-center gap-1 px-4 text-center">
            <div className="text-[12.5px] text-[var(--color-text-mid)]">
              Hola, soy APPI.
            </div>
            <div className="text-[11px] leading-snug text-[var(--color-text-lo)]">
              Tu asistente integrado: tareas, agenda, correo, Spotify, clima y
              cripto en un solo lugar. También puedo solo platicar.
            </div>
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
                    ? cn(
                        "self-end whitespace-pre-wrap",
                        "bg-[var(--color-accent-soft)] text-[var(--color-text-hi)]",
                        "border border-[var(--color-accent-border)]",
                      )
                    : cn(
                        "self-start",
                        "bg-[var(--color-bg-raised)] text-[var(--color-text-hi)]",
                        "border border-[var(--color-border)]",
                        "shadow-[inset_0_1px_0_oklch(1_0_0_/_0.03)]",
                      ),
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
          placeholder={isSending ? "APPI está pensando…" : "Escribe a APPI…"}
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
            "border border-[var(--color-accent-border)]",
            "transition-[background-color,transform] duration-[var(--duration-fast)]",
            "[transition-timing-function:var(--ease-standard)]",
            "hover:bg-[var(--color-accent-soft-hi)]",
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
