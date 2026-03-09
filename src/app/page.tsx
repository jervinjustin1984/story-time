"use client";

import { useMemo, useState } from "react";

const PLACEHOLDER_STORY =
  "Under a silver moon, Mia discovered a tiny glowing door behind her bookshelf. Curious and brave, she stepped through and entered a forest of talking fireflies. Each light whispered a secret wish. Mia listened carefully, promising to guard their dreams and share kindness everywhere she wandered afterward.";

const WORDS_PER_PAGE = 10;

export default function Home() {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [storyLength, setStoryLength] = useState(50);
  const [readingAge, setReadingAge] = useState(6);
  const [currentPage, setCurrentPage] = useState(0);

  const words = useMemo(
    () => PLACEHOLDER_STORY.trim().split(/\s+/).slice(0, storyLength),
    [storyLength],
  );

  const totalPages = Math.max(1, Math.ceil(words.length / WORDS_PER_PAGE));

  const currentPageWords = useMemo(() => {
    const start = currentPage * WORDS_PER_PAGE;
    const end = start + WORDS_PER_PAGE;
    return words.slice(start, end).join(" ");
  }, [currentPage, words]);

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

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-sky-50 to-indigo-100">
      {/* Desktop sidebar */}
      <aside className="hidden w-72 border-r border-indigo-100 bg-white/80 px-6 py-8 shadow-sm backdrop-blur md:block">
        <h2 className="text-xl font-semibold text-indigo-900">Story Settings</h2>
        <p className="mt-1 text-sm text-indigo-500">
          Tune the story for your reader.
        </p>

        <div className="mt-8 space-y-6">
          <div>
            <label className="flex items-center justify-between text-sm font-medium text-slate-700">
              <span>Story length</span>
              <span className="text-xs text-slate-500">{storyLength} words</span>
            </label>
            <input
              type="range"
              min={20}
              max={100}
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
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Reading age
            </label>
            <select
              value={readingAge}
              onChange={(e) => setReadingAge(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              <option value={4}>4–5 years</option>
              <option value={6}>6–7 years</option>
              <option value={8}>8–9 years</option>
              <option value={10}>10+ years</option>
            </select>
            <p className="mt-1 text-xs text-slate-500">
              This will help tailor future stories.
            </p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Mobile header */}
        <header className="flex items-center justify-between border-b border-indigo-100 bg-white/80 px-4 py-3 shadow-sm backdrop-blur md:px-8">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-indigo-900 md:text-2xl">
              Story Time
            </h1>
            <p className="text-xs text-indigo-500 md:text-sm">
              A cozy place to read with your child.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsConfigOpen((open) => !open)}
            aria-label={isConfigOpen ? "Close story settings" : "Open story settings"}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-indigo-200 bg-white text-indigo-700 shadow-sm hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 md:hidden"
          >
            <span className="sr-only">
              {isConfigOpen ? "Hide settings" : "Show settings"}
            </span>
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M19.4 9.5a1 1 0 0 0 .2-1.1l-1-1.8a1 1 0 0 0-1.1-.5l-1.6.4a1 1 0 0 1-1.1-.6l-.5-1.5A1 1 0 0 0 13.3 3h-2.6a1 1 0 0 0-1 .7l-.5 1.5a1 1 0 0 1-1.1.6L6.5 6.1a1 1 0 0 0-1.1.5l-1 1.8a1 1 0 0 0 .2 1.1l1.2 1.3a1 1 0 0 1 0 1.3L4.6 13.8a1 1 0 0 0-.2 1.1l1 1.8a1 1 0 0 0 1.1.5l1.6-.4a1 1 0 0 1 1.1.6l.5 1.5a1 1 0 0 0 1 .7h2.6a1 1 0 0 0 1-.7l.5-1.5a1 1 0 0 1 1.1-.6l1.6.4a1 1 0 0 0 1.1-.5l1-1.8a1 1 0 0 0-.2-1.1l-1.2-1.3a1 1 0 0 1 0-1.3L19.4 9.5Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </header>

        {/* Mobile settings left panel + backdrop */}
        {isConfigOpen && (
          <>
            <div
              className="fixed inset-0 z-30 bg-black/20 backdrop-blur-[1px] md:hidden"
              onClick={() => setIsConfigOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 z-40 w-72 max-w-[80vw] border-r border-indigo-100 bg-white/95 px-4 pb-6 pt-4 shadow-xl md:hidden">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-indigo-900">
                  Story Settings
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

              <div className="mt-2 space-y-5">
                <div>
                  <label className="flex items-center justify-between text-xs font-medium text-slate-700">
                    <span>Story length</span>
                    <span className="text-[10px] text-slate-500">
                      {storyLength} words
                    </span>
                  </label>
                  <input
                    type="range"
                    min={20}
                    max={100}
                    step={10}
                    value={storyLength}
                    onChange={(e) => {
                      setStoryLength(Number(e.target.value));
                      goToPage(0);
                    }}
                    className="mt-1.5 w-full accent-indigo-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Reading age
                  </label>
                  <select
                    value={readingAge}
                    onChange={(e) => setReadingAge(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-800 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  >
                    <option value={4}>4–5 years</option>
                    <option value={6}>6–7 years</option>
                    <option value={8}>8–9 years</option>
                    <option value={10}>10+ years</option>
                  </select>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Story area */}
        <main className="flex flex-1 flex-col px-4 pb-4 pt-6 md:px-10 md:pb-8 md:pt-10">
          <section className="flex-1 rounded-3xl bg-white/90 p-6 shadow-md ring-1 ring-indigo-100 md:p-10">
            <div className="flex h-full flex-col">
              <div className="mb-4 flex items-center justify-between text-xs font-medium uppercase tracking-wide text-indigo-400 md:text-sm">
                <span>Story page</span>
                <span>
                  Page {currentPage + 1} of {totalPages}
                </span>
              </div>

              <div className="flex-1">
                <p className="text-2xl leading-relaxed text-slate-900 md:text-[2.25rem] md:leading-snug">
                  {currentPageWords}
                </p>
              </div>
            </div>
          </section>

          {/* Navigation */}
          <nav className="mt-4 flex flex-col items-center gap-3 rounded-2xl bg-white/80 px-4 py-3 text-sm text-slate-700 shadow-md ring-1 ring-indigo-100 md:mt-6 md:flex-row md:justify-between md:px-6 md:py-4">
            <div className="flex items-center gap-2 text-xs md:text-sm">
              <span className="inline-flex h-6 items-center rounded-full bg-indigo-50 px-3 text-[11px] font-medium text-indigo-700 md:h-7 md:text-xs">
                Page {currentPage + 1} of {totalPages}
              </span>
              <span className="hidden text-[11px] text-slate-500 md:inline">
                {words.length} words total
              </span>
            </div>

            <div className="flex w-full items-center justify-end gap-2 md:w-auto">
              <button
                type="button"
                onClick={handleStartOver}
                title="Start over"
                className="hidden h-9 w-9 items-center justify-center rounded-full border border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 md:inline-flex"
              >
                <span className="sr-only">Start over</span>
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M4 4v6h6"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M5 13a7 7 0 1 0 2-5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              <button
                type="button"
                onClick={handlePrevious}
                disabled={currentPage === 0}
                title="Previous page"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-100 disabled:text-slate-300"
              >
                <span className="sr-only">Previous page</span>
                <svg
                  className="h-5 w-5"
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
                title="Next page"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-transparent bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-200"
              >
                <span className="sr-only">Next page</span>
                <svg
                  className="h-5 w-5"
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

              <button
                type="button"
                onClick={handleStartOver}
                title="Start over"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 md:hidden"
              >
                <span className="sr-only">Start over</span>
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M4 4v6h6"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M5 13a7 7 0 1 0 2-5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </nav>
        </main>
      </div>
    </div>
  );
}
