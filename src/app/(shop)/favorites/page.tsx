import type { Metadata } from "next";
import Link from "next/link";
import { ProductGrid } from "@/components/ProductCard";
import { getProducts } from "@/lib/catalog";
import { getCustomerId } from "@/lib/customers";
import { getFavoriteHandles } from "@/lib/favorites";
import { getRatingSummaries } from "@/lib/reviews";
import type { Product } from "@/lib/types";

export const metadata: Metadata = { title: "Favorites", robots: { index: false } };

export default async function FavoritesPage() {
  const [handles, products, customerId] = await Promise.all([getFavoriteHandles(), getProducts(), getCustomerId()]);
  const byHandle = new Map(products.map((p) => [p.handle, p]));
  // Keep the order in which they were saved; skip products that no longer exist.
  const favorites = handles.map((h) => byHandle.get(h)).filter((p): p is Product => Boolean(p));
  const ratings = await getRatingSummaries(favorites.map((p) => p.handle));

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="mb-10 flex items-end justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight text-black">Favorites</h1>
        <p className="text-sm text-neutral-500">
          {favorites.length} {favorites.length === 1 ? "item" : "items"}
        </p>
      </div>

      {!customerId && (
        <p className="mb-10 border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
          Your favorites are saved on this device.{" "}
          <Link href="/account/login?next=/favorites" className="font-medium text-black underline underline-offset-4">
            Sign in
          </Link>{" "}
          to keep them on every device.
        </p>
      )}

      {favorites.length === 0 ? (
        <div>
          <p className="text-neutral-600">No favorites yet. Tap the heart on any product to save it here.</p>
          <Link href="/products" className="mt-6 inline-block bg-black px-6 py-3 text-sm font-medium text-white hover:bg-neutral-800">
            Browse the shop
          </Link>
        </div>
      ) : (
        <ProductGrid products={favorites} ratings={ratings} />
      )}
    </section>
  );
}
