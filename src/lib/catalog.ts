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

/** Categories chosen by hand in the admin, keyed by product handle. */
export async function getCategoryOverrides(): Promise<Map<string, string>> {
  const rows = await prisma.productStory.findMany({ where: { category: { not: "" } }, select: { handle: true, category: true } });
  return new Map(rows.map((r) => [r.handle, r.category]));
}

/** The "MORE INFO" story: admin-edited text wins, then the sample default. */
/**
 * MORE INFO text for many products at once (one database query), keyed by handle.
 * Uses the admin-written story, falling back to the product's default story.
 */
export async function getProductStories(products: Product[]): Promise<Map<string, string>> {
  const rows = await prisma.productStory.findMany({ where: { handle: { in: products.map((p) => p.handle) } } });
  const custom = new Map(rows.filter((r) => r.story.trim()).map((r) => [r.handle, r.story]));
  return new Map(products.map((p) => [p.handle, custom.get(p.handle) ?? p.defaultStory ?? ""]));
}

export async function getProductStory(product: Product): Promise<{ story: string; imageUrl: string }> {
  const row = await prisma.productStory.findUnique({ where: { handle: product.handle } });
  if (row && (row.story.trim() || row.imageUrl.trim())) return { story: row.story, imageUrl: row.imageUrl };
  return { story: product.defaultStory ?? "", imageUrl: "" };
}

/**
 * Simple product search for the header search bar: every word must appear in the
 * title, description or MORE INFO story (case- and accent-insensitive).
 * The catalog is small (Shopify returns up to 100 products), so filtering here is fast.
 */
export async function searchProducts(query: string): Promise<{ products: Product[]; stories: Map<string, string> }> {
  const normalize = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  const words = normalize(query).split(/\s+/).filter(Boolean);
  const all = await getProducts();
  const stories = await getProductStories(all);
  if (words.length === 0) return { products: [], stories };
  const products = all.filter((p) => {
    const haystack = normalize(`${p.title} ${p.description} ${stories.get(p.handle) ?? ""}`);
    return words.every((w) => haystack.includes(w));
  });
  return { products, stories };
}
