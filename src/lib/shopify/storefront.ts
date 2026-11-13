// ─────────────────────────────────────────────────────────────
// Shopify Storefront API (GraphQL) — products, cart, checkout.
//
// ⚠️ CREDENTIALS: set in .env
//   SHOPIFY_STORE_DOMAIN             e.g. truthpitch.myshopify.com
//   SHOPIFY_STOREFRONT_ACCESS_TOKEN  public token from the "Headless" sales channel
//   SHOPIFY_API_VERSION              e.g. 2025-10
//
// When these are empty the store runs in demo mode using src/lib/sample-products.ts.
//
// PRINTFUL: products created in Printful and synced to Shopify (via the Printful
// Shopify app) appear here automatically. Orders placed through Shopify checkout
// are routed to Printful by that app — no extra code is required.
// ─────────────────────────────────────────────────────────────
import type { Cart, Money, Product, ProductImage } from "../types";

const domain = process.env.SHOPIFY_STORE_DOMAIN?.replace(/^https?:\/\//, "").replace(/\/$/, "");
const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
const apiVersion = process.env.SHOPIFY_API_VERSION || "2025-10";

export function isShopifyConfigured(): boolean {
  return Boolean(domain && token);
}

type FetchOptions = { revalidate?: number; noStore?: boolean };

async function storefront<T>(query: string, variables: Record<string, unknown> = {}, opts: FetchOptions = {}): Promise<T> {
  if (!isShopifyConfigured()) throw new Error("Shopify is not configured.");
  const res = await fetch(`https://${domain}/api/${apiVersion}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": token!,
    },
    body: JSON.stringify({ query, variables }),
    ...(opts.noStore ? { cache: "no-store" as const } : { next: { revalidate: opts.revalidate ?? 60 } }),
  });
  const json = (await res.json()) as { data?: T; errors?: { message: string }[] };
  if (!res.ok || json.errors?.length) {
    throw new Error(`Shopify Storefront API error: ${json.errors?.map((e) => e.message).join("; ") || res.statusText}`);
  }
  return json.data as T;
}

// ── Products ────────────────────────────────────────────────

const PRODUCT_FIELDS = /* GraphQL */ `
  fragment ProductFields on Product {
    id
    handle
    title
    description
    availableForSale
    featuredImage { url altText }
    images(first: 10) { nodes { url altText } }
    priceRange { minVariantPrice { amount currencyCode } }
    variants(first: 50) {
      nodes { id title availableForSale price { amount currencyCode } }
    }
  }
`;

type ShopifyProduct = {
  id: string;
  handle: string;
  title: string;
  description: string;
  availableForSale: boolean;
  featuredImage: ProductImage | null;
  images: { nodes: ProductImage[] };
  priceRange: { minVariantPrice: Money };
  variants: { nodes: Product["variants"] };
};

function mapProduct(p: ShopifyProduct): Product {
  return {
    id: p.id,
    handle: p.handle,
    title: p.title,
    description: p.description,
    availableForSale: p.availableForSale,
    featuredImage: p.featuredImage,
    images: p.images.nodes,
    price: p.priceRange.minVariantPrice,
    variants: p.variants.nodes,
  };
}

export async function shopifyGetProducts(): Promise<Product[]> {
  const data = await storefront<{ products: { nodes: ShopifyProduct[] } }>(
    `${PRODUCT_FIELDS}
     query Products { products(first: 100, sortKey: CREATED_AT, reverse: true) { nodes { ...ProductFields } } }`,
  );
  return data.products.nodes.map(mapProduct);
}

export async function shopifyGetProduct(handle: string): Promise<Product | null> {
  const data = await storefront<{ product: ShopifyProduct | null }>(
    `${PRODUCT_FIELDS}
     query Product($handle: String!) { product(handle: $handle) { ...ProductFields } }`,
    { handle },
  );
  return data.product ? mapProduct(data.product) : null;
}

// ── Cart ────────────────────────────────────────────────────

const CART_FIELDS = /* GraphQL */ `
  fragment CartFields on Cart {
    id
    checkoutUrl
    totalQuantity
    cost { subtotalAmount { amount currencyCode } }
    lines(first: 100) {
      nodes {
        id
        quantity
        merchandise {
          ... on ProductVariant {
            id
            title
            price { amount currencyCode }
            image { url altText }
            product { handle title featuredImage { url altText } }
          }
        }
      }
    }
  }
`;

type ShopifyCart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: { subtotalAmount: Money };
  lines: {
    nodes: {
      id: string;
      quantity: number;
      merchandise: {
        id: string;
        title: string;
        price: Money;
        image: ProductImage | null;
        product: { handle: string; title: string; featuredImage: ProductImage | null };
      };
    }[];
  };
};

function mapCart(c: ShopifyCart): Cart {
  return {
    id: c.id,
    checkoutUrl: c.checkoutUrl,
    totalQuantity: c.totalQuantity,
    subtotal: c.cost.subtotalAmount,
    lines: c.lines.nodes.map((l) => ({
      id: l.id,
      quantity: l.quantity,
      variantId: l.merchandise.id,
      variantTitle: l.merchandise.title,
      productTitle: l.merchandise.product.title,
      handle: l.merchandise.product.handle,
      price: l.merchandise.price,
      image: l.merchandise.image ?? l.merchandise.product.featuredImage,
    })),
  };
}

type CartPayload = { cart: ShopifyCart | null; userErrors: { message: string }[] };

function unwrap(payload: CartPayload): Cart {
  if (payload.userErrors.length) throw new Error(payload.userErrors.map((e) => e.message).join("; "));
  if (!payload.cart) throw new Error("Shopify returned no cart.");
  return mapCart(payload.cart);
}

export async function shopifyGetCart(cartId: string): Promise<Cart | null> {
  const data = await storefront<{ cart: ShopifyCart | null }>(
    `${CART_FIELDS} query Cart($cartId: ID!) { cart(id: $cartId) { ...CartFields } }`,
    { cartId },
    { noStore: true },
  );
  return data.cart ? mapCart(data.cart) : null;
}

export async function shopifyCreateCart(variantId: string, quantity: number): Promise<Cart> {
  const data = await storefront<{ cartCreate: CartPayload }>(
    `${CART_FIELDS}
     mutation CartCreate($lines: [CartLineInput!]) {
       cartCreate(input: { lines: $lines }) { cart { ...CartFields } userErrors { message } }
     }`,
    { lines: [{ merchandiseId: variantId, quantity }] },
    { noStore: true },
  );
  return unwrap(data.cartCreate);
}

export async function shopifyAddLine(cartId: string, variantId: string, quantity: number): Promise<Cart> {
  const data = await storefront<{ cartLinesAdd: CartPayload }>(
    `${CART_FIELDS}
     mutation Add($cartId: ID!, $lines: [CartLineInput!]!) {
       cartLinesAdd(cartId: $cartId, lines: $lines) { cart { ...CartFields } userErrors { message } }
     }`,
    { cartId, lines: [{ merchandiseId: variantId, quantity }] },
    { noStore: true },
  );
  return unwrap(data.cartLinesAdd);
}

export async function shopifyUpdateLine(cartId: string, lineId: string, quantity: number): Promise<Cart> {
  const data = await storefront<{ cartLinesUpdate: CartPayload }>(
    `${CART_FIELDS}
     mutation Update($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
       cartLinesUpdate(cartId: $cartId, lines: $lines) { cart { ...CartFields } userErrors { message } }
     }`,
    { cartId, lines: [{ id: lineId, quantity }] },
    { noStore: true },
  );
  return unwrap(data.cartLinesUpdate);
}

export async function shopifyRemoveLine(cartId: string, lineId: string): Promise<Cart> {
  const data = await storefront<{ cartLinesRemove: CartPayload }>(
    `${CART_FIELDS}
     mutation Remove($cartId: ID!, $lineIds: [ID!]!) {
       cartLinesRemove(cartId: $cartId, lineIds: $lineIds) { cart { ...CartFields } userErrors { message } }
     }`,
    { cartId, lineIds: [lineId] },
    { noStore: true },
  );
  return unwrap(data.cartLinesRemove);
}
