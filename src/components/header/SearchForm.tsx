"use client";

import { usePathname, useSearchParams } from "next/navigation";

/** Header search: type keywords, then press the magnifier (or Enter) to open /search. */
export function SearchForm({ id, className = "" }: { id: string; className?: string }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const current = pathname === "/search" ? (params.get("q") ?? "") : "";

  return (
    <form action="/search" method="get" role="search" className={`flex min-w-0 ${className}`}>
      <label htmlFor={id} className="sr-only">
        Search products
      </label>
      <input
        // key: refill the field when the search page's query changes
        key={current}
        id={id}
        name="q"
        type="search"
        required
        maxLength={100}
        defaultValue={current}
        placeholder="Search products"
        autoComplete="off"
        enterKeyHint="search"
        className="min-w-0 flex-1 border border-r-0 border-neutral-300 bg-white px-3 text-base text-black outline-none placeholder:text-neutral-400 focus:border-black sm:text-sm [&::-webkit-search-cancel-button]:hidden"
      />
      <button
        type="submit"
        aria-label="Search"
        title="Search"
        className="flex w-11 shrink-0 items-center justify-center bg-black text-white hover:bg-neutral-800"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" strokeLinecap="round" />
        </svg>
      </button>
    </form>
  );
}
