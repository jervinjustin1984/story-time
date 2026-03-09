import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST() {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not set on the server." },
      { status: 500 },
    );
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You suggest short, fun themes for children's stories. Themes should be 1–3 words long.",
        },
        {
          role: "user",
          content:
            "Give me one short, fun theme for a kids' story. Examples include: Space Adventure, Silly Dinosaurs, Pirate Treasure, Friendly Dragons, Magical Forest, Brave Princess, Robot Helpers. Reply with just the theme text, nothing else.",
        },
      ],
      temperature: 0.9,
      max_tokens: 20,
    });

    const rawTheme = completion.choices[0]?.message?.content ?? "";
    const cleaned = rawTheme.replace(/(^["'“”]+|["'“”]+$)/g, "").trim();

    if (!cleaned) {
      throw new Error("No theme returned from model.");
    }

    return NextResponse.json({ theme: cleaned });
  } catch (error) {
    console.error("Error generating theme:", error);
    return NextResponse.json(
      { error: "Failed to generate a random theme. Please try again." },
      { status: 500 },
    );
  }
}

