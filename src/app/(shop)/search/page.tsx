import type { Metadata } from "next";
import Link from "next/link";
import { ProductGrid } from "@/components/ProductCard";
import { searchProducts } from "@/lib/catalog";

type Props = { searchParams: Promise<{ q?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const q = ((await searchParams).q ?? "").trim();
  return { title: q ? `Search: ${q}` : "Search", robots: { index: false, follow: true } };
}

export default async function SearchPage({ searchParams }: Props) {
  const q = ((await searchParams).q ?? "").trim().slice(0, 100);
  const { products, stories } = await searchProducts(q);

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Search</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-black">
          {q ? <>Results for &ldquo;{q}&rdquo;</> : "What are you looking for?"}
        </h1>
        {q && (
          <p className="mt-2 text-sm text-neutral-500">
            {products.length} {products.length === 1 ? "item" : "items"} found
          </p>
        )}
      </div>

      {q && products.length > 0 && <ProductGrid products={products} stories={stories} />}

      {(!q || products.length === 0) && (
        <div className="max-w-xl text-neutral-600">
          {q ? <p>Nothing matched your search. Try a different word, or browse everything in the shop.</p> : <p>Type a word in the search bar at the top of the page.</p>}
          <Link href="/products" className="mt-6 inline-block bg-black px-6 py-3 text-sm font-medium text-white hover:bg-neutral-800">
            All Products
          </Link>
        </div>
      )}
    </section>
  );
}
