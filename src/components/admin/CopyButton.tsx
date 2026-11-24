"use client";

import { useState } from "react";
import { smallButtonClass } from "./styles";

/** Copies a text (an image URL) to the clipboard and says "Copied" for a moment. */
export function CopyButton({ text, label = "Copy URL" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={smallButtonClass}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          window.prompt("Copy this URL:", text);
        }
      }}
    >
      {copied ? "Copied ✓" : label}
    </button>
  );
}
