"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, registerAction, type AccountField, type AccountState } from "./actions";

const inputClass =
  "w-full border border-neutral-300 bg-white px-3 py-3 text-base text-black outline-none placeholder:text-neutral-400 focus:border-black aria-[invalid]:border-black sm:text-sm";
const labelClass = "mb-1.5 block text-xs font-medium uppercase tracking-wider text-neutral-600";

function FieldError({ name, message }: { name: AccountField; message?: string }) {
  if (!message) return null;
  return (
    <p id={`${name}-error`} className="mt-1.5 text-sm font-medium text-black">
      {message}
    </p>
  );
}

/** Sign-in and registration form. `next` is where to go afterwards (e.g. back to the cart). */
export function AuthForm({ mode, next }: { mode: "login" | "register"; next: string }) {
  const [state, action, pending] = useActionState<AccountState, FormData>(mode === "login" ? loginAction : registerAction, {});
  const errors = state.fieldErrors ?? {};
  const values = state.values ?? {};
  const invalid = (name: AccountField) =>
    errors[name] ? { "aria-invalid": true as const, "aria-describedby": `${name}-error` } : {};
  const nextQuery = next !== "/account" ? `?next=${encodeURIComponent(next)}` : "";

  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="next" value={next} />
      {mode === "register" && (
        <div>
          <label htmlFor="name" className={labelClass}>
            Name
          </label>
          <input key={`n:${values.name ?? ""}`} id="name" name="name" defaultValue={values.name} autoComplete="name" maxLength={100} required className={inputClass} {...invalid("name")} />
          <FieldError name="name" message={errors.name} />
        </div>
      )}
      <div>
        <label htmlFor="email" className={labelClass}>
          Email
        </label>
        <input
          key={`e:${values.email ?? ""}`}
          id="email"
          name="email"
          type="email"
          defaultValue={values.email}
          autoComplete="email"
          maxLength={200}
          required
          className={inputClass}
          {...invalid("email")}
        />
        <FieldError name="email" message={errors.email} />
      </div>
      <div>
        <div className="flex items-baseline justify-between gap-4">
          <label htmlFor="password" className={labelClass}>
            Password
          </label>
          {mode === "login" && (
            <Link href="/account/forgot" className="text-xs text-neutral-600 underline underline-offset-2 hover:text-black">
              Forgot password?
            </Link>
          )}
        </div>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          minLength={mode === "register" ? 8 : undefined}
          maxLength={200}
          required
          className={inputClass}
          {...invalid("password")}
        />
        {mode === "register" && !errors.password && <p className="mt-1.5 text-xs text-neutral-500">At least 8 characters.</p>}
        <FieldError name="password" message={errors.password} />
      </div>

      {state.error && (
        <p role="alert" className="border border-neutral-300 bg-neutral-100 px-4 py-3 text-sm text-black">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-black px-6 py-4 text-sm font-medium uppercase tracking-wider text-white hover:bg-neutral-800 disabled:bg-neutral-400"
      >
        {pending ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
      </button>

      <p className="text-center text-sm text-neutral-600">
        {mode === "login" ? (
          <>
            New here?{" "}
            <Link href={`/account/register${nextQuery}`} className="font-medium text-black underline underline-offset-4">
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href={`/account/login${nextQuery}`} className="font-medium text-black underline underline-offset-4">
              Sign in
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
