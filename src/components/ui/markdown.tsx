"use client";

import { memo, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Minimal markdown renderer — covers the 90% of chat content:
 *   - fenced code blocks ``` (with optional language)
 *   - inline code `code`
 *   - **bold** and *italic*
 *   - [link](url)
 *   - paragraphs (blank-line separated)
 *
 * No tables, no headings, no lists yet. Keep it tight; chat doesn't need more.
 */
function MarkdownInner({ text }: { text: string }) {
  // Split fenced code blocks first — anything outside gets inline-parsed.
  const segments = text.split(/```(\w*\n)?([\s\S]*?)```/g);
  const out: ReactNode[] = [];

  for (let i = 0; i < segments.length; i += 3) {
    const before = segments[i];
    const lang = segments[i + 1];
    const code = segments[i + 2];

    if (before) out.push(<TextBlock key={`p${i}`} text={before} />);
    if (code !== undefined) {
      out.push(<CodeBlock key={`c${i}`} lang={(lang ?? "").trim()} code={code} />);
    }
  }

  return <div className="flex flex-col gap-2">{out}</div>;
}

export const Markdown = memo(MarkdownInner);

function CodeBlock({ lang, code }: { lang: string; code: string }) {
  return (
    <pre
      className={cn(
        "relative overflow-x-auto rounded-[var(--radius-sm)]",
        "border border-[var(--color-border)] bg-[var(--color-bg-base)]",
        "px-2.5 py-2",
        "font-mono text-[11.5px] leading-[1.5]",
        "text-[var(--color-text-hi)]",
      )}
    >
      {lang && (
        <span className="absolute right-2 top-1.5 text-[9px] uppercase tracking-[0.06em] text-[var(--color-text-lo)]">
          {lang}
        </span>
      )}
      <code>{code.replace(/\n$/, "")}</code>
    </pre>
  );
}

function TextBlock({ text }: { text: string }) {
  // Paragraphs split on blank lines. Each para gets inline parsing.
  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  if (paragraphs.length === 0) return null;

  return (
    <>
      {paragraphs.map((p, idx) => (
        <p key={idx} className="whitespace-pre-wrap break-words">
          {parseInline(p)}
        </p>
      ))}
    </>
  );
}

// Token regex: bold | italic | inline-code | link — first match wins.
const INLINE_TOKEN = /(\*\*[^*\n]+?\*\*)|(\*[^*\n]+?\*)|(`[^`\n]+?`)|(\[[^\]\n]+?\]\([^)\s]+?\))/g;

function parseInline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  INLINE_TOKEN.lastIndex = 0;

  while ((m = INLINE_TOKEN.exec(text)) !== null) {
    if (m.index > lastIndex) out.push(text.slice(lastIndex, m.index));
    const token = m[0];
    const key = `${m.index}`;

    if (token.startsWith("**")) {
      out.push(
        <strong key={key} className="font-semibold text-[var(--color-text-hi)]">
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (token.startsWith("*")) {
      out.push(<em key={key}>{token.slice(1, -1)}</em>);
    } else if (token.startsWith("`")) {
      out.push(
        <code
          key={key}
          className="rounded-[3px] bg-[var(--color-bg-base)] border border-[var(--color-border)] px-1 py-[1px] font-mono text-[11px]"
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith("[")) {
      const lm = /\[([^\]]+)\]\(([^)\s]+)\)/.exec(token);
      if (lm) {
        out.push(
          <a
            key={key}
            href={lm[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-accent)] underline-offset-2 hover:underline"
          >
            {lm[1]}
          </a>,
        );
      } else {
        out.push(token);
      }
    }

    lastIndex = m.index + token.length;
  }

  if (lastIndex < text.length) out.push(text.slice(lastIndex));
  return out;
}
