import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogForm } from "@/components/admin/BlogForm";
import { PageTitle, SavedNotice } from "@/components/admin/Card";
import { prisma } from "@/lib/db";
import { publicSiteUrl } from "@/lib/site";

export default async function EditBlogPost({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const post = await prisma.blogPost.findUnique({ where: { id: Number(id) || 0 } });
  if (!post) notFound();
  const live = post.published && post.publishedAt && post.publishedAt <= new Date();

  return (
    <>
      <p className="mb-2 text-sm">
        <Link href="/admin/blog" className="text-neutral-600 underline underline-offset-4 hover:text-black">
          ← Blog
        </Link>
      </p>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageTitle title="Edit post" />
        <Link href={`/blog/${post.slug}`} target="_blank" className="mb-8 text-sm text-black underline underline-offset-4">
          {live ? "View on the website ↗" : "Preview ↗"}
        </Link>
      </div>
      <SavedNotice show={sp.saved === "1"}>
        Saved. {live ? "The post is live on the blog." : post.published ? "The post is scheduled." : "It's a draft: tick Published when it's ready."}
      </SavedNotice>
      {/* key: start fresh from the saved values after each save */}
      <BlogForm
        key={post.updatedAt.toISOString()}
        siteUrl={publicSiteUrl()}
        post={{
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: post.content,
          coverImageUrl: post.coverImageUrl,
          coverImageAlt: post.coverImageAlt,
          author: post.author,
          tags: post.tags,
          metaTitle: post.metaTitle,
          metaDescription: post.metaDescription,
          published: post.published,
          publishedAt: post.publishedAt?.toISOString() ?? null,
        }}
      />
    </>
  );
}
