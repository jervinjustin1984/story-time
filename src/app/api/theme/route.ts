import {
  createChatTextCompletion,
  formatLlmHttpError,
  getMissingApiKeyMessage,
  parseLlmOverridesFromBody,
} from "@/lib/llm";
import { NextResponse } from "next/server";

const THEME_MAX_OUTPUT_TOKENS = 64;

export async function POST(request: Request) {
  try {
    let body: unknown = {};
    const ct = request.headers.get("content-type");
    if (ct?.includes("application/json")) {
      try {
        body = await request.json();
      } catch {
        body = {};
      }
    }

    const llmOverrides = parseLlmOverridesFromBody(body);

    const missingKey = getMissingApiKeyMessage(llmOverrides);
    if (missingKey) {
      return NextResponse.json({ error: missingKey }, { status: 500 });
    }

    const { text: rawTheme } = await createChatTextCompletion(
      {
        system:
          "You suggest short, fun themes for children's stories. Themes should be 1–3 words long.",
        user:
          "Give me one short, fun theme for a kids' story. Examples include: Space Adventure, Silly Dinosaurs, Pirate Treasure, Friendly Dragons, Magical Forest, Brave Princess, Robot Helpers. Reply with just the theme text, nothing else.",
        temperature: 0.9,
        maxOutputTokens: THEME_MAX_OUTPUT_TOKENS,
      },
      llmOverrides,
    );

    const cleaned = rawTheme.replace(/(^["'“”]+|["'“”]+$)/g, "").trim();

    if (!cleaned) {
      throw new Error("No theme returned from model.");
    }

    return NextResponse.json({ theme: cleaned });
  } catch (error) {
    console.error("Error generating theme:", error);

    const baseMessage = "Failed to generate a random theme. Please try again.";
    const { error: message, code, status } = formatLlmHttpError(error, baseMessage);
    return NextResponse.json({ error: message, code }, { status });
  }
}
