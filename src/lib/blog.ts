// Blog posts: only published posts with a publish date in the past are public.
import { prisma } from "./db";

export const POSTS_PER_PAGE = 9;

const publicWhere = () => ({ published: true, publishedAt: { lte: new Date() } });

export async function getPublishedPosts(page = 1, tag?: string) {
  const where = { ...publicWhere(), ...(tag ? { tags: { contains: tag } } : {}) };
  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({ where, orderBy: { publishedAt: "desc" }, skip: (page - 1) * POSTS_PER_PAGE, take: POSTS_PER_PAGE }),
    prisma.blogPost.count({ where }),
  ]);
  // "contains" also matches parts of words: keep only posts that really have this tag.
  const filtered = tag ? posts.filter((p) => postTags(p.tags).some((t) => t.toLowerCase() === tag.toLowerCase())) : posts;
  return { posts: filtered, total, pages: Math.max(1, Math.ceil(total / POSTS_PER_PAGE)) };
}

export async function getLatestPosts(limit = 3) {
  return prisma.blogPost.findMany({ where: publicWhere(), orderBy: { publishedAt: "desc" }, take: limit });
}

/** A published post, or (for admins previewing) a draft. */
export async function getPostBySlug(slug: string, { includeDrafts = false } = {}) {
  const post = await prisma.blogPost.findUnique({ where: { slug } });
  if (!post) return null;
  const isPublic = post.published && post.publishedAt && post.publishedAt <= new Date();
  return isPublic || includeDrafts ? post : null;
}

/** Other posts to read next: sharing a tag first, then the newest. */
export async function getRelatedPosts(post: { id: number; tags: string }, limit = 3) {
  const all = await prisma.blogPost.findMany({ where: { ...publicWhere(), id: { not: post.id } }, orderBy: { publishedAt: "desc" }, take: 30 });
  const tags = new Set(postTags(post.tags).map((t) => t.toLowerCase()));
  const score = (p: { tags: string }) => postTags(p.tags).filter((t) => tags.has(t.toLowerCase())).length;
  return [...all].sort((a, b) => score(b) - score(a)).slice(0, limit);
}

export function postTags(tags: string): string[] {
  return tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 10);
}

export const formatPostDate = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
