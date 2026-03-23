"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Shuffle } from "lucide-react";

const READING_AGE_OPTIONS = [
  { value: 3, label: "3 years" },
  { value: 4, label: "4–5 years" },
  { value: 6, label: "6–7 years" },
  { value: 8, label: "8–9 years" },
  { value: 10, label: "10+ years" },
] as const;

const LOADING_MESSAGES = [
  "Once upon a time…",
  "Writing your adventure…",
  "Gathering the words…",
];

const DEFAULT_PLACEHOLDER_STORY =
  "Under a silver moon, Mia discovered a tiny glowing door behind her bookshelf. Curious and brave, she stepped through and entered a forest of talking fireflies. Each light whispered a secret wish. Mia listened carefully, promising to guard their dreams and share kindness everywhere she wandered afterward.";

export default function Home() {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [storyLength, setStoryLength] = useState(50);
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
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const prevPageRef = useRef(0);

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

  useEffect(() => {
    const inReadingMode =
      currentPage > 0 &&
      currentPage < totalPages - 1 &&
      storyText !== DEFAULT_PLACEHOLDER_STORY;
    if (inReadingMode && prevPageRef.current === 0) {
      setIsSidebarCollapsed(true);
    }
    prevPageRef.current = currentPage;
  }, [currentPage, storyText, totalPages]);

  useEffect(() => {
    if (!isGenerating) return;
    const interval = setInterval(() => {
      setLoadingMessageIndex((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [isGenerating]);

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

  const showSidebar = !isSidebarCollapsed;
  const inReadingMode =
    currentPage > 0 &&
    currentPage < totalPages - 1 &&
    storyText !== DEFAULT_PLACEHOLDER_STORY;
  const shouldShowSidebar = !inReadingMode || showSidebar;

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "var(--color-bg-page)" }}>
      {/* Desktop sidebar */}
      <aside
        className={`hidden w-72 shrink-0 border-r px-6 py-6 transition-all duration-300 md:block ${!shouldShowSidebar ? "md:hidden" : ""}`}
        style={{
          backgroundColor: "var(--color-bg-sidebar)",
          borderColor: "var(--color-border)",
        }}
      >
        <header
          className="flex items-start justify-between border-b pb-4"
          style={{
            backgroundColor: "var(--color-bg-sidebar)",
            borderColor: "var(--color-border)",
          }}
        >
          <div>
            <h2
              className="text-2xl font-semibold tracking-tight"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "1.5rem",
                color: "var(--color-gold)",
                letterSpacing: "-0.01em",
              }}
            >
              Story Time ✦
            </h2>
            <p
              className="mt-1 text-[12px]"
              style={{ color: "var(--color-text-secondary)" }}
            >
              bedtime stories, just for you
            </p>
          </div>
          {inReadingMode && (
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(true)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[18px] transition-colors hover:bg-white/10"
              style={{ color: "var(--color-text-secondary)" }}
              aria-label="Hide sidebar"
            >
              ›
            </button>
          )}
        </header>

        <div className="mt-6 space-y-6">
          <div className="mt-4">
            <label
              className="flex items-center justify-between text-[11px] font-medium uppercase tracking-[0.08em]"
              style={{ color: "var(--color-text-secondary)" }}
            >
              <span>Story length</span>
              <span style={{ color: "var(--color-gold)", fontWeight: 500 }}>
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
              className="story-range mt-2 w-full cursor-pointer"
            />
          </div>

          <div className="mt-4">
            <label
              className="mb-2 block text-[11px] font-medium uppercase tracking-[0.08em]"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Reading age
            </label>
            <div className="flex flex-wrap gap-2">
              {READING_AGE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setReadingAge(opt.value)}
                  className="rounded-full px-3.5 py-1.5 text-[13px] transition-colors"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    ...(readingAge === opt.value
                      ? {
                          background: "var(--color-gold-muted)",
                          border: "1px solid var(--color-gold-hover)",
                          color: "var(--color-gold)",
                          fontWeight: 500,
                        }
                      : {
                          background: "transparent",
                          border: "1px solid var(--color-border)",
                          color: "var(--color-text-secondary)",
                        }),
                  }}
                  onMouseEnter={(e) => {
                    if (readingAge !== opt.value) {
                      e.currentTarget.style.borderColor = "var(--color-border-strong)";
                      e.currentTarget.style.color = "var(--color-text-primary)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (readingAge !== opt.value) {
                      e.currentTarget.style.borderColor = "var(--color-border)";
                      e.currentTarget.style.color = "var(--color-text-secondary)";
                    }
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 space-y-4">
            <h3
              className="text-[11px] font-medium uppercase tracking-[0.08em]"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Optional settings
            </h3>

            <div>
              <label
                className="mb-1 block text-[13px]"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Theme (optional)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  placeholder='e.g., "space", "underwater", "jungle"'
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-[3px]"
                  style={{
                    backgroundColor: "var(--color-bg-input)",
                    borderColor: "var(--color-border)",
                    color: "var(--color-text-primary)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--color-gold-hover)";
                    e.currentTarget.style.boxShadow = "0 0 0 3px var(--color-gold-muted)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--color-border)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
                <button
                  type="button"
                  onClick={handleRandomTheme}
                  disabled={isThemeGenerating}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    backgroundColor: "transparent",
                    borderColor: "var(--color-border)",
                    color: "var(--color-text-secondary)",
                  }}
                  onMouseEnter={(e) => {
                    if (!isThemeGenerating) {
                      e.currentTarget.style.borderColor = "var(--color-gold)";
                      e.currentTarget.style.color = "var(--color-gold)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--color-border)";
                    e.currentTarget.style.color = "var(--color-text-secondary)";
                  }}
                  title="Surprise me with a theme"
                >
                  <span className="sr-only">Generate random theme</span>
                  <Shuffle className="h-4 w-4" />
                </button>
              </div>
              {isThemeGenerating && (
                <p
                  className="mt-1 text-[11px]"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Finding a fun theme...
                </p>
              )}
            </div>

            <div>
              <label
                className="mb-1 block text-[13px]"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Specific things to include (optional)
              </label>
              <textarea
                value={specifics}
                onChange={(e) => setSpecifics(e.target.value)}
                rows={3}
                placeholder='e.g., "I want to include a polar bear named Pablo"'
                className="w-full resize-none rounded-lg border px-3 py-2 text-sm placeholder:text-[var(--color-text-hint)] focus:outline-none focus:ring-[3px]"
                style={{
                  backgroundColor: "var(--color-bg-input)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-text-primary)",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--color-gold-hover)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px var(--color-gold-muted)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--color-border)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            <div>
              <label
                className="mb-1 block text-[13px]"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Specific words to repeat or rhyme (optional)
              </label>
              <input
                type="text"
                value={repeatWords}
                onChange={(e) => setRepeatWords(e.target.value)}
                placeholder='e.g., "cook, book, took"'
                className="w-full rounded-lg border px-3 py-2 text-sm placeholder:text-[var(--color-text-hint)] focus:outline-none focus:ring-[3px]"
                style={{
                  backgroundColor: "var(--color-bg-input)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-text-primary)",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--color-gold-hover)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px var(--color-gold-muted)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--color-border)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            <div>
              <label
                className="mb-1 block text-[13px]"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Max per page
              </label>
              <input
                type="number"
                min={5}
                max={20}
                value={maxWordsPerPage}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (v >= 5 && v <= 20) {
                    setMaxWordsPerPage(v);
                    goToPage(0);
                  }
                }}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-[3px]"
                style={{
                  backgroundColor: "var(--color-bg-input)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-text-primary)",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--color-gold-hover)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px var(--color-gold-muted)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--color-border)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleGenerateStory()}
            disabled={isGenerating}
            className={`generate-button mt-4 ${isGenerating ? "loading" : ""}`}
          >
            {isGenerating ? "Writing your story…" : "✦ Generate Story"}
          </button>

          {error && (
            <p className="mt-2 text-xs text-rose-500">
              {error}
            </p>
          )}
        </div>
      </aside>

      {/* Sidebar toggle - when in reading mode and collapsed, show arrow to expand */}
      {inReadingMode && isSidebarCollapsed && (
        <button
          type="button"
          onClick={() => setIsSidebarCollapsed(false)}
          className="fixed left-0 top-1/2 z-20 flex h-12 w-8 -translate-y-1/2 items-center justify-center rounded-r-lg transition-colors"
          style={{
            backgroundColor: "var(--color-bg-sidebar)",
            border: "1px solid var(--color-border)",
            borderLeft: "none",
            color: "var(--color-gold)",
          }}
          aria-label="Show sidebar"
        >
          <span className="text-lg font-light">‹</span>
        </button>
      )}

      {/* Main content - full screen book */}
      <div className="flex min-h-screen flex-1 flex-col">
        {/* Mobile/overlay config panel */}
        {isConfigOpen && (
          <>
            <div
              className="fixed inset-0 z-30 bg-black/20 backdrop-blur-[1px] md:hidden"
              onClick={() => setIsConfigOpen(false)}
            />
            <div
              className="fixed inset-0 z-40 w-full px-5 pb-6 pt-4 shadow-xl md:hidden"
              style={{ backgroundColor: "var(--color-bg-sidebar)" }}
            >
              <div className="mb-4 flex items-center justify-between">
                <h2
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: "1.5rem",
                    color: "var(--color-gold)",
                  }}
                >
                  Story Time ✦
                </h2>
                <button
                  type="button"
                  aria-label="Close story settings"
                  onClick={() => setIsConfigOpen(false)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-white/10"
                  style={{ color: "var(--color-text-secondary)" }}
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
                    <label
                      className="flex items-center justify-between text-[11px] font-medium uppercase tracking-[0.08em]"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      <span>Story length</span>
                      <span style={{ color: "var(--color-gold)", fontWeight: 500 }}>
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
                      className="story-range mt-1 w-full cursor-pointer"
                    />
                  </div>

                  <div>
                    <label
                      className="mb-2 block text-[11px] font-medium uppercase tracking-[0.08em]"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      Reading age
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {READING_AGE_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setReadingAge(opt.value)}
                          className="rounded-full px-3.5 py-1.5 text-[13px]"
                          style={{
                            ...(readingAge === opt.value
                              ? {
                                  background: "var(--color-gold-muted)",
                                  border: "1px solid var(--color-gold-hover)",
                                  color: "var(--color-gold)",
                                  fontWeight: 500,
                                }
                              : {
                                  background: "transparent",
                                  border: "1px solid var(--color-border)",
                                  color: "var(--color-text-secondary)",
                                }),
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <h3
                    className="text-[11px] font-medium uppercase tracking-[0.08em]"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    Optional settings
                  </h3>

                  <div>
                    <label
                      className="mb-1 block text-[13px]"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      Theme (optional)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={theme}
                        onChange={(e) => setTheme(e.target.value)}
                        placeholder='e.g., "space", "underwater", "jungle"'
                        className="w-full rounded-lg border px-3 py-2.5 text-base"
                        style={{
                          backgroundColor: "var(--color-bg-input)",
                          borderColor: "var(--color-border)",
                          color: "var(--color-text-primary)",
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleRandomTheme}
                        disabled={isThemeGenerating}
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border disabled:cursor-not-allowed disabled:opacity-60"
                        style={{
                          backgroundColor: "transparent",
                          borderColor: "var(--color-border)",
                          color: "var(--color-text-secondary)",
                        }}
                        title="Surprise me with a theme"
                      >
                        <span className="sr-only">Generate random theme</span>
                        <Shuffle className="h-4 w-4" />
                      </button>
                    </div>
                    {isThemeGenerating && (
                      <p
                        className="mt-1 text-sm"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        Finding a fun theme...
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      className="mb-1 block text-[13px]"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      Specific things to include (optional)
                    </label>
                    <textarea
                      value={specifics}
                      onChange={(e) => setSpecifics(e.target.value)}
                      rows={2}
                      placeholder='e.g., "I want to include a polar bear named Pablo"'
                      className="w-full resize-none rounded-lg border px-3 py-2.5 text-base"
                      style={{
                        backgroundColor: "var(--color-bg-input)",
                        borderColor: "var(--color-border)",
                        color: "var(--color-text-primary)",
                      }}
                    />
                  </div>

                  <div>
                    <label
                      className="mb-1 block text-[13px]"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      Specific words to repeat or rhyme (optional)
                    </label>
                    <input
                      type="text"
                      value={repeatWords}
                      onChange={(e) => setRepeatWords(e.target.value)}
                      placeholder='e.g., "cook, book, took"'
                      className="w-full rounded-lg border px-3 py-2.5 text-base"
                      style={{
                        backgroundColor: "var(--color-bg-input)",
                        borderColor: "var(--color-border)",
                        color: "var(--color-text-primary)",
                      }}
                    />
                  </div>

                  <div>
                    <label
                      className="mb-1 block text-[13px]"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      Max per page
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={20}
                      value={maxWordsPerPage}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        if (v >= 5 && v <= 20) {
                          setMaxWordsPerPage(v);
                          goToPage(0);
                        }
                      }}
                      className="w-full rounded-lg border px-3 py-2.5 text-base"
                      style={{
                        backgroundColor: "var(--color-bg-input)",
                        borderColor: "var(--color-border)",
                        color: "var(--color-text-primary)",
                      }}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleGenerateStory(true)}
                  disabled={isGenerating}
                  className={`generate-button mt-auto ${isGenerating ? "loading" : ""}`}
                >
                  {isGenerating ? "Writing your story…" : "✦ Generate Story"}
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
        <main className="relative flex min-h-screen flex-1 flex-col">
          <section className="relative flex min-h-screen flex-1 flex-col px-6 py-12 md:px-12 md:py-16">
            <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center">
              {isGenerating ? (
                <div className="flex flex-col items-center gap-6">
                  <div
                    className="loading-pulse flex flex-col items-center"
                    aria-hidden
                  >
                    <svg
                      className="h-[3rem] w-[3rem]"
                      viewBox="0 0 64 64"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M8 16v32c0 4 4 8 12 8h24c8 0 12-4 12-8V16c0-4-4-8-12-8H20C12 8 8 12 8 16z"
                        fill="var(--color-story-bg)"
                        stroke="var(--color-gold)"
                        strokeWidth="2"
                      />
                      <path
                        d="M32 16v32M16 32h32"
                        stroke="var(--color-gold)"
                        strokeWidth="1.5"
                      />
                      <circle cx="12" cy="12" r="1.5" fill="var(--color-gold)" />
                      <circle cx="52" cy="12" r="1.5" fill="var(--color-gold)" />
                      <circle cx="12" cy="52" r="1.5" fill="var(--color-gold)" />
                      <circle cx="52" cy="52" r="1.5" fill="var(--color-gold)" />
                    </svg>
                  </div>
                  <p
                    className="text-center font-medium italic transition-opacity duration-500"
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: "1.25rem",
                      color: "var(--color-text-primary)",
                    }}
                  >
                    {LOADING_MESSAGES[loadingMessageIndex]}
                  </p>
                </div>
              ) : currentPage === 0 &&
                storyText === DEFAULT_PLACEHOLDER_STORY ? (
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="opacity-90">
                    <svg
                      className="h-[3rem] w-[3rem]"
                      viewBox="0 0 64 64"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M8 16v32c0 4 4 8 12 8h24c8 0 12-4 12-8V16c0-4-4-8-12-8H20C12 8 8 12 8 16z"
                        fill="var(--color-story-bg)"
                        stroke="var(--color-gold)"
                        strokeWidth="2"
                      />
                      <path
                        d="M32 16v32M16 32h32"
                        stroke="var(--color-gold)"
                        strokeWidth="1.5"
                      />
                      <circle cx="12" cy="12" r="1.5" fill="var(--color-gold)" />
                      <circle cx="52" cy="12" r="1.5" fill="var(--color-gold)" />
                      <circle cx="12" cy="52" r="1.5" fill="var(--color-gold)" />
                      <circle cx="52" cy="52" r="1.5" fill="var(--color-gold)" />
                    </svg>
                  </div>
                  <p
                    className="font-serif italic"
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: "1.25rem",
                      color: "var(--color-text-primary)",
                    }}
                  >
                    Your story will appear here
                  </p>
                  <p
                    className="text-[13px]"
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    Configure your settings and press Generate
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsConfigOpen(true)}
                    className="mt-4 rounded-lg border px-4 py-2 text-[13px] transition-colors hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)] md:hidden"
                    style={{
                      color: "var(--color-text-secondary)",
                      backgroundColor: "transparent",
                      borderColor: "var(--color-border)",
                    }}
                  >
                    Open settings
                  </button>
                </div>
              ) : currentPage === 0 ? (
                <div className="flex w-full flex-1 flex-col items-center">
                  <div className="flex flex-1 items-center justify-center">
                    <p
                      className="mx-auto max-w-3xl text-center text-2xl font-semibold leading-snug sm:text-3xl md:text-[2.5rem] lg:text-[3rem]"
                      style={{
                        fontFamily: "'Playfair Display', serif",
                        color: "var(--color-text-primary)",
                      }}
                    >
                      {storyTitle || "Your Story"}
                    </p>
                  </div>
                  <div
                    className="mt-8 flex items-center justify-center gap-4"
                    style={{ gap: 16 }}
                  >
                    <button
                      type="button"
                      onClick={handlePrevious}
                      disabled
                      aria-label="Previous page"
                      className="page-nav-btn flex h-12 min-h-[48px] min-w-[48px] items-center justify-center rounded-xl border transition-colors disabled:pointer-events-none disabled:opacity-40"
                      style={{
                        backgroundColor: "var(--color-gold-muted)",
                        borderColor: "var(--color-border-strong)",
                        color: "var(--color-gold)",
                      }}
                    >
                      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M15 6L9 12L15 18"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                    <span
                      className="text-[14px]"
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      Page 1 of {totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={handleNext}
                      aria-label="Next page"
                      className="page-nav-btn flex h-12 min-h-[48px] min-w-[48px] items-center justify-center rounded-xl border transition-colors"
                      style={{
                        backgroundColor: "var(--color-gold-muted)",
                        borderColor: "var(--color-border-strong)",
                        color: "var(--color-gold)",
                      }}
                    >
                      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M9 6L15 12L9 18"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsConfigOpen(true)}
                    className="ghost-button mt-4 rounded-lg border px-4 py-2 text-[13px] transition-colors"
                    style={{
                      color: "var(--color-text-secondary)",
                      backgroundColor: "transparent",
                      borderColor: "var(--color-border)",
                    }}
                  >
                    Start a new story
                  </button>
                </div>
              ) : currentPage === totalPages - 1 ? (
                <div className="flex flex-col items-center gap-6">
                  <p
                    className="mx-auto max-w-3xl text-center text-2xl font-semibold italic sm:text-3xl md:text-[2.5rem] lg:text-[3rem]"
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      color: "var(--color-text-primary)",
                    }}
                  >
                    The End
                  </p>
                  <div
                    className="mt-8 flex items-center justify-center gap-4"
                    style={{ gap: 16 }}
                  >
                    <button
                      type="button"
                      onClick={handlePrevious}
                      aria-label="Previous page"
                      className="page-nav-btn flex h-12 min-h-[48px] min-w-[48px] items-center justify-center rounded-xl border transition-colors"
                      style={{
                        backgroundColor: "var(--color-gold-muted)",
                        borderColor: "var(--color-border-strong)",
                        color: "var(--color-gold)",
                      }}
                    >
                      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M15 6L9 12L15 18"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                    <span
                      className="text-[14px]"
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      Page {totalPages} of {totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={handleNext}
                      disabled
                      aria-label="Next page"
                      className="page-nav-btn flex h-12 min-h-[48px] min-w-[48px] items-center justify-center rounded-xl border transition-colors disabled:pointer-events-none disabled:opacity-40"
                      style={{
                        backgroundColor: "var(--color-gold-muted)",
                        borderColor: "var(--color-border-strong)",
                        color: "var(--color-gold)",
                      }}
                    >
                      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M9 6L15 12L9 18"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
                    <button
                      type="button"
                      onClick={handleStartOver}
                      className="ghost-button rounded-lg border px-4 py-2 text-[13px] transition-colors"
                      style={{
                        color: "var(--color-text-secondary)",
                        backgroundColor: "transparent",
                        borderColor: "var(--color-border)",
                      }}
                    >
                      Start Over
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsConfigOpen(true)}
                      className="ghost-button rounded-lg border px-4 py-2 text-[13px] transition-colors"
                      style={{
                        color: "var(--color-text-secondary)",
                        backgroundColor: "transparent",
                        borderColor: "var(--color-border)",
                      }}
                    >
                      Start a new story
                    </button>
                  </div>
                </div>
              ) : (
                <div className="w-full max-w-[680px]">
                  <div className="story-page">
                    <p
                      className="text-center"
                      style={{
                        fontFamily: "'Lora', serif",
                        fontSize: "1.25rem",
                        lineHeight: 1.9,
                        color: "var(--color-story-text)",
                        letterSpacing: "0.01em",
                      }}
                    >
                      {currentPageLines.map((line, index) => (
                        <span key={index}>
                          {line}
                          {index < currentPageLines.length - 1 && <br />}
                        </span>
                      ))}
                    </p>
                  </div>

                  {/* Page navigation - below story card */}
                  <div
                    className="mt-8 flex flex-wrap items-center justify-center gap-4"
                    style={{ marginTop: 32 }}
                  >
                    <button
                      type="button"
                      onClick={handlePrevious}
                      disabled={currentPage === 0}
                      aria-label="Previous page"
                      className="page-nav-btn flex h-12 min-h-[48px] min-w-[48px] items-center justify-center rounded-xl border transition-colors disabled:pointer-events-none disabled:opacity-40"
                      style={{
                        backgroundColor: "var(--color-gold-muted)",
                        borderColor: "var(--color-border-strong)",
                        color: "var(--color-gold)",
                      }}
                    >
                      <svg
                        className="h-6 w-6"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
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
                    <span
                      className="px-2 text-[14px]"
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      Page {currentPage + 1} of {totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={currentPage >= totalPages - 1}
                      aria-label="Next page"
                      className="page-nav-btn flex h-12 min-h-[48px] min-w-[48px] items-center justify-center rounded-xl border transition-colors disabled:pointer-events-none disabled:opacity-40"
                      style={{
                        backgroundColor: "var(--color-gold-muted)",
                        borderColor: "var(--color-border-strong)",
                        color: "var(--color-gold)",
                      }}
                    >
                      <svg
                        className="h-6 w-6"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
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
                  </div>

                  <div className="mt-4 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setIsConfigOpen(true)}
                      className="ghost-button rounded-lg border px-4 py-2 text-[13px] transition-colors"
                      style={{
                        color: "var(--color-text-secondary)",
                        backgroundColor: "transparent",
                        borderColor: "var(--color-border)",
                      }}
                    >
                      Start a new story
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
