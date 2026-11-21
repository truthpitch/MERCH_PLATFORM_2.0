"use client";

import { useActionState } from "react";
import { PasswordInput } from "@/components/PasswordInput";
import { inputClass, labelClass } from "@/components/admin/styles";
import { loginAction, type LoginState } from "../actions";

export function LoginForm({ rememberedEmail }: { rememberedEmail: string }) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(loginAction, {});
  return (
    // autoComplete hints let the browser's password manager offer to save and fill the password.
    <form action={formAction} className="mt-8 space-y-4" autoComplete="on">
      <div>
        <label htmlFor="email" className={labelClass}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          defaultValue={rememberedEmail}
          required
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="password" className={labelClass}>
          Password
        </label>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          autoFocus={Boolean(rememberedEmail)}
          required
          className={inputClass}
        />
      </div>
      <label className="flex cursor-pointer items-start gap-3 text-sm text-neutral-700">
        <input
          type="checkbox"
          name="remember"
          className="mt-0.5 h-4 w-4 accent-black"
        />
        <span>
          Remember me
          <span className="block text-xs text-neutral-500">Stay signed in for 30 days on this device. Don&apos;t use on shared computers.</span>
        </span>
      </label>
      {state.error && <p className="text-sm text-neutral-800">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full bg-black px-4 py-3 text-sm font-medium text-white hover:bg-neutral-800 disabled:bg-neutral-400"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
