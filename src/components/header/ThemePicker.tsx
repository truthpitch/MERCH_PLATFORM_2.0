"use client";

import { useEffect, useRef, useState } from "react";
import { THEMES, isThemeId, themeById, type Theme } from "@/lib/themes";

// The theme menu in the header. Only shown when the admin lets visitors choose
// (admin → Theme). The choice is remembered on this device (localStorage "tp-theme");
// The first option goes back to the shop's default ("Automatic" = light or dark like the device).

const KEY = "tp-theme";
const deviceTheme = () => (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

/** A small circle showing the theme's background, text and button colours. */
export function ThemeSwatch({ theme, size = 20 }: { theme: Pick<Theme, "bg" | "ink" | "accent">; size?: number }) {
  return (
    <span
      aria-hidden
      className="inline-block shrink-0 rounded-full border border-neutral-300"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${theme.bg} 0 50%, ${theme.ink} 50% 75%, ${theme.accent ?? theme.ink} 75% 100%)`,
      }}
    />
  );
}

export function ThemePicker({ defaultTheme }: { defaultTheme: string }) {
  const [choice, setChoice] = useState<string | null>(null); // a saved theme, or "default"
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(KEY);
    } catch {
      /* ignore */
    }
    setChoice(isThemeId(saved) ? saved : "default");
  }, [defaultTheme]);

  function choose(id: string) {
    try {
      if (id === "default") localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, id);
    } catch {
      /* private mode: still switches for this visit */
    }
    const resolved = id === "default" ? (defaultTheme === "auto" ? deviceTheme() : defaultTheme) : id;
    document.documentElement.setAttribute("data-theme", resolved);
    setChoice(id);
    setOpen(false);
  }

  // Close on Escape or a click outside; focus the current theme when opening.
  useEffect(() => {
    if (!open) return;
    list.current?.querySelector<HTMLButtonElement>('[data-selected="true"]')?.focus();
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

  const shopDefault = themeById(defaultTheme);
  const options = [{ id: "default", name: shopDefault ? `Shop default (${shopDefault.name})` : "Automatic (like your device)", swatch: shopDefault }, ...THEMES.map((t) => ({ id: t.id, name: t.name, swatch: t }))];
  const current = options.find((o) => o.id === choice);

  return (
    <div ref={wrapper} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Theme${current ? `: ${current.name}` : ""}`}
        title="Choose a theme"
        className="flex h-10 w-9 items-center justify-center text-black hover:text-neutral-600 max-[359px]:w-8"
      >
        {/* Palette icon */}
        <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.8-.8 1.8-1.7 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-1 .8-1.7 1.8-1.7H16a5 5 0 0 0 5-5C21 6.4 17 3 12 3Z" strokeLinejoin="round" />
          <circle cx="7.5" cy="11" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="10" cy="7" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="15" cy="7.2" r="1.2" fill="currentColor" stroke="none" />
        </svg>
      </button>

      {open && (
        <ul
          ref={list}
          role="listbox"
          aria-label="Theme"
          onKeyDown={onListKey}
          className="absolute left-1/2 top-full z-30 mt-1 max-h-[min(30rem,75vh)] w-64 -translate-x-1/2 overflow-y-auto border border-neutral-200 bg-white py-1 shadow-lg lg:left-auto lg:right-0 lg:translate-x-0"
        >
          <li className="px-4 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-neutral-500">Theme</li>
          {options.map((o) => {
            const selected = o.id === choice;
            return (
              <li key={o.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  data-selected={selected}
                  onClick={() => choose(o.id)}
                  className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm outline-none hover:bg-neutral-100 focus-visible:bg-neutral-100 ${
                    selected ? "font-semibold text-black" : "text-neutral-700"
                  }`}
                >
                  {o.swatch ? (
                    <ThemeSwatch theme={o.swatch} />
                  ) : (
                    <span aria-hidden className="inline-block h-5 w-5 shrink-0 rounded-full border border-neutral-300" style={{ background: "linear-gradient(135deg,#fff 50%,#0a0a0a 50%)" }} />
                  )}
                  <span className="min-w-0 flex-1">{o.name}</span>
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
