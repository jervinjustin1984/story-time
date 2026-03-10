"use client";

import { useMemo, useState } from "react";

const DEFAULT_PLACEHOLDER_STORY =
  "Under a silver moon, Mia discovered a tiny glowing door behind her bookshelf. Curious and brave, she stepped through and entered a forest of talking fireflies. Each light whispered a secret wish. Mia listened carefully, promising to guard their dreams and share kindness everywhere she wandered afterward.";

export default function Home() {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [storyLength, setStoryLength] = useState(100);
  const [readingAge, setReadingAge] = useState(3);
  const [currentPage, setCurrentPage] = useState(0);
  const [maxWordsPerPage, setMaxWordsPerPage] = useState(10);
  const [theme, setTheme] = useState("");
  const [specifics, setSpecifics] = useState("");
  const [repeatWords, setRepeatWords] = useState("");
  const [storyText, setStoryText] = useState<string>(DEFAULT_PLACEHOLDER_STORY);
  const [storyTitle, setStoryTitle] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isThemeGenerating, setIsThemeGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const words = useMemo(
    () => (storyText ? storyText.trim().split(/\s+/) : []),
    [storyText],
  );

  const pages = useMemo(() => {
    if (words.length === 0) {
      return [[]] as string[][];
    }

    const maxWords = Math.max(5, Math.min(20, maxWordsPerPage));

    const sentenceEndFlags = words.map((word) =>
      /[.!?]["')\]]*$/.test(word),
    );

    const result: string[][] = [];
    let index = 0;

    while (index < words.length) {
      const remaining = words.length - index;
      const windowSize = Math.min(maxWords, remaining);
      let end = index + windowSize; // exclusive

      let breakAt = -1;
      for (let i = end - 1; i > index; i -= 1) {
        if (sentenceEndFlags[i]) {
          breakAt = i + 1;
          break;
        }
      }

      if (breakAt === -1) {
        breakAt = end;
      }

      result.push(words.slice(index, breakAt));
      index = breakAt;
    }

    return result;
  }, [words, maxWordsPerPage]);

  const totalPages = Math.max(1, 1 + pages.length + 1);

  const currentPageWordList = useMemo(() => {
    if (currentPage === 0 || currentPage === totalPages - 1) {
      return [];
    }
    const storyPageIndex = currentPage - 1;
    return pages[storyPageIndex] ?? [];
  }, [pages, currentPage, totalPages]);

  const currentPageLines = useMemo(() => {
    if (currentPageWordList.length === 0) {
      return [""];
    }

    if (currentPageWordList.length <= 3) {
      return [currentPageWordList.join(" ")];
    }

    const lines: string[] = [];
    const chunkSize = 3;

    for (let i = 0; i < currentPageWordList.length; i += chunkSize) {
      lines.push(currentPageWordList.slice(i, i + chunkSize).join(" "));
    }

    return lines;
  }, [currentPageWordList]);

  const goToPage = (page: number) => {
    const nextPage = Math.min(Math.max(page, 0), totalPages - 1);
    setCurrentPage(nextPage);
  };

  const handleNext = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage((p) => p + 1);
    }
  };

  const handlePrevious = () => {
    if (currentPage > 0) {
      setCurrentPage((p) => p - 1);
    }
  };

  const handleStartOver = () => {
    goToPage(0);
  };

  const handleGenerateStory = async (closePanel?: boolean) => {
    try {
      setIsGenerating(true);
      setError(null);

      const response = await fetch("/api/story", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          storyLength,
          readingAge,
          theme,
          specifics,
          repeatWords,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to generate story.");
      }

      const data: { story: string; title?: string } = await response.json();

      if (!data.story || typeof data.story !== "string") {
        throw new Error("Story text was missing from the response.");
      }

      setStoryText(data.story);
      setStoryTitle(typeof data.title === "string" ? data.title.trim() : "");
      goToPage(0);

      if (closePanel) {
        setIsConfigOpen(false);
      }
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while generating the story.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRandomTheme = async () => {
    try {
      setIsThemeGenerating(true);
      setError(null);

      const response = await fetch("/api/theme", {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to generate a theme.");
      }

      const data: { theme: string } = await response.json();

      if (!data.theme || typeof data.theme !== "string") {
        throw new Error("Theme was missing from the response.");
      }

      setTheme(data.theme);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while generating a theme.",
      );
    } finally {
      setIsThemeGenerating(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-sky-50 to-indigo-100">
      {/* Desktop sidebar */}
      <aside className="hidden w-72 border-r border-indigo-100 bg-white/80 px-6 py-8 shadow-sm backdrop-blur md:block">
        <h2 className="text-2xl font-semibold text-indigo-900 md:text-3xl">
          Story Generator
        </h2>
        <p className="mt-1 text-base text-indigo-500">
          Set up a new story for your reader.
        </p>

        <div className="mt-8 space-y-6">
          <div>
            <label className="flex items-center justify-between text-base font-medium text-slate-700">
              <span>Story length</span>
              <span className="text-sm text-slate-500">{storyLength} words</span>
            </label>
            <input
              type="range"
              min={20}
              max={200}
              step={10}
              value={storyLength}
              onChange={(e) => {
                setStoryLength(Number(e.target.value));
                goToPage(0);
              }}
              className="mt-2 w-full accent-indigo-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-base font-medium text-slate-700">
              Reading age
            </label>
            <select
              value={readingAge}
              onChange={(e) => setReadingAge(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              <option value={3}>3 years</option>
              <option value={4}>4–5 years</option>
              <option value={6}>6–7 years</option>
              <option value={8}>8–9 years</option>
              <option value={10}>10+ years</option>
            </select>
            <p className="mt-1 text-sm text-slate-500">
              This will help tailor future stories.
            </p>
          </div>

          <div className="h-px w-full bg-indigo-50" />

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-indigo-400">
                Optional settings
              </h3>
            </div>

            <div>
              <label className="mb-1 block text-base font-medium text-slate-700">
                Theme (optional)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  placeholder='e.g., "space", "underwater", "jungle"'
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
                <button
                  type="button"
                  onClick={handleRandomTheme}
                  disabled={isThemeGenerating}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-indigo-200 bg-indigo-50 text-indigo-700 shadow-sm hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
                  title="Surprise me with a theme"
                >
                  <span className="sr-only">Generate random theme</span>
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M6 7h3V4"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M7 4a7 7 0 0 1 7-1.5 7 7 0 0 1 4 3.5"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M18 17h-3v3"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M17 20a7 7 0 0 1-7 1.5A7 7 0 0 1 6 18"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
              {isThemeGenerating && (
                <p className="mt-1 text-[11px] text-indigo-500">
                  Finding a fun theme...
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-base font-medium text-slate-700">
                Specific things to include (optional)
              </label>
              <textarea
                value={specifics}
                onChange={(e) => setSpecifics(e.target.value)}
                rows={3}
                placeholder='e.g., "I want to include a polar bear named Pablo"'
                className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            <div>
              <label className="mb-1 block text-base font-medium text-slate-700">
                Specific words to repeat or rhyme (optional)
              </label>
              <input
                type="text"
                value={repeatWords}
                onChange={(e) => setRepeatWords(e.target.value)}
                placeholder='e.g., "cook, book, took"'
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleGenerateStory()}
            disabled={isGenerating}
            className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            {isGenerating ? "Generating..." : "Generate Story"}
          </button>

          {error && (
            <p className="mt-2 text-xs text-rose-500">
              {error}
            </p>
          )}
        </div>
      </aside>

      {/* Main content - full screen book */}
      <div className="flex min-h-screen flex-1 flex-col">
        {/* Mobile/overlay config panel */}
        {isConfigOpen && (
          <>
            <div
              className="fixed inset-0 z-30 bg-black/20 backdrop-blur-[1px] md:hidden"
              onClick={() => setIsConfigOpen(false)}
            />
            <div className="fixed inset-0 z-40 w-full bg-white/95 px-5 pb-6 pt-4 shadow-xl md:hidden">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-indigo-900">
                  Story Generator
                </h2>
                <button
                  type="button"
                  aria-label="Close story settings"
                  onClick={() => setIsConfigOpen(false)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
                >
                  <span className="sr-only">Close</span>
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M6 6L18 18M6 18L18 6"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>

              <div className="mt-2 flex h-[calc(100%-2.5rem)] flex-col gap-2.5 overflow-y-auto pb-2">
                <div className="space-y-2.5">
                  <div>
                    <label className="flex items-center justify-between text-base font-medium text-slate-700">
                      <span>Story length</span>
                      <span className="text-sm text-slate-500">
                        {storyLength} words
                      </span>
                    </label>
                    <input
                      type="range"
                      min={20}
                      max={200}
                      step={10}
                      value={storyLength}
                      onChange={(e) => {
                        setStoryLength(Number(e.target.value));
                        goToPage(0);
                      }}
                      className="mt-1 w-full accent-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-base font-medium text-slate-700">
                      Reading age
                    </label>
                    <select
                      value={readingAge}
                      onChange={(e) => setReadingAge(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-base text-slate-800 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    >
                      <option value={3}>3 years</option>
                      <option value={4}>4–5 years</option>
                      <option value={6}>6–7 years</option>
                      <option value={8}>8–9 years</option>
                      <option value={10}>10+ years</option>
                    </select>
                  </div>
                </div>

                <div className="h-px w-full bg-indigo-50" />

                <div className="space-y-2.5">
                  <div>
                    <h3 className="text-base font-semibold uppercase tracking-wide text-indigo-400">
                      Optional settings
                    </h3>
                  </div>

                  <div>
                    <label className="mb-1 block text-base font-medium text-slate-700">
                      Theme (optional)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={theme}
                        onChange={(e) => setTheme(e.target.value)}
                        placeholder='e.g., "space", "underwater", "jungle"'
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-base text-slate-800 shadow-sm placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                      />
                      <button
                        type="button"
                        onClick={handleRandomTheme}
                        disabled={isThemeGenerating}
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-indigo-200 bg-indigo-50 text-indigo-700 shadow-sm hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
                        title="Surprise me with a theme"
                      >
                        <span className="sr-only">Generate random theme</span>
                        <svg
                          className="h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          aria-hidden="true"
                        >
                          <path
                            d="M6 7h3V4"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M7 4a7 7 0 0 1 7-1.5 7 7 0 0 1 4 3.5"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M18 17h-3v3"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M17 20a7 7 0 0 1-7 1.5A7 7 0 0 1 6 18"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                    {isThemeGenerating && (
                      <p className="mt-1 text-sm text-indigo-500">
                        Finding a fun theme...
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-base font-medium text-slate-700">
                      Specific things to include (optional)
                    </label>
                    <textarea
                      value={specifics}
                      onChange={(e) => setSpecifics(e.target.value)}
                      rows={2}
                      placeholder='e.g., "I want to include a polar bear named Pablo"'
                      className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-base text-slate-800 shadow-sm placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-base font-medium text-slate-700">
                      Specific words to repeat or rhyme (optional)
                    </label>
                    <input
                      type="text"
                      value={repeatWords}
                      onChange={(e) => setRepeatWords(e.target.value)}
                      placeholder='e.g., "cook, book, took"'
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-base text-slate-800 shadow-sm placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    handleGenerateStory(true);
                  }}
                  disabled={isGenerating}
                  className="mt-auto inline-flex w-full items-center justify-center rounded-full bg-indigo-600 px-4 py-3 text-base font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                  {isGenerating ? "Generating..." : "Generate Story"}
                </button>

                {error && (
                  <p className="mt-1 text-sm text-rose-500">
                    {error}
                  </p>
                )}
              </div>
            </div>
          </>
        )}

        {/* Book - full screen */}
        <main
          className="relative flex min-h-screen flex-1 flex-col bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/paper-bg.png')" }}
        >
          <section className="relative flex min-h-screen flex-1 flex-col">
            {/* Left / Right nav - vertically centered on edges */}
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentPage === 0}
              aria-label="Previous page"
              className="absolute left-0 top-1/2 z-10 flex h-14 w-12 -translate-y-1/2 items-center justify-center rounded-r-lg bg-slate-100/90 text-slate-600 shadow-sm transition hover:bg-slate-200 disabled:pointer-events-none disabled:opacity-40 md:h-16 md:w-14"
            >
              <svg
                className="h-6 w-6 md:h-7 md:w-7"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M15 6L9 12L15 18"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={currentPage >= totalPages - 1}
              aria-label="Next page"
              className="absolute right-0 top-1/2 z-10 flex h-14 w-12 -translate-y-1/2 items-center justify-center rounded-l-lg bg-slate-100/90 text-slate-600 shadow-sm transition hover:bg-slate-200 disabled:pointer-events-none disabled:opacity-40 md:h-16 md:w-14"
            >
              <svg
                className="h-6 w-6 md:h-7 md:w-7"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M9 6L15 12L9 18"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {/* Story content - centered */}
            <div className="flex flex-1 flex-col px-14 py-8 md:px-20 md:py-12">
              <div className="flex flex-1 flex-col items-center justify-center">
                {currentPage === 0 ? (
                  <div className="flex w-full flex-1 flex-col items-center">
                    <div className="flex flex-1 items-center justify-center">
                      <p className="mx-auto max-w-3xl text-center text-2xl font-semibold leading-snug text-indigo-900 sm:text-3xl md:text-[2.5rem] lg:text-[3rem]">
                        {storyTitle || "Your Story"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsConfigOpen(true)}
                      className="mt-auto text-base font-medium text-indigo-600 underline decoration-indigo-400 underline-offset-2 hover:text-indigo-700 hover:decoration-indigo-500"
                    >
                      Start a new story
                    </button>
                  </div>
                ) : currentPage === totalPages - 1 ? (
                  <div className="flex flex-col items-center gap-6">
                    <p className="mx-auto max-w-3xl text-center text-2xl font-semibold italic text-slate-600 sm:text-3xl md:text-[2.5rem] lg:text-[3rem]">
                      The End
                    </p>
                    <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                      <button
                        type="button"
                        onClick={handleStartOver}
                        className="text-base font-medium text-indigo-600 underline decoration-indigo-400 underline-offset-2 hover:text-indigo-700 hover:decoration-indigo-500"
                      >
                        Start Over
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsConfigOpen(true)}
                        className="text-base font-medium text-indigo-600 underline decoration-indigo-400 underline-offset-2 hover:text-indigo-700 hover:decoration-indigo-500"
                      >
                        Start a new story
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="mx-auto max-w-3xl text-center text-2xl leading-relaxed text-slate-900 sm:text-3xl md:text-[2.5rem] md:leading-snug lg:text-[3rem] lg:leading-snug">
                    {currentPageLines.map((line, index) => (
                      <span key={index}>
                        {line}
                        {index < currentPageLines.length - 1 && <br />}
                      </span>
                    ))}
                  </p>
                )}
              </div>

              {/* Footer: page counter + max words per page */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
                <span className="text-sm font-medium text-slate-500">
                  Page {currentPage + 1} of {totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-600">
                    Max words per page
                  </span>
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                    {maxWordsPerPage}
                  </span>
                  <input
                    type="range"
                    min={5}
                    max={20}
                    step={1}
                    value={maxWordsPerPage}
                    onChange={(e) => {
                      setMaxWordsPerPage(Number(e.target.value));
                      goToPage(0);
                    }}
                    className="w-24 accent-indigo-500 md:w-28"
                  />
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
