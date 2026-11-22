import Link from "next/link";
import { readingMinutes } from "@/lib/blog-format";
import { formatPostDate } from "@/lib/blog";

type CardPost = { slug: string; title: string; excerpt: string; content: string; coverImageUrl: string; coverImageAlt: string; publishedAt: Date | null };

/** A blog post in a list: picture, date, title and summary. */
export function PostCard({ post, headingLevel = 2 }: { post: CardPost; headingLevel?: 2 | 3 }) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <article className="group">
      <Link href={`/blog/${post.slug}`} className="block">
        <div className="aspect-[16/10] overflow-hidden bg-neutral-100">
          {post.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.coverImageUrl}
              alt={post.coverImageAlt}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs font-bold tracking-[0.3em] text-neutral-400">TRUTHPITCH</div>
          )}
        </div>
        <p className="mt-4 text-xs uppercase tracking-wider text-neutral-500">
          {post.publishedAt && <time dateTime={post.publishedAt.toISOString()}>{formatPostDate(post.publishedAt)}</time>}
          {post.publishedAt && " · "}
          {readingMinutes(post.content)} min read
        </p>
        <Heading className="mt-2 text-lg font-semibold leading-snug text-black group-hover:underline group-hover:underline-offset-4">{post.title}</Heading>
        {post.excerpt && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-neutral-600">{post.excerpt}</p>}
      </Link>
    </article>
  );
}
