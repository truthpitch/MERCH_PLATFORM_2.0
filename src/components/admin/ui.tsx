"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({ children, variant = "primary" }: { children: React.ReactNode; variant?: "primary" | "secondary" }) {
  const { pending } = useFormStatus();
  const styles =
    variant === "primary"
      ? "bg-black text-white hover:bg-neutral-800 disabled:bg-neutral-400"
      : "border border-neutral-300 bg-white text-black hover:border-black disabled:text-neutral-400";
  return (
    <button type="submit" disabled={pending} className={`px-4 py-2 text-sm font-medium ${styles}`}>
      {pending ? "Saving…" : children}
    </button>
  );
}

/** Submit button that asks "are you sure?" first, for actions that can't be undone. */
export function ConfirmButton({ children, message, className }: { children: React.ReactNode; message: string; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
      className={className}
    >
      {pending ? "Working…" : children}
    </button>
  );
}
