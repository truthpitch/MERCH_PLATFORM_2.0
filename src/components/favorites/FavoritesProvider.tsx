"use client";

import { createContext, useContext, useEffect, useState, useTransition } from "react";
import { toggleFavoriteAction } from "@/app/(shop)/favorites/actions";

type FavoritesValue = {
  handles: string[];
  isFavorite: (handle: string) => boolean;
  toggle: (handle: string) => void;
};

const FavoritesContext = createContext<FavoritesValue | null>(null);

/**
 * Holds the visitor's favorites for every heart button and the header counter.
 * Clicking a heart updates the screen at once; the server saves it in the background
 * (database for accounts, cookie for guests).
 */
export function FavoritesProvider({ initial, children }: { initial: string[]; children: React.ReactNode }) {
  const [handles, setHandles] = useState(initial);
  const [, startTransition] = useTransition();
  const initialKey = initial.join(",");

  // When the server sends a new list (e.g. after signing in), use it.
  useEffect(() => {
    setHandles(initialKey ? initialKey.split(",") : []);
  }, [initialKey]);

  function toggle(handle: string) {
    const on = !handles.includes(handle);
    const previous = handles;
    setHandles(on ? [handle, ...handles] : handles.filter((h) => h !== handle));
    startTransition(async () => {
      const saved = await toggleFavoriteAction(handle, on).catch(() => null);
      setHandles(saved ?? previous);
    });
  }

  return (
    <FavoritesContext.Provider value={{ handles, isFavorite: (h) => handles.includes(h), toggle }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used inside <FavoritesProvider>.");
  return ctx;
}

export function HeartIcon({ filled, size = 20 }: { filled?: boolean; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path
        d="M12 20.5s-7.5-4.6-9.3-9.2C1.5 8.1 3.6 4.5 7.2 4.5c2 0 3.6 1.1 4.8 2.8 1.2-1.7 2.8-2.8 4.8-2.8 3.6 0 5.7 3.6 4.5 6.8-1.8 4.6-9.3 9.2-9.3 9.2Z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Heart toggle.
 * variant "overlay": round white button on a product image.
 * variant "full":    outlined button with text, for the product page.
 */
export function FavoriteButton({ handle, title, variant = "overlay" }: { handle: string; title: string; variant?: "overlay" | "full" }) {
  const { isFavorite, toggle } = useFavorites();
  const on = isFavorite(handle);
  const label = on ? `Remove ${title} from favorites` : `Add ${title} to favorites`;

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={() => toggle(handle)}
        aria-pressed={on}
        className="flex w-full items-center justify-center gap-2 border border-neutral-300 px-6 py-3 text-sm font-medium text-black hover:border-black"
      >
        <HeartIcon filled={on} size={18} />
        {on ? "Saved to favorites" : "Add to favorites"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => toggle(handle)}
      aria-pressed={on}
      aria-label={label}
      title={label}
      className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-black shadow-sm transition hover:bg-white"
    >
      <HeartIcon filled={on} size={18} />
    </button>
  );
}
