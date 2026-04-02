import Anthropic, { APIError as AnthropicAPIError } from "@anthropic-ai/sdk";
import OpenAI, { APIError as OpenAIAPIError } from "openai";

export type LlmProvider = "openai" | "anthropic";

const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";
/** Claude 3.5 Haiku IDs were retired (~Feb 2026); Haiku 4.5 is the current fast/cheap line. */
const DEFAULT_ANTHROPIC_MODEL = "claude-haiku-4-5";
const STORY_MAX_OUTPUT_TOKENS = 4096;

/**
 * Read env at runtime via bracket access so Next.js does not inline `undefined`
 * for missing keys at build time (which breaks when keys exist only at runtime).
 */
function serverEnv(key: string): string | undefined {
  if (typeof globalThis.process === "undefined") return undefined;
  const v = globalThis.process.env?.[key];
  if (v == null || typeof v !== "string") return undefined;
  const t = v.trim();
  return t || undefined;
}

/**
 * Anthropic’s SDK posts to `/v1/messages` on top of this host.
 * If `ANTHROPIC_BASE_URL` already ends with `/v1`, requests become `/v1/v1/messages` and the API returns `not_found_error`.
 */
function resolvedAnthropicBaseURL(): string | undefined {
  const raw = serverEnv("ANTHROPIC_BASE_URL");
  if (!raw) return undefined;
  let base = raw.replace(/\/+$/, "");
  while (base.endsWith("/v1")) {
    base = base.slice(0, -3);
  }
  return base || undefined;
}

export function getLlmProvider(): LlmProvider {
  const raw = serverEnv("LLM_PROVIDER")?.toLowerCase();
  if (raw === "anthropic" || raw === "claude") {
    return "anthropic";
  }
  return "openai";
}

/** Allowed model id shape for request overrides (alphanumeric, dot, dash, underscore). */
const MODEL_ID_SAFE = /^[a-zA-Z0-9._-]{1,128}$/;

export function isSafeModelId(s: string): boolean {
  return MODEL_ID_SAFE.test(s);
}

export type LlmCallOverrides = {
  provider?: LlmProvider;
  openaiModel?: string;
  anthropicModel?: string;
};

export function parseLlmOverridesFromBody(body: unknown): LlmCallOverrides {
  if (!body || typeof body !== "object") return {};
  const o = body as Record<string, unknown>;
  const out: LlmCallOverrides = {};
  const rawP = o.llmProvider;
  const p = typeof rawP === "string" ? rawP.trim().toLowerCase() : "";
  if (p === "openai") {
    out.provider = "openai";
  } else if (p === "anthropic" || p === "claude") {
    out.provider = "anthropic";
  }
  if (typeof o.openaiModel === "string") {
    const t = o.openaiModel.trim();
    if (t && isSafeModelId(t)) out.openaiModel = t;
  }
  if (typeof o.anthropicModel === "string") {
    const t = o.anthropicModel.trim();
    if (t && isSafeModelId(t)) out.anthropicModel = t;
  }
  return out;
}

function resolvedProvider(overrides?: LlmCallOverrides): LlmProvider {
  return overrides?.provider ?? getLlmProvider();
}

/** Server-only: returns an error message if the active provider’s API key is missing. */
export function getMissingApiKeyMessage(overrides?: LlmCallOverrides): string | null {
  const p = resolvedProvider(overrides);
  if (p === "openai" && !serverEnv("OPENAI_API_KEY")) {
    return "OPENAI_API_KEY is not set on the server.";
  }
  if (p === "anthropic" && !serverEnv("ANTHROPIC_API_KEY")) {
    return "ANTHROPIC_API_KEY is not set on the server.";
  }
  return null;
}

export type ChatCompletionParams = {
  system: string;
  user: string;
  temperature?: number;
  /** OpenAI: maps to max_tokens. Anthropic: required; maps to max_tokens. */
  maxOutputTokens?: number;
};

function openaiAssistantText(
  message: OpenAI.Chat.Completions.ChatCompletionMessage | undefined,
): string {
  const c = message?.content;
  return typeof c === "string" ? c : "";
}

function anthropicTextFromMessage(
  msg: Anthropic.Messages.Message | undefined,
): string {
  if (!msg?.content) return "";
  return msg.content
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("");
}

/**
 * Single user turn + system prompt; returns assistant text (trimmed).
 */
export async function createChatTextCompletion(
  params: ChatCompletionParams,
  overrides?: LlmCallOverrides,
): Promise<string> {
  const temperature = params.temperature ?? 0.9;
  const provider = resolvedProvider(overrides);

  if (provider === "openai") {
    const openai = new OpenAI({ apiKey: serverEnv("OPENAI_API_KEY") });
    const model =
      (overrides?.openaiModel && isSafeModelId(overrides.openaiModel)
        ? overrides.openaiModel
        : undefined) ??
      serverEnv("OPENAI_MODEL") ??
      DEFAULT_OPENAI_MODEL;
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: params.system },
        { role: "user", content: params.user },
      ],
      temperature,
      ...(params.maxOutputTokens != null
        ? { max_tokens: params.maxOutputTokens }
        : {}),
    });
    return openaiAssistantText(completion.choices[0]?.message).trim();
  }

  const anthropicBase = resolvedAnthropicBaseURL();
  const anthropic = new Anthropic({
    apiKey: serverEnv("ANTHROPIC_API_KEY"),
    ...(anthropicBase ? { baseURL: anthropicBase } : {}),
  });
  const model =
    (overrides?.anthropicModel && isSafeModelId(overrides.anthropicModel)
      ? overrides.anthropicModel
      : undefined) ??
    serverEnv("ANTHROPIC_MODEL") ??
    DEFAULT_ANTHROPIC_MODEL;
  const maxOutputTokens = params.maxOutputTokens ?? STORY_MAX_OUTPUT_TOKENS;

  const msg = await anthropic.messages.create({
    model,
    max_tokens: maxOutputTokens,
    system: params.system,
    messages: [{ role: "user", content: params.user }],
    temperature,
  });

  return anthropicTextFromMessage(msg).trim();
}

export function formatLlmHttpError(
  error: unknown,
  baseMessage: string,
): { error: string; code?: string; status: number } {
  if (error instanceof OpenAIAPIError) {
    const code = error.code ?? error.type;
    const message = code ? `${baseMessage} (${code})` : baseMessage;
    const status = typeof error.status === "number" ? error.status : 500;
    return { error: message, code: code ?? undefined, status };
  }
  if (error instanceof AnthropicAPIError) {
    const code = error.type ?? undefined;
    const nested = (() => {
      const body = error.error as Record<string, unknown> | undefined;
      const inner = body?.error as Record<string, unknown> | undefined;
      const msg = inner?.message;
      return typeof msg === "string" && msg.trim() ? msg.trim() : undefined;
    })();

    let message = code ? `${baseMessage} (${code})` : baseMessage;
    if (nested) {
      message = `${message}: ${nested}`;
    }

    if (code === "not_found_error" && !nested) {
      message = `${message} — Check ANTHROPIC_BASE_URL is only the host (e.g. https://api.anthropic.com), not …/v1. Use an API key from the Anthropic Console.`;
    }

    const status = typeof error.status === "number" ? error.status : 500;
    return { error: message, code: code ?? undefined, status };
  }
  return { error: baseMessage, status: 500 };
}
