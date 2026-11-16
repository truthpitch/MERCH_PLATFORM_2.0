import type { Metadata } from "next";
import Link from "next/link";
import { ProductGrid } from "@/components/ProductCard";
import { getProductStories, getProducts } from "@/lib/catalog";
import { CATEGORIES, findCategory, productsInCategory } from "@/lib/categories";

type Props = { searchParams: Promise<{ category?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const category = findCategory((await searchParams).category);
  return { title: category ? category.label : "All Products" };
}

export default async function ProductsPage({ searchParams }: Props) {
  const category = findCategory((await searchParams).category);
  const all = await getProducts();
  const products = category ? productsInCategory(all, category.slug) : all;
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

      {/* Category chips: scroll sideways on phones, wrap on larger screens. */}
      <nav aria-label="Categories" className="-mx-4 mb-10 overflow-x-auto px-4 sm:mx-0 sm:overflow-visible sm:px-0">
        <ul className="flex gap-2 sm:flex-wrap">
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
