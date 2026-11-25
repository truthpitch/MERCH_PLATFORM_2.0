"use client";

import { useActionState } from "react";
import { submitCommentAction, type CommentState } from "@/app/(shop)/blog/[slug]/comment-actions";
import { COMMENT_MAX, COMMENT_NAME_MAX } from "@/lib/blog-comment-limits";

const inputClass =
  "w-full border border-neutral-300 bg-white px-3 py-3 text-base text-black outline-none placeholder:text-neutral-400 focus:border-black sm:text-sm";
const labelClass = "mb-1.5 block text-xs font-medium uppercase tracking-wider text-neutral-600";

/** Write a reply. Signed-in customers don't need to fill in a name. */
export function CommentForm({ slug, signedInAs }: { slug: string; signedInAs: string | null }) {
  const [state, action, pending] = useActionState<CommentState, FormData>(submitCommentAction, {});

  if (state.sent) {
    return (
      <p role="status" className="border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
        <span className="font-medium text-black">Thanks for your reply! </span>
        We read every reply before it&apos;s published, so it will appear here once it&apos;s approved.
      </p>
    );
  }

  return (
    <form action={action} className="space-y-5 border border-neutral-200 p-5 sm:p-6">
      <input type="hidden" name="slug" value={slug} />
      {/* Honeypot for spam bots: hidden from people and screen readers. */}
      <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden>
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black">Write a reply</p>

      {signedInAs ? (
        <p className="text-sm text-neutral-600">
          Your reply is shown as <strong className="font-medium text-black">{signedInAs}</strong>.
        </p>
      ) : (
        <div>
          <label htmlFor="comment-name" className={labelClass}>
            Your name
          </label>
          <input
            id="comment-name"
            name="name"
            defaultValue={state.values?.name}
            maxLength={COMMENT_NAME_MAX}
            required
            autoComplete="given-name"
            className={inputClass}
          />
        </div>
      )}
      <div>
        <label htmlFor="comment-body" className={labelClass}>
          Your reply
        </label>
        <textarea
          id="comment-body"
          name="body"
          rows={4}
          defaultValue={state.values?.body}
          maxLength={COMMENT_MAX}
          required
          placeholder="What do you think?"
          className={inputClass}
        />
      </div>

      {state.error && (
        <p role="alert" className="border border-neutral-300 bg-neutral-100 px-4 py-3 text-sm text-black">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="bg-black px-6 py-3 text-sm font-medium uppercase tracking-wider text-white hover:bg-neutral-800 disabled:bg-neutral-400"
      >
        {pending ? "Sending…" : "Send reply for approval"}
      </button>
      <p className="text-xs text-neutral-500">
        Replies are checked before they&apos;re published. Your name and reply are shown publicly; please don&apos;t share personal details (see our{" "}
        <a href="/privacy-policy" className="underline underline-offset-2 hover:text-black">
          privacy policy
        </a>
        ).
      </p>
    </form>
  );
}
