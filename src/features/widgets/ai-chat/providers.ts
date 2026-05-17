/**
 * Multi-provider registry. Two wire formats cover the whole ecosystem:
 *   - "anthropic" : Claude's native /v1/messages + its SSE event shape
 *   - "openai"    : the OpenAI /chat/completions format, spoken by OpenAI,
 *                   DeepSeek, Gemini (OpenAI-compat endpoint), Groq, xAI,
 *                   Mistral, OpenRouter, Ollama, LM Studio, and most others.
 *
 * Keys are BYOK and live only in the browser (Dexie). Calls are client-side.
 */

export type ProviderKind = "anthropic" | "openai";

export interface ProviderDef {
  id: string;
  label: string;
  kind: ProviderKind;
  /** Default API base (no trailing slash). User can override when editable. */
  defaultBaseUrl: string;
  /** Suggested models — the model field is free-text so anything works. */
  models: string[];
  /** Whether an API key is required (Ollama/local typically isn't). */
  requiresKey: boolean;
  /** Show an editable Base URL field (Ollama, OpenRouter, self-hosted). */
  editableBaseUrl: boolean;
  /** Where to get the key. */
  docsUrl: string;
  /**
   * Shipped key so the product works out of the box for everyone with zero
   * setup. A user-entered key (Dexie) always overrides this. Shared/public
   * by design — subject to rate limits on the shared quota.
   */
  builtInKey?: string;
}

export const PROVIDERS: ProviderDef[] = [
  {
    id: "groq",
    label: "Groq · incluido (sin clave)",
    kind: "openai",
    defaultBaseUrl: "https://api.groq.com/openai/v1",
    models: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"],
    requiresKey: true,
    editableBaseUrl: false,
    docsUrl: "https://console.groq.com/keys",
    // Injected at build time (next inlines NEXT_PUBLIC_* into the bundle).
    // Keeps the literal key out of the repo while still shipping zero-setup
    // Groq to every user. Set it in .env.local BEFORE `npm run build`.
    builtInKey: process.env.NEXT_PUBLIC_GROQ_BUILTIN_KEY || undefined,
  },
  {
    id: "anthropic",
    label: "Anthropic (Claude)",
    kind: "anthropic",
    defaultBaseUrl: "https://api.anthropic.com/v1",
    models: ["claude-opus-4-5", "claude-sonnet-4-5", "claude-haiku-4-5"],
    requiresKey: true,
    editableBaseUrl: false,
    docsUrl: "https://console.anthropic.com/settings/keys",
  },
  {
    id: "openai",
    label: "OpenAI (ChatGPT)",
    kind: "openai",
    defaultBaseUrl: "https://api.openai.com/v1",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4.1", "gpt-4.1-mini", "o3", "o3-mini"],
    requiresKey: true,
    editableBaseUrl: false,
    docsUrl: "https://platform.openai.com/api-keys",
  },
  {
    id: "gemini",
    label: "Google Gemini",
    kind: "openai",
    defaultBaseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    models: ["gemini-2.0-flash", "gemini-2.0-pro", "gemini-1.5-pro", "gemini-1.5-flash"],
    requiresKey: true,
    editableBaseUrl: false,
    docsUrl: "https://aistudio.google.com/apikey",
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    kind: "openai",
    defaultBaseUrl: "https://api.deepseek.com/v1",
    models: ["deepseek-chat", "deepseek-reasoner"],
    requiresKey: true,
    editableBaseUrl: false,
    docsUrl: "https://platform.deepseek.com/api_keys",
  },
  {
    id: "xai",
    label: "xAI (Grok)",
    kind: "openai",
    defaultBaseUrl: "https://api.x.ai/v1",
    models: ["grok-2-latest", "grok-2-vision-latest", "grok-beta"],
    requiresKey: true,
    editableBaseUrl: false,
    docsUrl: "https://console.x.ai",
  },
  {
    id: "mistral",
    label: "Mistral",
    kind: "openai",
    defaultBaseUrl: "https://api.mistral.ai/v1",
    models: ["mistral-large-latest", "mistral-small-latest", "codestral-latest"],
    requiresKey: true,
    editableBaseUrl: false,
    docsUrl: "https://console.mistral.ai/api-keys",
  },
  {
    id: "openrouter",
    label: "OpenRouter (multi)",
    kind: "openai",
    defaultBaseUrl: "https://openrouter.ai/api/v1",
    models: [
      "anthropic/claude-3.5-sonnet",
      "openai/gpt-4o",
      "google/gemini-2.0-flash-exp",
      "meta-llama/llama-3.3-70b-instruct",
      "deepseek/deepseek-chat",
    ],
    requiresKey: true,
    editableBaseUrl: true,
    docsUrl: "https://openrouter.ai/keys",
  },
  {
    id: "ollama",
    label: "Ollama (local)",
    kind: "openai",
    defaultBaseUrl: "http://localhost:11434/v1",
    models: ["llama3.2", "qwen2.5", "mistral", "phi4", "gemma2"],
    requiresKey: false,
    editableBaseUrl: true,
    docsUrl: "https://ollama.com/download",
  },
];

export function getProvider(id: string): ProviderDef {
  return PROVIDERS.find((p) => p.id === id) ?? PROVIDERS[0]!;
}

export function apiKeyMetaKey(providerId: string): string {
  return `ai.key.${providerId}`;
}

/**
 * The key actually used for a request: a user-entered key always wins;
 * otherwise fall back to the provider's shipped built-in key (Groq).
 */
export function effectiveKey(provider: ProviderDef, userKey: string | null): string | null {
  return (userKey && userKey.trim()) || provider.builtInKey || null;
}
