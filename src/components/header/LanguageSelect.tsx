"use client";

import { useEffect, useRef, useState } from "react";
import { LANGUAGES, SITE_LANGUAGE, findLanguage, matchBrowserLanguage } from "@/lib/languages";

// How it works
// - Google's website translator reads the "googtrans" cookie (/en/<code>) and translates
//   the whole page, including your own texts.
// - The Google script is only loaded when a language other than English is active,
//   so English visitors never contact Google.
// - First visit: if the browser prefers a language we offer, it's used automatically.
//   A manual choice is remembered on this device and always wins.

const CHOICE_KEY = "tp-lang";

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: { translate?: { TranslateElement: new (options: object, elementId: string) => unknown } };
    __tpDomPatched?: boolean;
  }
}

function readTranslateCookie(): string | null {
  const m = document.cookie.match(/(?:^|;\s*)googtrans=([^;]+)/);
  if (!m) return null;
  const target = decodeURIComponent(m[1]).split("/")[2];
  return target || null;
}

/** Cookie for this host and, on a real domain, for the parent domain too (Google checks both). */
function writeTranslateCookie(code: string | null) {
  const host = location.hostname;
  const domains = [""];
  if (host.includes(".") && !/^[\d.]+$/.test(host)) {
    const root = host.split(".").slice(-2).join(".");
    domains.push(`; domain=${root}`, `; domain=.${root}`);
  }
  for (const d of domains) {
    document.cookie = code
      ? `googtrans=/${SITE_LANGUAGE}/${code}; path=/${d}; max-age=31536000; SameSite=Lax`
      : `googtrans=; path=/${d}; max-age=0`;
  }
}

/**
 * Google's translator wraps text in <font> tags, which can confuse React when it later
 * updates that text ("removeChild" errors). This well-known guard makes those calls safe.
 */
function patchDomForTranslation() {
  if (window.__tpDomPatched) return;
  window.__tpDomPatched = true;
  const removeChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(this: Node, child: T): T {
    if (child.parentNode !== this) return child;
    return removeChild.call(this, child) as T;
  };
  const insertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(this: Node, node: T, ref: Node | null): T {
    if (ref && ref.parentNode !== this) return node;
    return insertBefore.call(this, node, ref) as T;
  };
}

function loadGoogleTranslate() {
  if (document.getElementById("google-translate-script")) return;
  patchDomForTranslation();
  if (!document.getElementById("google_translate_element")) {
    const holder = document.createElement("div");
    holder.id = "google_translate_element";
    document.body.appendChild(holder);
  }
  window.googleTranslateElementInit = () => {
    const TE = window.google?.translate?.TranslateElement;
    if (TE) new TE({ pageLanguage: SITE_LANGUAGE, autoDisplay: false }, "google_translate_element");
  };
  const script = document.createElement("script");
  script.id = "google-translate-script";
  script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
  script.async = true;
  document.body.appendChild(script);
}

export function LanguageSelect() {
  const [lang, setLang] = useState<string>(SITE_LANGUAGE);

  useEffect(() => {
    let current = readTranslateCookie();
    if (!current) {
      let saved: string | null = null;
      try {
        saved = localStorage.getItem(CHOICE_KEY);
      } catch {
        /* ignore */
      }
      if (!saved) {
        // First visit: use the browser's preferred language if we offer it.
        const preferred = (navigator.languages?.length ? navigator.languages : [navigator.language])
          .map(matchBrowserLanguage)
          .find(Boolean);
        if (preferred && preferred !== SITE_LANGUAGE) {
          writeTranslateCookie(preferred);
          current = preferred;
        }
      } else if (saved !== SITE_LANGUAGE) {
        writeTranslateCookie(saved);
        current = saved;
      }
    }
    if (current && current !== SITE_LANGUAGE) {
      setLang(current);
      loadGoogleTranslate();
    }
  }, []);

  function choose(code: string) {
    try {
      localStorage.setItem(CHOICE_KEY, code);
    } catch {
      /* ignore */
    }
    writeTranslateCookie(code === SITE_LANGUAGE ? null : code);
    // Reloading is the most reliable way to switch (or undo) Google's translation.
    location.reload();
  }

  const active = findLanguage(lang);
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);

  // Close on Escape or a click outside; focus the current language when opening.
  useEffect(() => {
    if (!open) return;
    list.current?.querySelector<HTMLButtonElement>('[data-selected="true"]')?.focus({ preventScroll: false });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        wrapper.current?.querySelector<HTMLButtonElement>("button")?.focus();
      }
    };
    const onClick = (e: MouseEvent) => {
      if (wrapper.current && !wrapper.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, [open]);

  /** Arrow keys, Home and End move between languages. */
  function onListKey(e: React.KeyboardEvent<HTMLUListElement>) {
    const items = [...(list.current?.querySelectorAll<HTMLButtonElement>("button") ?? [])];
    const i = items.indexOf(document.activeElement as HTMLButtonElement);
    const go = (n: number) => {
      e.preventDefault();
      items[Math.max(0, Math.min(items.length - 1, n))]?.focus();
    };
    if (e.key === "ArrowDown") go(i + 1);
    else if (e.key === "ArrowUp") go(i - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(items.length - 1);
  }

  return (
    // "notranslate" keeps the language names in their own language.
    <div ref={wrapper} className="notranslate relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Language: ${active.name}`}
        className="flex h-10 items-center gap-1.5 px-2 text-sm font-medium text-black hover:text-neutral-600"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3Z" />
        </svg>
        {/* Very narrow phones show just the globe, so everything fits on one row. */}
        <span aria-hidden className="hidden min-[390px]:inline">
          {active.short}
        </span>
        <svg
          viewBox="0 0 24 24"
          width="12"
          height="12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
          className={`hidden transition-transform min-[390px]:block ${open ? "rotate-180" : ""}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <ul
          ref={list}
          role="listbox"
          aria-label="Language"
          onKeyDown={onListKey}
          className="absolute left-1/2 top-full z-30 mt-1 -translate-x-1/2 lg:left-auto lg:right-0 lg:translate-x-0 max-h-[min(24rem,70vh)] w-56 overflow-y-auto border border-neutral-200 bg-white py-1 shadow-lg"
        >
          {LANGUAGES.map((l) => {
            const selected = l.code === active.code;
            return (
              <li key={l.code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  data-selected={selected}
                  lang={l.code}
                  onClick={() => (selected ? setOpen(false) : choose(l.code))}
                  className={`flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm outline-none hover:bg-neutral-100 focus-visible:bg-neutral-100 ${
                    selected ? "font-semibold text-black" : "text-neutral-700"
                  }`}
                >
                  <span>{l.name}</span>
                  {selected && (
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                      <path d="m5 12 5 5 9-10" />
                    </svg>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
