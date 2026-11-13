"use client";

import { useActionState } from "react";
import { inputClass, labelClass } from "@/components/admin/styles";
import { loginAction, type LoginState } from "../actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(loginAction, {});
  return (
    <form action={formAction} className="mt-8 space-y-4">
      <div>
        <label htmlFor="email" className={labelClass}>
          Email
        </label>
        <input id="email" name="email" type="email" autoComplete="username" required className={inputClass} />
      </div>
      <div>
        <label htmlFor="password" className={labelClass}>
          Password
        </label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className={inputClass} />
      </div>
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
