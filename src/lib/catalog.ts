// Single entry point for product data. Uses Shopify when configured, otherwise
// the sample catalog — pages never need to know which one is active.
import { prisma } from "./db";
import { SAMPLE_PRODUCTS } from "./sample-products";
import { isShopifyConfigured, shopifyGetProduct, shopifyGetProducts } from "./shopify/storefront";
import type { Product } from "./types";

export function isDemoMode(): boolean {
  return !isShopifyConfigured();
}

export async function getProducts(): Promise<Product[]> {
  if (isDemoMode()) return SAMPLE_PRODUCTS;
  return shopifyGetProducts();
}

export async function getProduct(handle: string): Promise<Product | null> {
  if (isDemoMode()) return SAMPLE_PRODUCTS.find((p) => p.handle === handle) ?? null;
  return shopifyGetProduct(handle);
}

/** Homepage products in the order set by the admin. Falls back to the newest 4. */
export async function getFeaturedProducts(): Promise<Product[]> {
  const [rows, products] = await Promise.all([
    prisma.featuredProduct.findMany({ orderBy: { position: "asc" } }),
    getProducts(),
  ]);
  if (rows.length === 0) return products.slice(0, 4);
  const byHandle = new Map(products.map((p) => [p.handle, p]));
  return rows.map((r) => byHandle.get(r.handle)).filter((p): p is Product => Boolean(p));
}

/** Other products to show beneath a product page. */
export async function getRelatedProducts(handle: string, limit = 4): Promise<Product[]> {
  const products = await getProducts();
  return products.filter((p) => p.handle !== handle).slice(0, limit);
}

/** The "MORE INFO" story: admin-edited text wins, then the sample default. */
export async function getProductStory(product: Product): Promise<{ story: string; imageUrl: string }> {
  const row = await prisma.productStory.findUnique({ where: { handle: product.handle } });
  if (row && (row.story.trim() || row.imageUrl.trim())) return { story: row.story, imageUrl: row.imageUrl };
  return { story: product.defaultStory ?? "", imageUrl: "" };
}
