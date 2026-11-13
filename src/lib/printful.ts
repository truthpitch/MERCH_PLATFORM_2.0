// ─────────────────────────────────────────────────────────────
// Printful integration point.
//
// HOW FULFILLMENT WORKS TODAY (no code needed):
//   1. Install the Printful app in your Shopify store and connect your Printful account.
//   2. Design products in Printful → "Add to store" → they sync to Shopify as products.
//   3. This website reads those products through the Shopify Storefront API.
//   4. A customer checks out on Shopify → the Printful app receives the order,
//      prints and ships it, and marks it fulfilled in Shopify with tracking.
//
// WHEN YOU MIGHT USE THIS FILE:
//   Direct Printful API calls — e.g. showing production status, shipping-rate
//   estimates or mockups in the admin panel. Nothing in the app depends on it yet.
//
// ⚠️ CREDENTIALS: set PRINTFUL_API_KEY in .env
//   Printful dashboard → Settings → API → Create private token.
//   Server-side only — never expose this key to the browser.
// Docs: https://developers.printful.com/docs/
// ─────────────────────────────────────────────────────────────

const PRINTFUL_API = "https://api.printful.com";

export function isPrintfulConfigured(): boolean {
  return Boolean(process.env.PRINTFUL_API_KEY);
}

export async function printfulRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const key = process.env.PRINTFUL_API_KEY;
  if (!key) throw new Error("PRINTFUL_API_KEY is not set.");
  const res = await fetch(`${PRINTFUL_API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...init.headers },
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Printful API error ${res.status}: ${json?.error?.message ?? res.statusText}`);
  return json.result as T;
}

/**
 * Example: look up a Printful order by the Shopify order id it was created from.
 * Printful stores Shopify orders with an "@"-prefixed external id.
 */
export async function getPrintfulOrderByShopifyId(shopifyOrderId: string) {
  return printfulRequest<{ id: number; status: string; shipments: unknown[] }>(`/orders/@${shopifyOrderId}`);
}
