"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CONSENT_COOKIE, CONSENT_EVENT, OPEN_CONSENT_EVENT, readConsent, type ConsentChoice } from "@/lib/consent";

/** Saves the choice for a year in a cookie (that cookie itself is a necessary one). */
function saveChoice(choice: ConsentChoice) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CONSENT_COOKIE}=${choice}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax${secure}`;
  if (choice === "rejected") {
    // Forget the random visitor id from earlier visits.
    try {
      localStorage.removeItem("tp_vid");
      sessionStorage.removeItem("tp_sid");
    } catch {}
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: choice }));
  // Count the choice (no personal data, just "accepted" or "rejected").
  fetch("/api/consent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ choice }), keepalive: true }).catch(() => {});
}

/**
 * Cookie banner: shown until the visitor clicks Reject or Accept. Reject is as easy as Accept.
 * The footer's "Cookie settings" link opens it again so a choice can be changed.
 */
export function CookieBanner() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<ConsentChoice | null>(null);

  useEffect(() => {
    const choice = readConsent(document.cookie);
    setCurrent(choice);
    if (!choice) setOpen(true);
    const reopen = () => {
      setCurrent(readConsent(document.cookie));
      setOpen(true);
    };
    window.addEventListener(OPEN_CONSENT_EVENT, reopen);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, reopen);
  }, []);

  if (!open) return null;

  const choose = (choice: ConsentChoice) => {
    saveChoice(choice);
    setCurrent(choice);
    setOpen(false);
  };

  return (
    <div role="dialog" aria-modal="false" aria-labelledby="cookie-title" className="fixed inset-x-0 bottom-0 z-50 border-t border-neutral-300 bg-white shadow-[0_-8px_30px_rgba(0,0,0,0.12)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 sm:px-6 md:flex-row md:items-center md:justify-between md:gap-8">
        <div className="max-w-3xl text-sm text-neutral-700">
          <p id="cookie-title" className="font-semibold text-black">
            Cookies on TruthPitch
          </p>
          <p className="mt-1">
            We use necessary cookies to keep the shop working (your cart and sign-in). With your OK, we also use analytics cookies to see anonymously how visitors use
            the site, so we can make it better. No advertising cookies.{" "}
            <Link href="/cookie-policy" className="text-black underline underline-offset-2">
              Cookie policy
            </Link>
          </p>
          {current && <p className="mt-1 text-xs text-neutral-500">Your current choice: {current === "accepted" ? "accepted" : "rejected"}.</p>}
        </div>
        <div className="grid shrink-0 grid-cols-2 gap-2 md:flex">
          <button type="button" onClick={() => choose("rejected")} className="min-w-28 border border-black bg-white px-5 py-3 text-sm font-medium text-black hover:bg-neutral-100">
            Reject
          </button>
          <button type="button" onClick={() => choose("accepted")} className="min-w-28 border border-black bg-black px-5 py-3 text-sm font-medium text-white hover:bg-neutral-800">
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}

/** Footer link that opens the cookie banner again. */
export function CookieSettingsLink({ className }: { className?: string }) {
  return (
    <button type="button" onClick={() => window.dispatchEvent(new Event(OPEN_CONSENT_EVENT))} className={className}>
      Cookie settings
    </button>
  );
}
