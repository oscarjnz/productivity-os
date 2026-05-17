export interface AIChatConfig {
  /** Provider id from PROVIDERS (groq, anthropic, openai, gemini, …). */
  provider: string;
  /** Free-text model id — anything the provider accepts. */
  model: string;
  /** Optional base URL override (Ollama / OpenRouter / self-hosted). */
  baseUrl: string;
  systemPrompt: string;
  maxTokens: number;
}

export const DEFAULT_SYSTEM_PROMPT =
  "Eres un asistente integrado en un panel de productividad personal. " +
  "Respondes por defecto en español (y en el idioma del usuario si escribe en otro). " +
  "Eres claro, directo y conciso: vas al grano, sin relleno ni rodeos. " +
  "Usas formato Markdown cuando ayuda a la lectura (listas, negritas, bloques de código). " +
  "Si no sabes algo o no estás seguro, lo dices con honestidad en lugar de inventar. " +
  "Mantienes un tono cercano pero profesional, y priorizas respuestas accionables.";

export const defaultAIChatConfig: AIChatConfig = {
  provider: "groq",
  model: "llama-3.3-70b-versatile",
  baseUrl: "",
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  maxTokens: 1024,
};

/**
 * Back-compat for older instances:
 *  - explicit provider wins
 *  - a legacy "claude-*" model with no provider → Anthropic (don't break it)
 *  - otherwise default to the built-in Groq
 */
export function resolveAIChatConfig(c: Partial<AIChatConfig>): AIChatConfig {
  const looksClaude = !c.provider && (c.model ?? "").startsWith("claude");
  const provider = c.provider ?? (looksClaude ? "anthropic" : "groq");
  const model =
    c.model ?? (provider === "anthropic" ? "claude-haiku-4-5" : defaultAIChatConfig.model);
  return {
    provider,
    model,
    baseUrl: c.baseUrl ?? "",
    systemPrompt: c.systemPrompt ?? DEFAULT_SYSTEM_PROMPT,
    maxTokens: c.maxTokens ?? defaultAIChatConfig.maxTokens,
  };
}
