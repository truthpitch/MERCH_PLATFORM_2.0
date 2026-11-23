"use client";

import { useActionState, useEffect, useState } from "react";
import { deleteOwnReviewAction, saveReviewAction, type ReviewState } from "@/app/(shop)/products/[handle]/review-actions";

const STAR = "m12 2.5 2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8L12 2.5Z";
const LABELS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];
const inputClass =
  "w-full border border-neutral-300 bg-white px-3 py-3 text-base text-black outline-none placeholder:text-neutral-400 focus:border-black sm:text-sm";

/** Write or edit your review. Stars are real radio buttons, so they work with a keyboard too. */
export function ReviewForm({
  handle,
  own,
}: {
  handle: string;
  own: { rating: number; title: string; body: string; approved: boolean } | null;
}) {
  const [state, action, pending] = useActionState<ReviewState, FormData>(saveReviewAction, {});
  const [rating, setRating] = useState(own?.rating ?? 0);
  const [hover, setHover] = useState(0);
  const [open, setOpen] = useState(!own);
  const shown = hover || rating;

  // After a successful save, fold the form away (the review now shows in the list).
  useEffect(() => {
    if (state.saved) setOpen(false);
  }, [state]);

  if (own && !open) {
    const waiting = state.saved || !own.approved;
    return (
      <div className="flex flex-wrap items-center gap-3 text-sm">
        {waiting ? (
          <p role="status" className="w-full border border-neutral-200 bg-neutral-50 px-4 py-3 text-neutral-700">
            <span className="font-medium text-black">{state.saved ? "Thanks for your review! " : "Your review is waiting for approval. "}</span>
            {state.saved
              ? "We check every review before it's published, so it will appear here once it's approved."
              : "It will appear for everyone once it's approved. Only you can see it until then."}
          </p>
        ) : (
          <span className="text-neutral-600">You&apos;ve reviewed this product.</span>
        )}
        <button type="button" onClick={() => setOpen(true)} className="font-medium text-black underline underline-offset-4">
          Edit your review
        </button>
        <form action={deleteOwnReviewAction}>
          <input type="hidden" name="handle" value={handle} />
          <button
            className="text-neutral-600 underline underline-offset-4 hover:text-black"
            onClick={(e) => {
              if (!window.confirm("Delete your review?")) e.preventDefault();
            }}
          >
            Delete
          </button>
        </form>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5 border border-neutral-200 p-5 sm:p-6">
      <input type="hidden" name="handle" value={handle} />
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black">{own ? "Edit your review" : "Write a review"}</p>

      <fieldset>
        <legend className="mb-2 text-xs font-medium uppercase tracking-wider text-neutral-600">Your rating</legend>
        <div className="flex items-center gap-3">
          <div className="flex" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <label key={n} className="cursor-pointer p-0.5" onMouseEnter={() => setHover(n)}>
                <input
                  type="radio"
                  name="rating"
                  value={n}
                  checked={rating === n}
                  onChange={() => setRating(n)}
                  className="peer sr-only"
                  aria-label={`${n} ${n === 1 ? "star" : "stars"}: ${LABELS[n]}`}
                />
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  aria-hidden
                  className={`rounded-sm peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-black ${n <= shown ? "text-black" : "text-neutral-300"}`}
                  fill="currentColor"
                >
                  <path d={STAR} />
                </svg>
              </label>
            ))}
          </div>
          <span className="text-sm text-neutral-600" aria-live="polite">
            {LABELS[shown]}
          </span>
        </div>
      </fieldset>

      <div>
        <label htmlFor="review-title" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-neutral-600">
          Title <span className="normal-case tracking-normal text-neutral-400">(optional)</span>
        </label>
        <input id="review-title" name="title" defaultValue={own?.title} maxLength={120} className={inputClass} />
      </div>
      <div>
        <label htmlFor="review-body" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-neutral-600">
          Your review
        </label>
        <textarea
          id="review-body"
          name="body"
          rows={4}
          defaultValue={own?.body}
          maxLength={2000}
          required
          placeholder="How's the fit, the print, the quality?"
          className={inputClass}
        />
      </div>

      {state.error && (
        <p role="alert" className="border border-neutral-300 bg-neutral-100 px-4 py-3 text-sm text-black">
          {state.error}
        </p>
      )}
      {state.saved && !own && (
        <p role="status" className="border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
          <span className="font-medium text-black">Thanks for your review! </span>
          We check every review before it&apos;s published, so it will appear here once it&apos;s approved.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={pending || rating === 0}
          className="bg-black px-6 py-3 text-sm font-medium uppercase tracking-wider text-white hover:bg-neutral-800 disabled:bg-neutral-400"
        >
          {pending ? "Sending…" : own ? "Send changes for approval" : "Send review for approval"}
        </button>
        {own && (
          <button type="button" onClick={() => setOpen(false)} className="text-sm text-neutral-600 underline underline-offset-4 hover:text-black">
            Cancel
          </button>
        )}
        {rating === 0 && <span className="text-xs text-neutral-500">Choose a star rating first.</span>}
      </div>
      <ul className="list-disc space-y-1 pl-4 text-xs text-neutral-500">
        <li>
          <strong className="font-medium text-neutral-700">Reviews are checked before they&apos;re published.</strong> Yours appears once it&apos;s approved
          {own ? "; edited reviews are checked again" : ""}.
        </li>
        <li>
          Your review is shown with your first name and the first letter of your last name (see our{" "}
          <a href="/privacy-policy" className="underline underline-offset-2 hover:text-black">
            privacy policy
          </a>
          ).
        </li>
      </ul>
    </form>
  );
}
