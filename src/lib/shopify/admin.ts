// ─────────────────────────────────────────────────────────────
// Shopify Admin API — read-only order overview for the control panel.
//
// ⚠️ CREDENTIALS: set SHOPIFY_ADMIN_ACCESS_TOKEN in .env (plus SHOPIFY_STORE_DOMAIN).
//   Shopify admin → Settings → Apps and sales channels → Develop apps → Create app
//   → Configure Admin API scopes: read_orders → Install app → reveal token (shpat_…).
//   This token is secret: it is only ever used server-side.
//
// PRINTFUL: once the Printful app fulfils an order, Shopify's fulfillment status
// changes to FULFILLED and tracking is added — that's what the dashboard shows.
// ─────────────────────────────────────────────────────────────
import type { Money } from "../types";

const domain = process.env.SHOPIFY_STORE_DOMAIN?.replace(/^https?:\/\//, "").replace(/\/$/, "");
const adminToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const apiVersion = process.env.SHOPIFY_API_VERSION || "2025-10";

export function isShopifyAdminConfigured(): boolean {
  return Boolean(domain && adminToken);
}

export type OrderSummary = {
  id: string;
  name: string;
  createdAt: string;
  financialStatus: string | null;
  fulfillmentStatus: string;
  itemCount: number;
  total: Money;
};

export async function getRecentOrders(limit = 25): Promise<OrderSummary[]> {
  if (!isShopifyAdminConfigured()) return [];
  const res = await fetch(`https://${domain}/admin/api/${apiVersion}/graphql.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": adminToken! },
    body: JSON.stringify({
      query: `query Orders($first: Int!) {
        orders(first: $first, sortKey: CREATED_AT, reverse: true) {
          nodes {
            id name createdAt
            displayFinancialStatus
            displayFulfillmentStatus
            subtotalLineItemsQuantity
            totalPriceSet { shopMoney { amount currencyCode } }
          }
        }
      }`,
      variables: { first: limit },
    }),
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok || json.errors) {
    const msg = Array.isArray(json.errors) ? json.errors.map((e: { message: string }) => e.message).join("; ") : JSON.stringify(json.errors ?? res.statusText);
    throw new Error(`Shopify Admin API error: ${msg}`);
  }
  type Node = {
    id: string;
    name: string;
    createdAt: string;
    displayFinancialStatus: string | null;
    displayFulfillmentStatus: string;
    subtotalLineItemsQuantity: number;
    totalPriceSet: { shopMoney: Money };
  };
  return (json.data.orders.nodes as Node[]).map((o) => ({
    id: o.id,
    name: o.name,
    createdAt: o.createdAt,
    financialStatus: o.displayFinancialStatus,
    fulfillmentStatus: o.displayFulfillmentStatus,
    itemCount: o.subtotalLineItemsQuantity,
    total: o.totalPriceSet.shopMoney,
  }));
}
