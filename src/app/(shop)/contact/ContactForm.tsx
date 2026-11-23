"use client";

import Link from "next/link";
import { useActionState } from "react";
import { submitContactAction, type ContactField, type ContactState } from "./actions";

const inputClass =
  "w-full border border-neutral-300 bg-white px-3 py-3 text-base text-black outline-none placeholder:text-neutral-400 focus:border-black aria-[invalid]:border-black sm:text-sm";
const labelClass = "mb-1.5 block text-xs font-medium uppercase tracking-wider text-neutral-600";

function FieldError({ name, message }: { name: ContactField; message?: string }) {
  if (!message) return null;
  return (
    <p id={`${name}-error`} className="mt-1.5 text-sm font-medium text-black">
      {message}
    </p>
  );
}

export function ContactForm() {
  const [state, action, pending] = useActionState<ContactState, FormData>(submitContactAction, {});

  if (state.ok) {
    return (
      <div className="border border-neutral-200 bg-neutral-50 p-8" role="status">
        <p className="text-lg font-semibold text-black">Thanks, your message has been sent.</p>
        <p className="mt-2 text-sm text-neutral-600">We&apos;ll reply to the email address you gave us as soon as we can.</p>
      </div>
    );
  }

  const values = state.values ?? {};
  const errors = state.fieldErrors ?? {};
  // Each input gets a key from its returned value so it re-mounts with what the visitor typed.
  const k = (name: ContactField) => `${name}:${values[name] ?? ""}`;
  const field = (name: ContactField) => ({
    id: name,
    name,
    defaultValue: values[name] ?? "",
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `${name}-error` : undefined,
  });

  return (
    <form action={action} className="space-y-5" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className={labelClass}>
            Name *
          </label>
          <input key={k("name")} {...field("name")} autoComplete="name" maxLength={100} required className={inputClass} />
          <FieldError name="name" message={errors.name} />
        </div>
        <div>
          <label htmlFor="email" className={labelClass}>
            Email *
          </label>
          <input key={k("email")} {...field("email")} type="email" autoComplete="email" maxLength={200} required className={inputClass} />
          <FieldError name="email" message={errors.email} />
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="subject" className={labelClass}>
            Subject
          </label>
          <input key={k("subject")} {...field("subject")} maxLength={150} className={inputClass} />
        </div>
        <div>
          <label htmlFor="orderNumber" className={labelClass}>
            Order number <span className="normal-case tracking-normal text-neutral-400">(optional)</span>
          </label>
          <input key={k("orderNumber")} {...field("orderNumber")} maxLength={50} placeholder="#1001" className={inputClass} />
        </div>
      </div>
      <div>
        <label htmlFor="message" className={labelClass}>
          Message *
        </label>
        <textarea key={k("message")} {...field("message")} rows={7} maxLength={5000} required className={inputClass} />
        <FieldError name="message" message={errors.message} />
      </div>

      {/* Honeypot for spam bots: hidden from people and screen readers. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {state.error && <p className="border border-neutral-300 bg-neutral-100 px-4 py-3 text-sm text-black">{state.error}</p>}

      <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-neutral-500">
          * Required. We only use your details to answer your message. See our{" "}
          <Link href="/privacy-policy" className="underline underline-offset-2 hover:text-black">
            privacy policy
          </Link>
          .
        </p>
        <button
          type="submit"
          disabled={pending}
          className="bg-black px-8 py-3 text-sm font-medium text-white hover:bg-neutral-800 disabled:bg-neutral-400"
        >
          {pending ? "Sending…" : "Send message"}
        </button>
      </div>
    </form>
  );
}
