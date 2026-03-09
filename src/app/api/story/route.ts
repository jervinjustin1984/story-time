import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not set on the server." },
      { status: 500 },
    );
  }

  try {
    const body = await request.json();
    const {
      storyLength,
      readingAge,
      theme,
      specifics,
      repeatWords,
    }: {
      storyLength: number;
      readingAge: number;
      theme?: string;
      specifics?: string;
      repeatWords?: string;
    } = body;

    const safeStoryLength = Math.max(10, Math.min(200, Number(storyLength) || 100));
    const safeReadingAge = Math.max(3, Math.min(12, Number(readingAge) || 6));

    const promptParts = [
      `Write a warm, engaging children's story for a child around ${safeReadingAge} years old.`,
      `The story should be about ${safeStoryLength} words long.`,
    ];

    if (theme && theme.trim()) {
      promptParts.push(`Theme: ${theme.trim()}.`);
    }

    if (specifics && specifics.trim()) {
      promptParts.push(`Include these specific details: ${specifics.trim()}.`);
    }

    if (repeatWords && repeatWords.trim()) {
      promptParts.push(
        `Try to repeat or rhyme with these focus words throughout the story: ${repeatWords.trim()}.`,
      );
    }

    promptParts.push(
      "Use simple, age-appropriate language and short sentences.",
      "Return only the story text, no introductions, no bullet points, and no closing commentary.",
    );

    const prompt = promptParts.join(" ");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a friendly children's author who writes short, gentle stories for kids. Focus on kindness, curiosity, and safety.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.9,
    });

    const story =
      completion.choices[0]?.message?.content?.trim() ??
      "Once upon a time, something went wrong and the story could not be generated.";

    return NextResponse.json({ story });
  } catch (error) {
    console.error("Error generating story:", error);
    return NextResponse.json(
      {
        error: "Failed to generate story. Please try again.",
      },
      { status: 500 },
    );
  }
}

