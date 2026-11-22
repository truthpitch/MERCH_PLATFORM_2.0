// /sitemap.xml: every public page, so search engines find all products and blog posts.
import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/catalog";
import { CATEGORIES } from "@/lib/categories";
import { prisma } from "@/lib/db";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, posts] = await Promise.all([
    getProducts().catch(() => []),
    prisma.blogPost
      .findMany({ where: { published: true, publishedAt: { lte: new Date() } }, select: { slug: true, updatedAt: true }, orderBy: { publishedAt: "desc" } })
      .catch(() => []),
  ]);

  return [
    { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/products"), changeFrequency: "daily", priority: 0.9 },
    ...CATEGORIES.map((c) => ({ url: absoluteUrl(`/products?category=${c.slug}`), changeFrequency: "weekly" as const, priority: 0.6 })),
    ...products.map((p) => ({ url: absoluteUrl(`/products/${p.handle}`), changeFrequency: "weekly" as const, priority: 0.8 })),
    { url: absoluteUrl("/blog"), changeFrequency: "weekly", priority: 0.7 },
    ...posts.map((p) => ({ url: absoluteUrl(`/blog/${p.slug}`), lastModified: p.updatedAt, changeFrequency: "monthly" as const, priority: 0.7 })),
    { url: absoluteUrl("/about"), changeFrequency: "monthly", priority: 0.5 },
    { url: absoluteUrl("/contact"), changeFrequency: "yearly", priority: 0.3 },
  ];
}
