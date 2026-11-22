import type { Metadata } from "next";
import Link from "next/link";
import { PostCard } from "@/components/blog/PostCard";
import { getPublishedPosts } from "@/lib/blog";

type Props = { searchParams: Promise<{ page?: string; tag?: string }> };

const DESCRIPTION = "Stories, guides and news from TruthPitch: the ideas behind our designs, how our merch is made and how to care for it.";

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { page, tag } = await searchParams;
  const n = Math.max(1, Math.floor(Number(page)) || 1);
  const title = tag ? `Blog: ${tag}` : n > 1 ? `Blog, page ${n}` : "Blog";
  return {
    title,
    description: DESCRIPTION,
    // Page 1 without filters is the main blog address; other pages point search engines to themselves.
    alternates: { canonical: tag ? `/blog?tag=${encodeURIComponent(tag)}` : n > 1 ? `/blog?page=${n}` : "/blog", types: { "application/rss+xml": "/blog/rss.xml" } },
    openGraph: { title: `${title} — TruthPitch`, description: DESCRIPTION, url: "/blog", type: "website" },
  };
}

export default async function BlogPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = Math.max(1, Math.floor(Number(sp.page)) || 1);
  const tag = sp.tag?.trim().slice(0, 50) || undefined;
  const { posts, pages } = await getPublishedPosts(page, tag);
  const pageHref = (n: number) => {
    const p = new URLSearchParams();
    if (tag) p.set("tag", tag);
    if (n > 1) p.set("page", String(n));
    const qs = p.toString();
    return `/blog${qs ? `?${qs}` : ""}`;
  };

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <header className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Blog</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-black sm:text-4xl">{tag ? `Posts about “${tag}”` : "Stories & guides"}</h1>
        <p className="mt-4 text-neutral-600">{DESCRIPTION}</p>
        {tag && (
          <Link href="/blog" className="mt-4 inline-block text-sm text-black underline underline-offset-4">
            ← All posts
          </Link>
        )}
      </header>

      {posts.length === 0 ? (
        <p className="mt-12 text-neutral-600">{tag ? "No posts with this tag yet." : "New posts are coming soon."}</p>
      ) : (
        <div className="mt-12 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {pages > 1 && (
        <nav aria-label="Blog pages" className="mt-16 flex items-center justify-between border-t border-neutral-200 pt-6 text-sm">
          {page > 1 ? (
            <Link href={pageHref(page - 1)} rel="prev" className="text-black underline underline-offset-4">
              ← Newer posts
            </Link>
          ) : (
            <span />
          )}
          <span className="text-neutral-500">
            Page {page} of {pages}
          </span>
          {page < pages ? (
            <Link href={pageHref(page + 1)} rel="next" className="text-black underline underline-offset-4">
              Older posts →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </section>
  );
}
