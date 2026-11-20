import type { Metadata } from "next";
import Link from "next/link";
import { ProductGrid } from "@/components/ProductCard";
import { getCategoryOverrides, getProductStories, getProducts } from "@/lib/catalog";
import { CATEGORIES, findCategory, productsInCategory } from "@/lib/categories";

type Props = { searchParams: Promise<{ category?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const category = findCategory((await searchParams).category);
  return { title: category ? category.label : "All Products" };
}

export default async function ProductsPage({ searchParams }: Props) {
  const category = findCategory((await searchParams).category);
  const [all, overrides] = await Promise.all([getProducts(), getCategoryOverrides()]);
  const products = category ? productsInCategory(all, category.slug, overrides) : all;
  const stories = await getProductStories(products);

  const chip = "shrink-0 border px-3 py-1.5 text-xs font-medium whitespace-nowrap";
  const on = `${chip} border-black bg-black text-white`;
  const off = `${chip} border-neutral-300 text-neutral-700 hover:border-black hover:text-black`;

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-6 flex items-end justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight text-black">{category ? category.label : "All Products"}</h1>
        <p className="shrink-0 text-sm text-neutral-500">
          {products.length} {products.length === 1 ? "item" : "items"}
        </p>
      </div>

      {/* Phones: a "Category" button that folds open into a two-column list (no JavaScript needed).
          The key makes it start closed again after picking a category. */}
      <details key={category?.slug ?? "all"} className="group mb-8 border border-neutral-300 sm:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm [&::-webkit-details-marker]:hidden">
          <span className="flex min-w-0 items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden className="shrink-0 text-black">
              <path d="M4 6h16M7 12h10M10 18h4" />
            </svg>
            <span className="text-neutral-500">Category:</span>
            <span className="truncate font-medium text-black">{category ? category.label : "All"}</span>
          </span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden className="shrink-0 text-black transition-transform group-open:rotate-180">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </summary>
        <nav aria-label="Categories" className="border-t border-neutral-200 p-3">
          <ul className="grid grid-cols-2 gap-2">
            <li className="col-span-2">
              <Link href="/products" aria-current={!category ? "page" : undefined} className={`${!category ? on : off} block py-2.5 text-center`}>
                All products
              </Link>
            </li>
            {CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/products?category=${c.slug}`}
                  aria-current={category?.slug === c.slug ? "page" : undefined}
                  className={`${category?.slug === c.slug ? on : off} flex h-full items-center justify-center whitespace-normal py-2.5 text-center leading-tight`}
                >
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </details>

      {/* Tablet and up: all categories as chips that wrap onto more lines. */}
      <nav aria-label="Categories" className="mb-10 hidden sm:block">
        <ul className="flex flex-wrap gap-2">
          <li>
            <Link href="/products" aria-current={!category ? "page" : undefined} className={!category ? on : off}>
              All
            </Link>
          </li>
          {CATEGORIES.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/products?category=${c.slug}`}
                aria-current={category?.slug === c.slug ? "page" : undefined}
                className={category?.slug === c.slug ? on : off}
              >
                {c.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {category && products.length === 0 ? (
        <div>
          <p className="text-neutral-600">Nothing in {category.label.toLowerCase()} yet. New items are coming soon.</p>
          <Link href="/products" className="mt-6 inline-block text-sm underline underline-offset-4">
            See all products
          </Link>
        </div>
      ) : (
        <ProductGrid products={products} stories={stories} />
      )}
    </section>
  );
}
