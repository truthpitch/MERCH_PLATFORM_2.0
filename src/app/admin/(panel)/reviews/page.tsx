import Link from "next/link";
import { Card, PageTitle, SavedNotice } from "@/components/admin/Card";
import { smallButtonClass } from "@/components/admin/styles";
import { ConfirmButton, SubmitButton } from "@/components/admin/ui";
import { Stars } from "@/components/reviews/Stars";
import { getProducts } from "@/lib/catalog";
import { prisma } from "@/lib/db";
import { approveReviewAction, deleteReviewAction, unapproveReviewAction } from "../../actions";

const dateTime = (d: Date) =>
  d.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Amsterdam" });

const FILTERS = [
  { key: "pending", label: "Waiting for approval" },
  { key: "approved", label: "Approved" },
  { key: "all", label: "All" },
] as const;
type Filter = (typeof FILTERS)[number]["key"];

const DONE: Record<string, string> = {
  approved: "Review approved. It's now visible on the product page.",
  hidden: "Review hidden. It's no longer on the website and waits for approval again.",
  deleted: "Review deleted.",
};

export default async function ReviewsAdmin({ searchParams }: { searchParams: Promise<{ status?: string; done?: string }> }) {
  const sp = await searchParams;
  const [pendingCount, approvedCount, avg] = await Promise.all([
    prisma.review.count({ where: { approved: false } }),
    prisma.review.count({ where: { approved: true } }),
    prisma.review.aggregate({ where: { approved: true }, _avg: { rating: true } }),
  ]);
  // Open on "Waiting for approval" when there's something to check.
  const status: Filter = FILTERS.some((f) => f.key === sp.status) ? (sp.status as Filter) : pendingCount > 0 ? "pending" : "all";

  const [reviews, products] = await Promise.all([
    prisma.review.findMany({
      where: status === "all" ? {} : { approved: status === "approved" },
      // Oldest pending first (first come, first served); otherwise newest first.
      orderBy: { updatedAt: status === "pending" ? "asc" : "desc" },
      take: 200,
      include: { customer: { select: { name: true, email: true } } },
    }),
    getProducts().catch(() => []),
  ]);
  const titles = new Map(products.map((p) => [p.handle, p.title]));
  const average = avg._avg.rating ?? 0;
  const counts: Record<Filter, number> = { pending: pendingCount, approved: approvedCount, all: pendingCount + approvedCount };

  return (
    <>
      <PageTitle
        title="Reviews"
        description="Customers' reviews only appear on the website after you approve them. Edited reviews come back here to be checked again. Times are Amsterdam time."
      />
      <SavedNotice show={Boolean(sp.done && DONE[sp.done])}>{sp.done ? DONE[sp.done] : ""}</SavedNotice>

      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className={`border bg-white p-5 ${pendingCount > 0 ? "border-black" : "border-neutral-200"}`}>
          <p className="text-xs uppercase tracking-wider text-neutral-500">Waiting</p>
          <p className="mt-2 text-2xl font-semibold text-black">{pendingCount}</p>
        </div>
        <div className="border border-neutral-200 bg-white p-5">
          <p className="text-xs uppercase tracking-wider text-neutral-500">Approved</p>
          <p className="mt-2 text-2xl font-semibold text-black">{approvedCount}</p>
        </div>
        <div className="border border-neutral-200 bg-white p-5">
          <p className="text-xs uppercase tracking-wider text-neutral-500">Average</p>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-2xl font-semibold text-black">
            {approvedCount ? average.toFixed(1) : "—"}
            {approvedCount > 0 && <Stars value={average} size={16} />}
          </p>
        </div>
      </div>

      <nav aria-label="Filter reviews" className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`/admin/reviews?status=${f.key}`}
            aria-current={status === f.key ? "page" : undefined}
            className={`border px-3 py-1.5 text-xs font-medium ${status === f.key ? "border-black bg-black text-white" : "border-neutral-300 bg-white text-neutral-700 hover:border-black"}`}
          >
            {f.label} ({counts[f.key]})
          </Link>
        ))}
      </nav>

      <Card>
        {reviews.length === 0 ? (
          <p className="text-sm text-neutral-600">
            {status === "pending" ? "Nothing waiting for approval. 🎉" : "No reviews yet. Signed-in customers can write one at the bottom of each product page."}
          </p>
        ) : (
          <ul className="divide-y divide-neutral-200">
            {reviews.map((r) => (
              <li key={r.id} className="flex flex-col gap-4 py-5 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${
                        r.approved ? "bg-black text-white" : "border border-black text-black"
                      }`}
                    >
                      {r.approved ? "Approved" : "Waiting"}
                    </span>
                    <Stars value={r.rating} size={14} />
                    <Link href={`/products/${r.handle}#reviews`} target="_blank" className="text-sm font-medium text-black underline underline-offset-4">
                      {titles.get(r.handle) ?? r.handle}
                    </Link>
                  </div>
                  {r.title && <p className="mt-2 font-medium text-black">{r.title}</p>}
                  <p className="mt-1 whitespace-pre-line text-sm text-neutral-700">{r.body}</p>
                  <p className="mt-2 break-all text-xs text-neutral-500">
                    {r.customer.name} · {r.customer.email} · sent {dateTime(r.updatedAt)}
                    {r.updatedAt.getTime() - r.createdAt.getTime() > 60_000 && " (edited)"}
                    {r.approved && r.approvedAt && ` · approved ${dateTime(r.approvedAt)}`}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {r.approved ? (
                    <form action={unapproveReviewAction}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="status" value={status} />
                      <button className={smallButtonClass}>Hide</button>
                    </form>
                  ) : (
                    <form action={approveReviewAction}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="status" value={status} />
                      <SubmitButton>Approve</SubmitButton>
                    </form>
                  )}
                  <form action={deleteReviewAction}>
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="status" value={status} />
                    <ConfirmButton className={smallButtonClass} message={`Delete this review by ${r.customer.name}? This can't be undone.`}>
                      Delete
                    </ConfirmButton>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
