"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/blog-format";
import { prisma } from "@/lib/db";

export type BlogFormState = { error?: string; field?: "title" | "slug" };

const text = (fd: FormData, key: string, max: number) => String(fd.get(key) ?? "").trim().slice(0, max);

/** Empty, a page on this site (/media/…) or an http(s) address. */
function imageUrl(value: string): string {
  if (!value) return "";
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : "";
  } catch {
    return "";
  }
}

/** Creates (no id) or updates a blog post. */
export async function saveBlogPostAction(_prev: BlogFormState, fd: FormData): Promise<BlogFormState> {
  await requireAdmin();
  const id = Number(fd.get("id")) || null;
  const title = text(fd, "title", 200);
  if (!title) return { error: "Give the post a title.", field: "title" };

  const slug = slugify(text(fd, "slug", 100) || title);
  if (!slug) return { error: "The web address can only use letters and numbers.", field: "slug" };
  const clash = await prisma.blogPost.findUnique({ where: { slug }, select: { id: true } });
  if (clash && clash.id !== id) return { error: `Another post already uses the address /blog/${slug}. Choose a different one.`, field: "slug" };

  const published = fd.get("published") === "on";
  const dateValue = text(fd, "publishedAt", 40);
  const chosenDate = dateValue ? new Date(dateValue) : null;
  const existing = id ? await prisma.blogPost.findUnique({ where: { id } }) : null;
  if (id && !existing) return { error: "This post no longer exists." };
  // Publishing without a date means "now"; a future date schedules the post.
  const publishedAt =
    chosenDate && !Number.isNaN(chosenDate.getTime()) ? chosenDate : published ? (existing?.publishedAt ?? new Date()) : (existing?.publishedAt ?? null);

  const data = {
    title,
    slug,
    excerpt: text(fd, "excerpt", 400),
    content: String(fd.get("content") ?? "").slice(0, 100_000),
    coverImageUrl: imageUrl(text(fd, "coverImageUrl", 1000)),
    coverImageAlt: text(fd, "coverImageAlt", 200),
    author: text(fd, "author", 100) || "TruthPitch",
    tags: text(fd, "tags", 300)
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .join(", "),
    metaTitle: text(fd, "metaTitle", 100),
    metaDescription: text(fd, "metaDescription", 300),
    published,
    publishedAt,
  };

  const post = id ? await prisma.blogPost.update({ where: { id }, data }) : await prisma.blogPost.create({ data });
  revalidatePath("/", "layout");
  redirect(`/admin/blog/${post.id}?saved=1`);
}

export async function deleteBlogPostAction(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("id"));
  if (Number.isInteger(id) && id > 0) await prisma.blogPost.delete({ where: { id } }).catch(() => null);
  revalidatePath("/", "layout");
  redirect("/admin/blog?deleted=1");
}
