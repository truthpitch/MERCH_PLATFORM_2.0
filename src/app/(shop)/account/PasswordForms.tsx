"use client";

import Link from "next/link";
import { useActionState } from "react";
import { forgotPasswordAction, resetPasswordAction, type ForgotState, type ResetState } from "./password-actions";

const inputClass =
  "w-full border border-neutral-300 bg-white px-3 py-3 text-base text-black outline-none placeholder:text-neutral-400 focus:border-black sm:text-sm";
const labelClass = "mb-1.5 block text-xs font-medium uppercase tracking-wider text-neutral-600";
const buttonClass =
  "w-full bg-black px-6 py-4 text-sm font-medium uppercase tracking-wider text-white hover:bg-neutral-800 disabled:bg-neutral-400";

function ErrorBox({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="border border-neutral-300 bg-neutral-100 px-4 py-3 text-sm text-black">
      {message}
    </p>
  );
}

export function ForgotForm() {
  const [state, action, pending] = useActionState<ForgotState, FormData>(forgotPasswordAction, {});

  if (state.sent) {
    return (
      <div role="status" className="border border-neutral-200 bg-neutral-50 p-6">
        <p className="font-semibold text-black">Check your inbox</p>
        <p className="mt-2 text-sm text-neutral-600">
          If an account exists for <span className="font-medium text-black">{state.email}</span>, we&apos;ve sent a link to choose a new
          password. It expires in 1 hour. Nothing there? Check your spam folder.
        </p>
        <Link href="/account/login" className="mt-4 inline-block text-sm text-black underline underline-offset-4">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5" noValidate>
      <div>
        <label htmlFor="email" className={labelClass}>
          Email
        </label>
        <input key={state.email} id="email" name="email" type="email" defaultValue={state.email} autoComplete="email" maxLength={200} required className={inputClass} />
      </div>
      <ErrorBox message={state.error} />
      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "Sending…" : "Send reset link"}
      </button>
      <p className="text-center text-sm text-neutral-600">
        Remembered it?{" "}
        <Link href="/account/login" className="font-medium text-black underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<ResetState, FormData>(resetPasswordAction, {});
  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="token" value={token} />
      {/* Lets password managers save the new password for the right account. */}
      <input type="text" name="username" autoComplete="username" hidden readOnly />
      <div>
        <label htmlFor="password" className={labelClass}>
          New password
        </label>
        <input id="password" name="password" type="password" autoComplete="new-password" minLength={8} maxLength={200} required className={inputClass} />
        <p className="mt-1.5 text-xs text-neutral-500">At least 8 characters.</p>
      </div>
      <div>
        <label htmlFor="confirm" className={labelClass}>
          Repeat new password
        </label>
        <input id="confirm" name="confirm" type="password" autoComplete="new-password" maxLength={200} required className={inputClass} />
      </div>
      <ErrorBox message={state.error} />
      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "Saving…" : "Save new password"}
      </button>
    </form>
  );
}
