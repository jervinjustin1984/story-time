/** Matches `LlmProvider` from `@/lib/llm` — kept separate so client bundles avoid SDK imports. */
export type LlmProviderId = "openai" | "anthropic";

export function llmProviderLabel(provider: LlmProviderId): string {
  return provider === "anthropic" ? "Anthropic" : "OpenAI";
}
