import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PostCard } from "@/components/blog/PostCard";
import { isAdmin } from "@/lib/auth";
import { formatPostDate, getPostBySlug, getRelatedPosts, postTags } from "@/lib/blog";
import { plainText, postHeadings, readingMinutes, renderPost } from "@/lib/blog-format";
import { SITE_NAME, absoluteUrl } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

const description = (p: { metaDescription: string; excerpt: string; content: string }) =>
  (p.metaDescription || p.excerpt || plainText(p.content)).slice(0, 160);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug, { includeDrafts: await isAdmin() });
  if (!post) return {};
  const title = post.metaTitle || post.title;
  const desc = description(post);
  const image = post.coverImageUrl ? absoluteUrl(post.coverImageUrl) : undefined;
  return {
    title,
    description: desc,
    alternates: { canonical: `/blog/${post.slug}` },
    // Drafts (only visible to the admin) must never be indexed.
    robots: post.published ? undefined : { index: false, follow: false },
    openGraph: {
      type: "article",
      title,
      description: desc,
      url: `/blog/${post.slug}`,
      siteName: SITE_NAME,
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: [post.author],
      tags: postTags(post.tags),
      images: image ? [{ url: image, alt: post.coverImageAlt || post.title }] : undefined,
    },
    twitter: { card: image ? "summary_large_image" : "summary", title, description: desc, images: image ? [image] : undefined },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const admin = await isAdmin();
  const post = await getPostBySlug(slug, { includeDrafts: admin });
  if (!post) notFound();

  const isDraft = !post.published || !post.publishedAt || post.publishedAt > new Date();
  const [related] = await Promise.all([getRelatedPosts(post)]);
  const headings = postHeadings(post.content).filter((h) => h.level === 2);
  const tags = postTags(post.tags);
  const url = absoluteUrl(`/blog/${post.slug}`);
  const minutes = readingMinutes(post.content);

  // Structured data so search engines understand this is an article (can enable rich results).
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title.slice(0, 110),
      description: description(post),
      image: post.coverImageUrl ? [absoluteUrl(post.coverImageUrl)] : undefined,
      datePublished: post.publishedAt?.toISOString(),
      dateModified: post.updatedAt.toISOString(),
      author: { "@type": "Organization", name: post.author || SITE_NAME, url: absoluteUrl("/about") },
      publisher: { "@type": "Organization", name: SITE_NAME, url: absoluteUrl("/") },
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
      keywords: tags.join(", ") || undefined,
      wordCount: plainText(post.content).split(" ").filter(Boolean).length,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
        { "@type": "ListItem", position: 2, name: "Blog", item: absoluteUrl("/blog") },
        { "@type": "ListItem", position: 3, name: post.title, item: url },
      ],
    },
  ];

  const share = [
    { label: "WhatsApp", href: `https://wa.me/?text=${encodeURIComponent(`${post.title} ${url}`)}` },
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
    { label: "X", href: `https://x.com/intent/post?url=${encodeURIComponent(url)}&text=${encodeURIComponent(post.title)}` },
    { label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}` },
  ];

  return (
    <>
      {!isDraft && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      )}

      {isDraft && (
        <div className="border-b border-neutral-300 bg-neutral-100 px-4 py-3 text-center text-sm text-black">
          Preview: this post isn&apos;t public yet. Only you can see it.{" "}
          <Link href={`/admin/blog/${post.id}`} className="font-medium underline underline-offset-4">
            Edit post
          </Link>
        </div>
      )}

      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <nav aria-label="Breadcrumb" className="text-xs uppercase tracking-wider text-neutral-500">
          <Link href="/" className="hover:text-black">
            Home
          </Link>
          <span aria-hidden> / </span>
          <Link href="/blog" className="hover:text-black">
            Blog
          </Link>
        </nav>

        <header className="mt-6">
          <h1 className="text-3xl font-semibold leading-tight tracking-tight text-black sm:text-5xl">{post.title}</h1>
          {post.excerpt && <p className="mt-5 text-lg leading-relaxed text-neutral-600">{post.excerpt}</p>}
          <p className="mt-6 text-sm text-neutral-500">
            By {post.author || SITE_NAME}
            {post.publishedAt && (
              <>
                {" · "}
                <time dateTime={post.publishedAt.toISOString()}>{formatPostDate(post.publishedAt)}</time>
              </>
            )}
            {" · "}
            {minutes} min read
          </p>
        </header>

        {post.coverImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.coverImageUrl} alt={post.coverImageAlt || ""} className="mt-10 aspect-[16/9] w-full bg-neutral-100 object-cover" />
        )}

        {headings.length >= 3 && (
          <nav aria-label="In this article" className="mt-10 border-y border-neutral-200 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black">In this article</p>
            <ol className="mt-3 space-y-1.5 text-sm">
              {headings.map((h) => (
                <li key={h.id}>
                  <a href={`#${h.id}`} className="text-neutral-700 underline-offset-4 hover:text-black hover:underline">
                    {h.text}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        )}

        <div className="blog-content mt-10">{renderPost(post.content)}</div>

        <footer className="mt-14 space-y-6 border-t border-neutral-200 pt-8">
          {tags.length > 0 && (
            <ul className="flex flex-wrap gap-2" aria-label="Tags">
              {tags.map((t) => (
                <li key={t}>
                  <Link href={`/blog?tag=${encodeURIComponent(t)}`} className="border border-neutral-300 px-3 py-1.5 text-xs text-neutral-700 hover:border-black hover:text-black">
                    {t}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <span className="text-neutral-500">Share:</span>
            {share.map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="text-black underline underline-offset-4">
                {s.label}
              </a>
            ))}
          </div>
          <div className="flex flex-col gap-4 bg-neutral-50 p-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-neutral-700">Merch with a message, printed on demand.</p>
            <Link href="/products" className="shrink-0 bg-black px-6 py-3 text-center text-sm font-medium uppercase tracking-wider text-white hover:bg-neutral-800">
              Shop the collection
            </Link>
          </div>
        </footer>
      </article>

      {related.length > 0 && (
        <section className="mx-auto max-w-6xl border-t border-neutral-200 px-4 py-16 sm:px-6">
          <h2 className="mb-10 text-xs font-semibold uppercase tracking-[0.2em] text-black">Keep reading</h2>
          <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <PostCard key={p.id} post={p} headingLevel={3} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
