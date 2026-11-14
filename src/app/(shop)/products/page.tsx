import type { Metadata } from "next";
import { ProductGrid } from "@/components/ProductCard";
import { getProductStories, getProducts } from "@/lib/catalog";

export const metadata: Metadata = { title: "Shop" };

export default async function ProductsPage() {
  const products = await getProducts();
  const stories = await getProductStories(products);
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="mb-10 flex items-end justify-between">
        <h1 className="text-3xl font-semibold tracking-tight text-black">Shop all</h1>
        <p className="text-sm text-neutral-500">
          {products.length} {products.length === 1 ? "item" : "items"}
        </p>
      </div>
      <ProductGrid products={products} stories={stories} />
    </section>
  );
}
