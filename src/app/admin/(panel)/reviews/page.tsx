import Link from "next/link";
import { Card, PageTitle, SavedNotice } from "@/components/admin/Card";
import { smallButtonClass } from "@/components/admin/styles";
import { ConfirmButton } from "@/components/admin/ui";
import { Stars } from "@/components/reviews/Stars";
import { getProducts } from "@/lib/catalog";
import { prisma } from "@/lib/db";
import { deleteReviewAction } from "../../actions";

const dateTime = (d: Date) =>
  d.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Amsterdam" });

export default async function ReviewsAdmin({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  const [reviews, products, sp] = await Promise.all([
    prisma.review.findMany({ orderBy: { createdAt: "desc" }, take: 200, include: { customer: { select: { name: true, email: true } } } }),
    getProducts().catch(() => []),
    searchParams,
  ]);
  const titles = new Map(products.map((p) => [p.handle, p.title]));
  const average = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  return (
    <>
      <PageTitle
        title="Reviews"
        description="Reviews from signed-in customers appear on product pages straight away. Delete any that are spam or inappropriate. Times are Amsterdam time."
      />
      <SavedNotice show={sp.deleted === "1"}>Review deleted.</SavedNotice>

      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="border border-neutral-200 bg-white p-5">
          <p className="text-xs uppercase tracking-wider text-neutral-500">Reviews</p>
          <p className="mt-2 text-2xl font-semibold text-black">{reviews.length}</p>
        </div>
        <div className="border border-neutral-200 bg-white p-5">
          <p className="text-xs uppercase tracking-wider text-neutral-500">Average</p>
          <p className="mt-2 flex items-center gap-2 text-2xl font-semibold text-black">
            {reviews.length ? average.toFixed(1) : "—"}
            {reviews.length > 0 && <Stars value={average} size={16} />}
          </p>
        </div>
      </div>

      <Card>
        {reviews.length === 0 ? (
          <p className="text-sm text-neutral-600">No reviews yet. Signed-in customers can write one at the bottom of each product page.</p>
        ) : (
          <ul className="divide-y divide-neutral-200">
            {reviews.map((r) => (
              <li key={r.id} className="flex flex-col gap-3 py-5 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <Stars value={r.rating} size={14} />
                    <Link href={`/products/${r.handle}#reviews`} target="_blank" className="text-sm font-medium text-black underline underline-offset-4">
                      {titles.get(r.handle) ?? r.handle}
                    </Link>
                  </div>
                  {r.title && <p className="mt-2 font-medium text-black">{r.title}</p>}
                  <p className="mt-1 whitespace-pre-line text-sm text-neutral-700">{r.body}</p>
                  <p className="mt-2 break-all text-xs text-neutral-500">
                    {r.customer.name} · {r.customer.email} · {dateTime(r.createdAt)}
                    {r.updatedAt.getTime() - r.createdAt.getTime() > 60_000 && " · edited"}
                  </p>
                </div>
                <form action={deleteReviewAction} className="shrink-0">
                  <input type="hidden" name="id" value={r.id} />
                  <ConfirmButton className={smallButtonClass} message={`Delete this review by ${r.customer.name}? This can't be undone.`}>
                    Delete
                  </ConfirmButton>
                </form>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
