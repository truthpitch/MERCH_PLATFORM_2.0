import Link from "next/link";
import { Card, PageTitle, SavedNotice } from "@/components/admin/Card";
import { smallButtonClass } from "@/components/admin/styles";
import { ConfirmButton } from "@/components/admin/ui";
import { prisma } from "@/lib/db";
import { deleteBlogPostAction } from "../../blog-actions";

const dateTime = (d: Date) =>
  d.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Amsterdam" });

function status(p: { published: boolean; publishedAt: Date | null }) {
  if (!p.published) return { label: "Draft", dot: "border border-neutral-400" };
  if (p.publishedAt && p.publishedAt > new Date()) return { label: "Scheduled", dot: "border-2 border-black" };
  return { label: "Published", dot: "bg-black" };
}

export default async function BlogAdmin({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  const [posts, sp] = await Promise.all([prisma.blogPost.findMany({ orderBy: [{ publishedAt: { sort: "desc", nulls: "first" } }, { createdAt: "desc" }] }), searchParams]);

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <PageTitle title="Blog" description="Write posts for the /blog page. Drafts are only visible to you. Times are Amsterdam time." />
        <Link href="/admin/blog/new" className="mb-8 bg-black px-5 py-3 text-sm font-medium text-white hover:bg-neutral-800">
          + New post
        </Link>
      </div>
      <SavedNotice show={sp.deleted === "1"}>Post deleted.</SavedNotice>

      <Card>
        {posts.length === 0 ? (
          <p className="text-sm text-neutral-600">No posts yet. Click “New post” to write the first one.</p>
        ) : (
          <ul className="divide-y divide-neutral-200">
            {posts.map((p) => {
              const s = status(p);
              return (
                <li key={p.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <Link href={`/admin/blog/${p.id}`} className="font-medium text-black hover:underline hover:underline-offset-4">
                      {p.title}
                    </Link>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-neutral-500">
                      <span className="flex items-center gap-1.5 text-black">
                        <span className={`inline-block h-2 w-2 rounded-full ${s.dot}`} aria-hidden />
                        {s.label}
                      </span>
                      <span>· /blog/{p.slug}</span>
                      {p.publishedAt && <span>· {dateTime(p.publishedAt)}</span>}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Link href={`/admin/blog/${p.id}`} className={smallButtonClass}>
                      Edit
                    </Link>
                    <Link href={`/blog/${p.slug}`} target="_blank" className={smallButtonClass}>
                      {s.label === "Published" ? "View" : "Preview"}
                    </Link>
                    <form action={deleteBlogPostAction}>
                      <input type="hidden" name="id" value={p.id} />
                      <ConfirmButton className={smallButtonClass} message={`Delete “${p.title}”? This can't be undone.`}>
                        Delete
                      </ConfirmButton>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
