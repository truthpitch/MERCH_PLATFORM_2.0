"use client";

import { useState } from "react";

/** Eye icon; `off` draws it struck through (shown while the password is visible, meaning "hide"). */
function EyeIcon({ off }: { off: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
      {off && <path d="m3 3 18 18" />}
    </svg>
  );
}

/**
 * Password field with an eye button to show or hide what was typed. Starts hidden.
 * Takes the same props as a normal <input>; `className` styles the input itself.
 */
export function PasswordInput({ className = "", id, ...props }: Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & { id: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        {...props}
        id={id}
        type={visible ? "text" : "password"}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        className={`${className} pr-12`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        aria-controls={id}
        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-neutral-700 hover:text-black focus-visible:text-black"
      >
        <EyeIcon off={visible} />
      </button>
    </div>
  );
}
