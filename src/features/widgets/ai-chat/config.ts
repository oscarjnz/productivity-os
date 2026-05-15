export type AIModel =
  | "claude-haiku-4-5"
  | "claude-sonnet-4-5"
  | "claude-opus-4-5";

export interface AIChatConfig {
  model: AIModel;
  systemPrompt: string;
  maxTokens: number;
}

export const defaultAIChatConfig: AIChatConfig = {
  model: "claude-haiku-4-5",
  systemPrompt: "You are a concise, helpful assistant embedded in a personal productivity dashboard.",
  maxTokens: 1024,
};

export const API_KEY_META_KEY = "ai.anthropic.api_key";
