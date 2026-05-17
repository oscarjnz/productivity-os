export interface AIChatConfig {
  /** Provider id from PROVIDERS (anthropic, openai, gemini, ollama, …). */
  provider: string;
  /** Free-text model id — anything the provider accepts. */
  model: string;
  /** Optional base URL override (Ollama / OpenRouter / self-hosted). */
  baseUrl: string;
  systemPrompt: string;
  maxTokens: number;
}

export const defaultAIChatConfig: AIChatConfig = {
  provider: "anthropic",
  model: "claude-haiku-4-5",
  baseUrl: "",
  systemPrompt:
    "You are a concise, helpful assistant embedded in a personal productivity dashboard.",
  maxTokens: 1024,
};

/**
 * Back-compat: v1 widgets stored only { model, systemPrompt, maxTokens }.
 * Fill in provider/baseUrl so old instances keep working.
 */
export function resolveAIChatConfig(c: Partial<AIChatConfig>): AIChatConfig {
  return {
    provider: c.provider ?? "anthropic",
    model: c.model ?? defaultAIChatConfig.model,
    baseUrl: c.baseUrl ?? "",
    systemPrompt: c.systemPrompt ?? defaultAIChatConfig.systemPrompt,
    maxTokens: c.maxTokens ?? defaultAIChatConfig.maxTokens,
  };
}
