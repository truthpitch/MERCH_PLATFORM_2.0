// Cart abstraction.
//  • Shopify mode: a real Shopify cart; its id lives in a cookie. Checkout = cart.checkoutUrl.
//  • Demo mode: line items kept in a cookie, priced from the sample catalog. No checkout.
import { cookies } from "next/headers";
import { isDemoMode } from "./catalog";
import { SAMPLE_PRODUCTS } from "./sample-products";
import {
  shopifyAddLine,
  shopifyCreateCart,
  shopifyGetCart,
  shopifyRemoveLine,
  shopifyUpdateLine,
} from "./shopify/storefront";
import type { Cart, CartLine } from "./types";

const CART_COOKIE = "tp_cart";
const DEMO_CART_COOKIE = "tp_demo_cart";
const COOKIE_OPTS = { httpOnly: true, sameSite: "lax" as const, path: "/", maxAge: 60 * 60 * 24 * 30 };

const EMPTY_CART: Cart = { id: null, checkoutUrl: null, totalQuantity: 0, subtotal: { amount: "0", currencyCode: "USD" }, lines: [] };

// ── Demo cart helpers ───────────────────────────────────────

type DemoLine = { v: string; q: number };

async function readDemoLines(): Promise<DemoLine[]> {
  const raw = (await cookies()).get(DEMO_CART_COOKIE)?.value;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((l) => typeof l?.v === "string" && Number.isInteger(l?.q) && l.q > 0) : [];
  } catch {
    return [];
  }
}

async function writeDemoLines(lines: DemoLine[]) {
  (await cookies()).set(DEMO_CART_COOKIE, JSON.stringify(lines), COOKIE_OPTS);
}

function buildDemoCart(lines: DemoLine[]): Cart {
  const cartLines: CartLine[] = [];
  for (const { v, q } of lines) {
    for (const p of SAMPLE_PRODUCTS) {
      const variant = p.variants.find((x) => x.id === v);
      if (variant) {
        cartLines.push({
          id: v,
          quantity: q,
          variantId: v,
          variantTitle: variant.title,
          productTitle: p.title,
          handle: p.handle,
          price: variant.price,
          image: p.featuredImage,
        });
      }
    }
  }
  const subtotal = cartLines.reduce((sum, l) => sum + Number(l.price.amount) * l.quantity, 0);
  return {
    id: "demo",
    checkoutUrl: null,
    totalQuantity: cartLines.reduce((n, l) => n + l.quantity, 0),
    subtotal: { amount: subtotal.toFixed(2), currencyCode: "USD" },
    lines: cartLines,
  };
}

// ── Public API ──────────────────────────────────────────────

export async function getCart(): Promise<Cart> {
  if (isDemoMode()) return buildDemoCart(await readDemoLines());
  const cartId = (await cookies()).get(CART_COOKIE)?.value;
  if (!cartId) return EMPTY_CART;
  try {
    return (await shopifyGetCart(cartId)) ?? EMPTY_CART;
  } catch {
    return EMPTY_CART;
  }
}

export async function addToCart(variantId: string, quantity = 1): Promise<void> {
  if (isDemoMode()) {
    const lines = await readDemoLines();
    const existing = lines.find((l) => l.v === variantId);
    if (existing) existing.q += quantity;
    else lines.push({ v: variantId, q: quantity });
    await writeDemoLines(lines);
    return;
  }
  const jar = await cookies();
  const cartId = jar.get(CART_COOKIE)?.value;
  if (cartId) {
    try {
      await shopifyAddLine(cartId, variantId, quantity);
      return;
    } catch {
      // Cart expired or was completed — fall through and start a new one.
    }
  }
  const cart = await shopifyCreateCart(variantId, quantity);
  jar.set(CART_COOKIE, cart.id!, COOKIE_OPTS);
}

export async function updateCartLine(lineId: string, quantity: number): Promise<void> {
  if (quantity <= 0) return removeCartLine(lineId);
  if (isDemoMode()) {
    const lines = await readDemoLines();
    const line = lines.find((l) => l.v === lineId);
    if (line) line.q = quantity;
    await writeDemoLines(lines);
    return;
  }
  const cartId = (await cookies()).get(CART_COOKIE)?.value;
  if (cartId) await shopifyUpdateLine(cartId, lineId, quantity);
}

export async function removeCartLine(lineId: string): Promise<void> {
  if (isDemoMode()) {
    await writeDemoLines((await readDemoLines()).filter((l) => l.v !== lineId));
    return;
  }
  const cartId = (await cookies()).get(CART_COOKIE)?.value;
  if (cartId) await shopifyRemoveLine(cartId, lineId);
}
