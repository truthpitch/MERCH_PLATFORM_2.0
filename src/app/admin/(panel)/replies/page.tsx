import Link from "next/link";
import { Card, PageTitle, SavedNotice } from "@/components/admin/Card";
import { smallButtonClass } from "@/components/admin/styles";
import { ConfirmButton, SubmitButton } from "@/components/admin/ui";
import { prisma } from "@/lib/db";
import { approveCommentAction, deleteCommentAction, unapproveCommentAction } from "../../actions";

const dateTime = (d: Date) =>
  d.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Amsterdam" });

const FILTERS = [
  { key: "pending", label: "Waiting for approval" },
  { key: "approved", label: "Approved" },
  { key: "all", label: "All" },
] as const;
type Filter = (typeof FILTERS)[number]["key"];

const DONE: Record<string, string> = {
  approved: "Reply approved. It's now visible under the blog post.",
  hidden: "Reply hidden. It's no longer on the website and waits for approval again.",
  deleted: "Reply deleted.",
};

export default async function RepliesAdmin({ searchParams }: { searchParams: Promise<{ status?: string; done?: string }> }) {
  const sp = await searchParams;
  const [pendingCount, approvedCount] = await Promise.all([
    prisma.blogComment.count({ where: { approved: false } }),
    prisma.blogComment.count({ where: { approved: true } }),
  ]);
  // Open on "Waiting for approval" when there's something to check.
  const status: Filter = FILTERS.some((f) => f.key === sp.status) ? (sp.status as Filter) : pendingCount > 0 ? "pending" : "all";
  const comments = await prisma.blogComment.findMany({
    where: status === "all" ? {} : { approved: status === "approved" },
    // Oldest pending first (first come, first served); otherwise newest first.
    orderBy: { createdAt: status === "pending" ? "asc" : "desc" },
    take: 200,
    include: { post: { select: { title: true, slug: true } }, customer: { select: { email: true } } },
  });
  const counts: Record<Filter, number> = { pending: pendingCount, approved: approvedCount, all: pendingCount + approvedCount };

  return (
    <>
      <PageTitle
        title="Blog replies"
        description="Readers can reply under every blog post. Replies only appear on the website after you approve them. Times are Amsterdam time."
      />
      <SavedNotice show={Boolean(sp.done && DONE[sp.done])}>{sp.done ? DONE[sp.done] : ""}</SavedNotice>

      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className={`border bg-white p-5 ${pendingCount > 0 ? "border-black" : "border-neutral-200"}`}>
          <p className="text-xs uppercase tracking-wider text-neutral-500">Waiting</p>
          <p className="mt-2 text-2xl font-semibold text-black">{pendingCount}</p>
        </div>
        <div className="border border-neutral-200 bg-white p-5">
          <p className="text-xs uppercase tracking-wider text-neutral-500">Approved</p>
          <p className="mt-2 text-2xl font-semibold text-black">{approvedCount}</p>
        </div>
      </div>

      <nav aria-label="Filter replies" className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`/admin/replies?status=${f.key}`}
            aria-current={status === f.key ? "page" : undefined}
            className={`border px-3 py-1.5 text-xs font-medium ${status === f.key ? "border-black bg-black text-white" : "border-neutral-300 bg-white text-neutral-700 hover:border-black"}`}
          >
            {f.label} ({counts[f.key]})
          </Link>
        ))}
      </nav>

      <Card>
        {comments.length === 0 ? (
          <p className="text-sm text-neutral-600">
            {status === "pending" ? "Nothing waiting for approval. 🎉" : "No replies yet. Readers can write one at the bottom of every blog post."}
          </p>
        ) : (
          <ul className="divide-y divide-neutral-200">
            {comments.map((c) => (
              <li key={c.id} className="flex flex-col gap-4 py-5 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${
                        c.approved ? "bg-black text-white" : "border border-black text-black"
                      }`}
                    >
                      {c.approved ? "Approved" : "Waiting"}
                    </span>
                    <Link href={`/blog/${c.post.slug}#replies`} target="_blank" className="text-sm font-medium text-black underline underline-offset-4">
                      {c.post.title}
                    </Link>
                  </div>
                  <p className="mt-2 whitespace-pre-line break-words text-sm text-neutral-700">{c.body}</p>
                  <p className="mt-2 break-all text-xs text-neutral-500">
                    {c.name}
                    {c.customer ? ` · signed in as ${c.customer.email}` : " · guest"} · sent {dateTime(c.createdAt)}
                    {c.approved && c.approvedAt && ` · approved ${dateTime(c.approvedAt)}`}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {c.approved ? (
                    <form action={unapproveCommentAction}>
                      <input type="hidden" name="id" value={c.id} />
                      <input type="hidden" name="status" value={status} />
                      <button className={smallButtonClass}>Hide</button>
                    </form>
                  ) : (
                    <form action={approveCommentAction}>
                      <input type="hidden" name="id" value={c.id} />
                      <input type="hidden" name="status" value={status} />
                      <SubmitButton>Approve</SubmitButton>
                    </form>
                  )}
                  <form action={deleteCommentAction}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="status" value={status} />
                    <ConfirmButton className={smallButtonClass} message={`Delete this reply by ${c.name}? This can't be undone.`}>
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
