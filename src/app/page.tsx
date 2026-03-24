"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "storyTime";

const DEFAULT_CONFIG = {
  storyLength: 150,
  readingAge: 6,
  theme: "",
  specifics: "",
  repeatWords: "",
  maxWordsPerPage: 15,
};

type StoredState = {
  storyLength: number;
  readingAge: number;
  theme: string;
  specifics: string;
  repeatWords: string;
  maxWordsPerPage: number;
  lastStory?: string;
  lastStoryTitle?: string;
  lastStoryPage?: number;
};

function loadStored(): StoredState {
  if (typeof window === "undefined") {
    return { ...DEFAULT_CONFIG };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_CONFIG };
    const data = JSON.parse(raw) as Record<string, unknown>;
    const ageRaw = Number(data.readingAge);
    const readingAge =
      ageRaw === 3 ? 4 : Number.isFinite(ageRaw) ? ageRaw : 6; /* 3 years removed, map to 4–5 */
    return {
      storyLength: Number(data.storyLength) || 150,
      readingAge,
      theme: typeof data.theme === "string" ? data.theme : "",
      specifics: typeof data.specifics === "string" ? data.specifics : "",
      repeatWords: typeof data.repeatWords === "string" ? data.repeatWords : "",
      maxWordsPerPage: Number(data.maxWordsPerPage) || 15,
      lastStory: typeof data.lastStory === "string" ? data.lastStory : undefined,
      lastStoryTitle:
        typeof data.lastStoryTitle === "string" ? data.lastStoryTitle : undefined,
      lastStoryPage:
        typeof data.lastStoryPage === "number" && Number.isFinite(data.lastStoryPage)
          ? Math.max(0, Math.floor(data.lastStoryPage))
          : undefined,
    };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

function saveStored(state: StoredState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

const READING_AGES = [
  { value: 4, label: "4–5 years" },
  { value: 6, label: "6–7 years" },
  { value: 8, label: "8–9 years" },
  { value: 10, label: "10+ years" },
] as const;

const ST_INPUT_CLASS =
  "st-input w-full rounded-lg border bg-[var(--st-bg-input)] border-[var(--st-border-input)] text-[13px] text-[#c8bfe0] outline-none placeholder:text-[var(--st-text-hint)] box-border";

function ShuffleIcon() {
  return (
    <svg
      width={17}
      height={17}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="17 1 21 1 21 5" />
      <path d="M3 11V3a2 2 0 0 1 2-2h8" />
      <polyline points="21 13 21 21 13 21" />
      <path d="M11 21H5a2 2 0 0 1-2-2v-8" />
    </svg>
  );
}

function SettingsPanel({
  storyLength,
  setStoryLength,
  readingAge,
  setReadingAge,
  theme,
  setTheme,
  specifics,
  setSpecifics,
  repeatWords,
  setRepeatWords,
  maxWordsPerPage,
  setMaxWordsPerPage,
  onStoryLengthChange,
  onMaxWordsPerPageChange,
  handleRandomTheme,
  handleGenerateStory,
  isThemeGenerating,
  isGenerating,
  error,
  onClose,
  isMobile,
}: {
  storyLength: number;
  setStoryLength: (v: number) => void;
  readingAge: number;
  setReadingAge: (v: number) => void;
  theme: string;
  setTheme: (v: string) => void;
  specifics: string;
  setSpecifics: (v: string) => void;
  repeatWords: string;
  setRepeatWords: (v: string) => void;
  maxWordsPerPage: number;
  setMaxWordsPerPage: (v: number) => void;
  onStoryLengthChange: (v: number) => void;
  onMaxWordsPerPageChange: (v: number) => void;
  handleRandomTheme: () => void;
  handleGenerateStory: (closePanel?: boolean) => void;
  isThemeGenerating: boolean;
  isGenerating: boolean;
  error: string | null;
  onClose?: () => void;
  isMobile?: boolean;
}) {
  return (
    <div
      className="flex min-h-0 flex-1 flex-col st-settings-panel"
      data-mobile={isMobile ? "true" : undefined}
    >
      <header
        className="flex items-start justify-between border-b border-[var(--st-border-subtle)] px-5 pb-3.5 pt-5 st-settings-header"
      >
        <div>
          <h2
            className="m-0 mb-0.5 font-semibold tracking-tight text-[var(--st-gold)] st-settings-title"
            style={{ fontFamily: "var(--font-nunito), system-ui, sans-serif", letterSpacing: "-0.01em" }}
          >
            Story Time
          </h2>
          <p
            className="m-0 text-[var(--st-text-muted)] st-settings-tagline"
            style={{ fontFamily: "sans-serif", letterSpacing: "0.05em" }}
          >
            bedtime stories, just for you
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            aria-label="Close story settings"
            onClick={onClose}
            className="-mr-1 -mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--st-text-muted)] hover:bg-white/5 md:hidden"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M6 6L18 18M6 18L18 6"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 st-settings-body">
        <div className="st-settings-sections">
          <div>
            <label
              className="st-settings-label mb-2 flex items-center justify-between uppercase tracking-[0.08em] text-[var(--st-text-muted)]"
              style={{ fontFamily: "sans-serif", margin: "0 0 8px" }}
            >
              <span>Story length</span>
              <span
                className="text-xs font-medium text-[var(--st-gold)]"
                style={{ fontFamily: "sans-serif" }}
              >
                {storyLength} words
              </span>
            </label>
            <input
              type="range"
              min={20}
              max={500}
              step={10}
              value={storyLength}
              onChange={(e) => {
                setStoryLength(Number(e.target.value));
                onStoryLengthChange(Number(e.target.value));
              }}
              className="st-slider mt-2"
            />
          </div>

          <div className="st-settings-section">
            <label
              className="st-settings-label mb-2 block uppercase tracking-[0.08em] text-[var(--st-text-muted)]"
              style={{ fontFamily: "sans-serif", margin: "0 0 8px" }}
            >
              Reading age
            </label>
            <div className="flex flex-wrap gap-2">
              {READING_AGES.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setReadingAge(value)}
                  className="cursor-pointer rounded-full border px-3 py-1.5 text-xs font-normal transition-colors"
                  style={{
                    fontFamily: "sans-serif",
                    padding: "5px 12px",
                    border: "1px solid var(--st-border-input)",
                    color: "var(--st-text-muted)",
                    background: "transparent",
                    ...(readingAge === value
                      ? {
                          background: "var(--st-gold-tint)",
                          borderColor: "var(--st-gold-border)",
                          color: "var(--st-gold)",
                          fontWeight: 500,
                        }
                      : {}),
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="st-settings-divider" />
          <h3 className="st-settings-optional-title">Optional Settings</h3>

          <div className="st-settings-section">
            <label
              className="st-settings-label mb-2 block uppercase tracking-[0.08em] text-[var(--st-text-muted)]"
              style={{ fontFamily: "sans-serif", margin: "0 0 8px" }}
            >
              Theme
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder='e.g., "space", "underwater", "jungle"'
                className={ST_INPUT_CLASS}
              />
              <button
                type="button"
                onClick={handleRandomTheme}
                disabled={isThemeGenerating}
                className="flex h-[38px] w-[38px] shrink-0 cursor-pointer items-center justify-center rounded-lg border border-[var(--st-border-input)] text-[var(--st-text-muted)]"
                style={{
                  background: "rgba(255, 255, 255, 0.04)",
                }}
                title="Surprise me with a theme"
              >
                <span className="sr-only">Generate random theme</span>
                <ShuffleIcon />
              </button>
            </div>
            {isThemeGenerating && (
              <p className="mt-1 text-[11px] text-[var(--st-text-muted)]">
                Finding a fun theme...
              </p>
            )}
          </div>

          <div className="st-settings-section">
            <label
              className="st-settings-label mb-2 block uppercase tracking-[0.08em] text-[var(--st-text-muted)]"
              style={{ fontFamily: "sans-serif", margin: "0 0 8px" }}
            >
              Things to include
            </label>
            <textarea
              value={specifics}
              onChange={(e) => setSpecifics(e.target.value)}
              rows={isMobile ? 2 : 3}
              placeholder='e.g., "I want to include a polar bear named Pablo"'
              className={`${ST_INPUT_CLASS} resize-none`}
            />
          </div>

          <div className="st-settings-section">
            <label
              className="st-settings-label mb-2 block uppercase tracking-[0.08em] text-[var(--st-text-muted)]"
              style={{ fontFamily: "sans-serif", margin: "0 0 8px" }}
            >
              Words to rhyme
            </label>
            <input
              type="text"
              value={repeatWords}
              onChange={(e) => setRepeatWords(e.target.value)}
              placeholder='e.g., "cook, book, took"'
              className={ST_INPUT_CLASS}
            />
          </div>

          <div className="st-settings-section">
            <label
              className="st-settings-label mb-2 flex items-center justify-between uppercase tracking-[0.08em] text-[var(--st-text-muted)]"
              style={{ fontFamily: "sans-serif", margin: "0 0 8px" }}
            >
              <span>Max words per page</span>
              <span
                className="text-xs font-medium text-[var(--st-gold)]"
                style={{ fontFamily: "sans-serif" }}
              >
                {maxWordsPerPage} words
              </span>
            </label>
            <input
              type="range"
              min={5}
              max={30}
              step={1}
              value={maxWordsPerPage}
              onChange={(e) => {
                setMaxWordsPerPage(Number(e.target.value));
                onMaxWordsPerPageChange(Number(e.target.value));
              }}
              className="st-slider mt-2"
            />
          </div>
        </div>
      </div>

      <footer
        className="st-settings-footer border-t border-[var(--st-border-subtle)] bg-[var(--st-bg-page)] shrink-0 px-5 pb-[18px] pt-3.5"
        style={{ padding: "14px 20px 18px" }}
      >
        <button
          type="button"
          onClick={() => (onClose ? handleGenerateStory(true) : handleGenerateStory())}
          disabled={isGenerating}
          className="block w-full cursor-pointer rounded-xl border-none py-3.5 font-sans text-sm font-semibold !bg-[#e8d5a3] !text-[#1a1635] disabled:cursor-not-allowed"
          style={{
            padding: "14px",
            fontFamily: "sans-serif",
            WebkitAppearance: "none",
            appearance: "none",
          }}
        >
          {isGenerating ? (
            <span
              className="animate-[pulse_1.2s_ease-in-out_infinite]"
              style={{ animation: "pulse 1.2s ease-in-out infinite" }}
            >
              Writing your story…
            </span>
          ) : (
            "✦ Generate Story"
          )}
        </button>
        {error && (
          <p className="mt-2 text-xs text-rose-500">
            {error}
          </p>
        )}
      </footer>
    </div>
  );
}

export default function Home() {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [storyLength, setStoryLength] = useState(DEFAULT_CONFIG.storyLength);
  const [readingAge, setReadingAge] = useState(DEFAULT_CONFIG.readingAge);
  const [currentPage, setCurrentPage] = useState(0);
  const [maxWordsPerPage, setMaxWordsPerPage] = useState(DEFAULT_CONFIG.maxWordsPerPage);
  const [theme, setTheme] = useState(DEFAULT_CONFIG.theme);
  const [specifics, setSpecifics] = useState(DEFAULT_CONFIG.specifics);
  const [repeatWords, setRepeatWords] = useState(DEFAULT_CONFIG.repeatWords);
  const [storyText, setStoryText] = useState<string>("");
  const [storyTitle, setStoryTitle] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isThemeGenerating, setIsThemeGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const skipNextSave = useRef(true);
  const lastClampedStoryText = useRef<string | null>(null);

  useLayoutEffect(() => {
    const s = loadStored();
    setStoryLength(s.storyLength);
    setReadingAge(s.readingAge);
    setTheme(s.theme);
    setSpecifics(s.specifics);
    setRepeatWords(s.repeatWords);
    setMaxWordsPerPage(s.maxWordsPerPage);

    const savedStory = s.lastStory?.trim();
    if (savedStory) {
      setStoryText(s.lastStory ?? "");
      setStoryTitle(s.lastStoryTitle ?? "");
      setCurrentPage(s.lastStoryPage ?? 0);
      setIsConfigOpen(false);
    } else {
      setStoryText("");
      setStoryTitle("");
      setCurrentPage(0);
      setIsConfigOpen(true);
    }
  }, []);

  useEffect(() => {
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    const prev = loadStored();
    saveStored({
      ...prev,
      storyLength,
      readingAge,
      theme,
      specifics,
      repeatWords,
      maxWordsPerPage,
    });
  }, [storyLength, readingAge, theme, specifics, repeatWords, maxWordsPerPage]);

  const words = useMemo(
    () => (storyText ? storyText.trim().split(/\s+/) : []),
    [storyText],
  );

  const pages = useMemo(() => {
    if (words.length === 0) {
      return [[]] as string[][];
    }

    const maxWords = Math.max(5, Math.min(30, maxWordsPerPage));

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
    if (!storyText.trim()) {
      lastClampedStoryText.current = null;
      return;
    }
    if (lastClampedStoryText.current === storyText) return;
    lastClampedStoryText.current = storyText;
    const s = loadStored();
    const want = s.lastStoryPage ?? 0;
    setCurrentPage(Math.min(Math.max(want, 0), totalPages - 1));
  }, [storyText, totalPages]);

  useEffect(() => {
    if (!storyText.trim()) return;
    const prev = loadStored();
    saveStored({
      ...prev,
      lastStory: storyText,
      lastStoryTitle: storyTitle,
      lastStoryPage: currentPage,
    });
  }, [currentPage, storyText, storyTitle]);

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

      const title =
        typeof data.title === "string" ? data.title.trim() : "";
      setStoryText(data.story);
      setStoryTitle(title);
      goToPage(0);

      const base = loadStored();
      saveStored({
        ...base,
        storyLength,
        readingAge,
        theme,
        specifics,
        repeatWords,
        maxWordsPerPage,
        lastStory: data.story,
        lastStoryTitle: title,
        lastStoryPage: 0,
      });

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
    <div className="flex min-h-screen">
      {/* Desktop sidebar - Settings view */}
      <aside
        className="flex hidden w-72 flex-col md:flex"
        style={{ backgroundColor: "var(--st-bg-page)" }}
      >
        <SettingsPanel
          storyLength={storyLength}
          setStoryLength={setStoryLength}
          readingAge={readingAge}
          setReadingAge={setReadingAge}
          theme={theme}
          setTheme={setTheme}
          specifics={specifics}
          setSpecifics={setSpecifics}
          repeatWords={repeatWords}
          setRepeatWords={setRepeatWords}
          maxWordsPerPage={maxWordsPerPage}
          setMaxWordsPerPage={setMaxWordsPerPage}
          onStoryLengthChange={() => goToPage(0)}
          onMaxWordsPerPageChange={() => goToPage(0)}
          handleRandomTheme={handleRandomTheme}
          handleGenerateStory={handleGenerateStory}
          isThemeGenerating={isThemeGenerating}
          isGenerating={isGenerating}
          error={error}
          isMobile={false}
        />
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
            <div
              className="fixed inset-0 z-40 flex flex-col md:hidden"
              style={{ backgroundColor: "var(--st-bg-page)" }}
            >
              <SettingsPanel
                storyLength={storyLength}
                setStoryLength={setStoryLength}
                readingAge={readingAge}
                setReadingAge={setReadingAge}
                theme={theme}
                setTheme={setTheme}
                specifics={specifics}
                setSpecifics={setSpecifics}
                repeatWords={repeatWords}
                setRepeatWords={setRepeatWords}
                maxWordsPerPage={maxWordsPerPage}
                setMaxWordsPerPage={setMaxWordsPerPage}
                onStoryLengthChange={() => goToPage(0)}
                onMaxWordsPerPageChange={() => goToPage(0)}
                handleRandomTheme={handleRandomTheme}
                handleGenerateStory={handleGenerateStory}
                isThemeGenerating={isThemeGenerating}
                isGenerating={isGenerating}
                error={error}
                onClose={() => setIsConfigOpen(false)}
                isMobile={true}
              />
            </div>
          </>
        )}

        {/* Reading view - full-bleed parchment */}
        <main
          className="relative flex min-h-screen flex-1 flex-col overflow-hidden"
          style={{ backgroundColor: "var(--st-parchment)", width: "100%", height: "100vh" }}
        >
          {/* Three-column row: left arrow | content | right arrow */}
          <div className="flex min-h-0 flex-1 items-stretch overflow-hidden">
            {/* Left nav arrow */}
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentPage === 0}
              aria-label="Previous page"
              className="flex w-[54px] shrink-0 cursor-pointer items-center justify-center border-none bg-transparent p-0 outline-none disabled:cursor-default"
            >
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke={currentPage === 0 ? "rgba(140, 125, 96, 0.18)" : "#8c7d60"}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>

            {/* Page content area */}
            <div
              className="flex min-h-0 flex-1 flex-col justify-center overflow-y-auto st-scroll-content"
              style={{ padding: "60px 4px 72px" }}
            >
              <div className="flex flex-1 flex-col items-center justify-center">
                {isGenerating ? (
                  <div className="flex flex-col items-center gap-6">
                    <p
                      className="text-center font-serif text-2xl font-semibold text-[var(--st-ink)] sm:text-3xl"
                      style={{ fontFamily: "Georgia, serif" }}
                    >
                      Generating...
                    </p>
                    <div
                      className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--st-ink-faint)] border-t-[var(--st-ink-muted)]"
                      aria-hidden
                    />
                  </div>
                ) : currentPage === 0 ? (
                  <div className="relative flex w-full flex-1 items-center justify-center">
                    <p
                      className="mx-auto max-w-3xl text-center font-serif text-[26px] font-bold text-[var(--st-ink)]"
                      style={{ fontFamily: "Georgia, serif" }}
                    >
                      {storyTitle || "Your Story"}
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsConfigOpen(true)}
                      className="st-link absolute bottom-0 left-0 right-0 text-center"
                      style={{ paddingBottom: "36px" }}
                    >
                      Start a new story
                    </button>
                  </div>
                ) : currentPage === totalPages - 1 ? (
                  <div className="relative flex w-full flex-1 items-center justify-center">
                    <p
                      className="mx-auto max-w-3xl text-center font-serif text-[30px] font-bold italic text-[var(--st-ink)]"
                      style={{ fontFamily: "Georgia, serif" }}
                    >
                      The End
                    </p>
                    <div
                      className="absolute bottom-0 left-0 right-0 flex flex-wrap items-center justify-center gap-6"
                      style={{ paddingBottom: "36px", gap: "24px" }}
                    >
                      <button
                        type="button"
                        onClick={handleStartOver}
                        className="st-link"
                      >
                        Start over
                      </button>
                      <span className="st-link-muted">·</span>
                      <button
                        type="button"
                        onClick={() => setIsConfigOpen(true)}
                        className="st-link"
                      >
                        Create a new story
                      </button>
                    </div>
                  </div>
                ) : (
                  <p
                    className="st-story-text mx-auto max-w-3xl text-center font-serif text-[var(--st-ink)]"
                    style={{
                      fontFamily: "Georgia, serif",
                      lineHeight: 1.95,
                      margin: 0,
                    }}
                  >
                    {currentPageLines.map((line, index) => (
                      <span key={index}>
                        {line}
                        {index < currentPageLines.length - 1 && <br />}
                      </span>
                    ))}
                  </p>
                )}
              </div>
            </div>

            {/* Right nav arrow */}
            <button
              type="button"
              onClick={handleNext}
              disabled={currentPage >= totalPages - 1}
              aria-label="Next page"
              className="flex w-[54px] shrink-0 cursor-pointer items-center justify-center border-none bg-transparent p-0 outline-none disabled:cursor-default"
            >
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke={currentPage >= totalPages - 1 ? "rgba(140, 125, 96, 0.18)" : "#8c7d60"}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>

          {/* Dot progress indicators */}
          <div
            className="pointer-events-none absolute flex items-center justify-center gap-[7px]"
            style={{ bottom: "22px", left: 0, right: 0 }}
          >
            {Array.from({ length: totalPages }, (_, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-200"
                style={{
                  width: i === currentPage ? 20 : 7,
                  height: 7,
                  borderRadius: i === currentPage ? "3px" : "50%",
                  background: i === currentPage ? "#8c7d60" : "rgba(61, 43, 31, 0.15)",
                }}
              />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
