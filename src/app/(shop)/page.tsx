import Link from "next/link";
import { PostCard } from "@/components/blog/PostCard";
import { ProductGrid } from "@/components/ProductCard";
import { getLatestPosts } from "@/lib/blog";
import { getFeaturedProducts } from "@/lib/catalog";
import { getRatingSummaries } from "@/lib/reviews";
import { getSettings } from "@/lib/settings";

export default async function HomePage() {
  const [settings, featured, posts] = await Promise.all([getSettings(), getFeaturedProducts(), getLatestPosts(3)]);
  const ratings = await getRatingSummaries(featured.map((p) => p.handle));

  return (
    <>
      {/* Hero */}
      <section className="border-b border-neutral-200">
        <div
          className={`mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 sm:py-28 ${settings.heroImageUrl ? "md:grid-cols-2 md:items-center" : ""}`}
        >
          <div className={settings.heroImageUrl ? "" : "max-w-3xl"}>
            <h1 className="text-4xl font-semibold tracking-tight text-black sm:text-6xl">{settings.heroTitle}</h1>
            {settings.heroSubtitle && <p className="mt-6 max-w-xl text-lg text-neutral-600">{settings.heroSubtitle}</p>}
            <Link
              href="/products"
              className="mt-10 inline-block bg-black px-8 py-4 text-sm font-medium uppercase tracking-wider text-white hover:bg-neutral-800"
            >
              {settings.heroCtaLabel || "Shop now"}
            </Link>
          </div>
          {settings.heroImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={settings.heroImageUrl} alt="" className="aspect-[4/5] w-full bg-neutral-100 object-cover" />
          )}
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mb-10 flex items-end justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-black">Featured</h2>
          <Link href="/products" className="text-sm text-neutral-600 underline-offset-4 hover:text-black hover:underline">
            View all
          </Link>
        </div>
        <ProductGrid products={featured} ratings={ratings} />
      </section>

      {/* Latest blog posts (only when there are any) */}
      {posts.length > 0 && (
        <section className="border-t border-neutral-200">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <div className="mb-10 flex items-end justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-black">From the blog</h2>
              <Link href="/blog" className="text-sm text-neutral-600 underline-offset-4 hover:text-black hover:underline">
                All posts
              </Link>
            </div>
            <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((p) => (
                <PostCard key={p.id} post={p} headingLevel={3} />
              ))}
            </div>
          </div>
        </section>
      )}

    </>
  );
}
