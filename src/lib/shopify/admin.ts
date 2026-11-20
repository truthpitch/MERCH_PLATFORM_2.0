// ─────────────────────────────────────────────────────────────
// Shopify Admin API — read-only order overview for the control panel.
//
// ⚠️ CREDENTIALS (plus SHOPIFY_STORE_DOMAIN), either:
//   • SHOPIFY_ADMIN_CLIENT_ID + SHOPIFY_ADMIN_CLIENT_SECRET — an app made in Shopify's
//     Dev Dashboard (the only option for new apps since 1 January 2026), with the
//     read_orders scope, installed on the store. The site swaps these for an access
//     token (valid 24 hours) and renews it by itself.
//   • SHOPIFY_ADMIN_ACCESS_TOKEN — an older custom app's token (shpat_…), if you have one.
//   These are secret: they are only ever used server-side.
//
// PRINTFUL: once the Printful app fulfils an order, Shopify's fulfillment status
// changes to FULFILLED and tracking is added — that's what the dashboard shows.
// ─────────────────────────────────────────────────────────────
import type { Money } from "../types";

const clean = (v: string | undefined) => (v ?? "").trim().replace(/^(["'])(.*)\1$/, "$2");
const domain = clean(process.env.SHOPIFY_STORE_DOMAIN).replace(/^https?:\/\//, "").replace(/\/$/, "");
const staticToken = clean(process.env.SHOPIFY_ADMIN_ACCESS_TOKEN);
const clientId = clean(process.env.SHOPIFY_ADMIN_CLIENT_ID);
const clientSecret = clean(process.env.SHOPIFY_ADMIN_CLIENT_SECRET);
const apiVersion = process.env.SHOPIFY_API_VERSION || "2025-10";

export function isShopifyAdminConfigured(): boolean {
  return Boolean(domain && (staticToken || (clientId && clientSecret)));
}

// Token from the client credentials grant, kept in memory until a minute before it expires.
let cached: { token: string; expiresAt: number } | null = null;

async function getAdminToken(): Promise<string> {
  if (staticToken) return staticToken;
  if (cached && Date.now() < cached.expiresAt) return cached.token;

  const res = await fetch(`https://${domain}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: clientId, client_secret: clientSecret }),
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as { access_token?: string; expires_in?: number; error?: string; error_description?: string };
  if (!res.ok || !json.access_token) {
    const reason = json.error_description || json.error || res.statusText;
    throw new Error(
      `Shopify refused the client ID / secret (${reason}). Check that the app is installed on this store and belongs to the same Shopify organization.`,
    );
  }
  cached = { token: json.access_token, expiresAt: Date.now() + Math.max(60, (json.expires_in ?? 86399) - 60) * 1000 };
  return cached.token;
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
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": await getAdminToken() },
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
    if (res.status === 401) cached = null; // token revoked or expired early: fetch a new one next time
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
