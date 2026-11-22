import Link from "next/link";
import type { PublicReview, RatingSummary } from "@/lib/reviews";
import { ReviewForm } from "./ReviewForm";
import { Stars } from "./Stars";

/** "Reviews" block under a product: average, star breakdown, the reviews and the form. */
export function ReviewsSection({
  handle,
  productTitle,
  signedIn,
  reviews,
  summary,
  own,
}: {
  handle: string;
  productTitle: string;
  signedIn: boolean;
  reviews: PublicReview[];
  summary: RatingSummary;
  own: { rating: number; title: string; body: string } | null;
}) {
  const counts = [5, 4, 3, 2, 1].map((n) => ({ n, count: reviews.filter((r) => r.rating === n).length }));
  const loginHref = `/account/login?next=${encodeURIComponent(`/products/${handle}#reviews`)}`;

  return (
    <section id="reviews" aria-labelledby="reviews-heading" className="mx-auto max-w-6xl scroll-mt-24 border-t border-neutral-200 px-4 py-16 sm:px-6">
      <div className="grid gap-10 md:grid-cols-[1fr_2fr] md:gap-16">
        {/* Summary */}
        <div>
          <h2 id="reviews-heading" className="text-xs font-semibold uppercase tracking-[0.2em] text-black">
            Reviews
          </h2>
          {summary.count > 0 ? (
            <>
              <div className="mt-4 flex items-end gap-3">
                <span className="text-4xl font-semibold text-black">{summary.average.toFixed(1)}</span>
                <span className="pb-1.5">
                  <Stars value={summary.average} size={18} />
                </span>
              </div>
              <p className="mt-1 text-sm text-neutral-600">
                Based on {summary.count} {summary.count === 1 ? "review" : "reviews"}
              </p>
              <ul className="mt-5 space-y-1.5" aria-label="Ratings breakdown">
                {counts.map(({ n, count }) => (
                  <li key={n} className="flex items-center gap-3 text-xs text-neutral-600">
                    <span className="w-10 shrink-0">{n} star</span>
                    <span className="h-1.5 flex-1 bg-neutral-200">
                      <span className="block h-full bg-black" style={{ width: `${reviews.length ? (count / reviews.length) * 100 : 0}%` }} />
                    </span>
                    <span className="w-6 shrink-0 text-right">{count}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="mt-4 text-sm text-neutral-600">No reviews yet. Be the first to share what you think of {productTitle}.</p>
          )}
        </div>

        {/* Form and list */}
        <div className="space-y-8">
          {signedIn ? (
            <ReviewForm handle={handle} own={own} />
          ) : (
            <p className="border border-neutral-200 bg-neutral-50 px-5 py-4 text-sm text-neutral-700">
              <Link href={loginHref} className="font-medium text-black underline underline-offset-4">
                Sign in
              </Link>{" "}
              to write a review.
            </p>
          )}

          {reviews.length > 0 && (
            <ul className="divide-y divide-neutral-200 border-y border-neutral-200">
              {reviews.map((r) => (
                <li key={r.id} className="py-6">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Stars value={r.rating} size={14} />
                    <span className="text-xs text-neutral-500">
                      {r.author}
                      {r.mine && " (you)"} ·{" "}
                      <time dateTime={r.date.toISOString()}>{r.date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</time>
                    </span>
                  </div>
                  {r.title && <p className="mt-3 font-medium text-black">{r.title}</p>}
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-neutral-700">{r.body}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
