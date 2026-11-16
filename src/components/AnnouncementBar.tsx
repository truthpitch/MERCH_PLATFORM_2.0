"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BAR_CLOSED_COOKIE } from "@/lib/announcement";

type Props = {
  text: string;
  timerLabel: string;
  endsAt: string | null; // ISO date; null = no countdown
  ctaLabel: string;
  ctaUrl: string;
  /** Changes whenever the offer changes, so a closed bar comes back for a new offer. */
  dismissKey: string;
};

function remaining(endsAt: string | null): number {
  return endsAt ? Math.max(0, new Date(endsAt).getTime() - Date.now()) : 0;
}

function TimeBox({ value, unit, label }: { value: number; unit: string; label: string }) {
  return (
    // The server and the browser can be a second apart, so the number may differ on first render.
    <span suppressHydrationWarning className="flex items-baseline gap-0.5 bg-white px-2 py-1 text-black" aria-label={`${value} ${label}`}>
      <span suppressHydrationWarning className="text-base font-bold tabular-nums leading-none sm:text-lg">
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-[10px] font-bold leading-none">{unit}</span>
    </span>
  );
}

/**
 * Optional bar above the menu for offers and news, set in the admin under Home.
 * Shows an optional live countdown and button, and can be closed with the ×.
 * It hides itself when the countdown reaches zero.
 */
export function AnnouncementBar({ text, timerLabel, endsAt, ctaLabel, ctaUrl, dismissKey }: Props) {
  const [left, setLeft] = useState(() => remaining(endsAt));
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    if (!endsAt) return;
    const id = setInterval(() => setLeft(remaining(endsAt)), 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  if (closed || (endsAt && left <= 0)) return null;

  function close() {
    document.cookie = `${BAR_CLOSED_COOKIE}=${encodeURIComponent(dismissKey)}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
    setClosed(true);
  }

  const totalSeconds = Math.floor(left / 1000);
  const days = Math.floor(totalSeconds / 86400);
  // Up to 99 hours the hours are shown in one box (like "68 H"); longer offers also get a days box.
  const showDays = totalSeconds >= 100 * 3600;
  const hours = showDays ? Math.floor((totalSeconds % 86400) / 3600) : Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const external = /^https?:\/\//i.test(ctaUrl);
  const buttonClass =
    "inline-flex shrink-0 items-center bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-black hover:bg-neutral-200";

  return (
    <div role="region" aria-label="Announcement" className="relative bg-black text-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-12 py-3 text-center md:flex-row md:justify-center md:gap-6">
        {endsAt && (
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5">
            {timerLabel && <span className="text-xs font-medium sm:text-sm">{timerLabel}</span>}
            <span className="flex gap-1.5" role="timer" aria-live="off">
              {showDays && <TimeBox value={days} unit="D" label="days" />}
              <TimeBox value={hours} unit="H" label="hours" />
              <TimeBox value={minutes} unit="M" label="minutes" />
              <TimeBox value={seconds} unit="S" label="seconds" />
            </span>
          </div>
        )}
        {(text || ctaLabel) && (
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            {text && <p className="text-base font-bold tracking-tight sm:text-lg">{text}</p>}
            {ctaLabel &&
              ctaUrl &&
              (external ? (
                <a href={ctaUrl} className={buttonClass}>
                  {ctaLabel}
                </a>
              ) : (
                <Link href={ctaUrl} className={buttonClass}>
                  {ctaLabel}
                </Link>
              ))}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={close}
        aria-label="Close announcement"
        className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center text-white hover:text-neutral-300 md:top-1/2 md:-translate-y-1/2"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>
    </div>
  );
}
