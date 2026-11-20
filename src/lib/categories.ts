// Product categories shown under SHOP in the menu.
//
// A product lands in a category based on (in this order):
//   0. a category chosen for it in the admin (Products tab), if any,
//   1. its Shopify "Product type" (e.g. "T-Shirt", "Hoodie", "Mug"),
//   2. its title,
//   3. its Shopify tags.
// Words are matched whole and plurals count too ("cap" also matches "Caps").
// Tip: set the Product type in Shopify (Printful usually fills it in) for the best result.
import type { Product } from "./types";

export type Category = { slug: string; label: string; keywords: string[] };

// Order matters: the first category that matches wins (beanies before hats, etc.).
export const CATEGORIES: Category[] = [
  { slug: "t-shirts", label: "T-shirts", keywords: ["t shirt", "tshirt", "tee", "tank top", "long sleeve"] },
  { slug: "hoodies-sweatshirts", label: "Hoodies & sweatshirts", keywords: ["hoodie", "sweatshirt", "crewneck", "sweater", "zip up"] },
  { slug: "beanies", label: "Beanies", keywords: ["beanie", "knit hat", "toque"] },
  { slug: "hats-caps", label: "Hats & caps", keywords: ["hat", "cap", "snapback", "trucker", "bucket hat", "visor"] },
  { slug: "stickers-decals", label: "Stickers & decals", keywords: ["sticker", "decal"] },
  { slug: "posters-prints", label: "Posters & prints", keywords: ["poster", "print", "art print", "canvas", "framed"] },
  { slug: "mugs-drinkware", label: "Mugs & drinkware", keywords: ["mug", "drinkware", "tumbler", "bottle", "glass", "cup"] },
  { slug: "tote-bags-backpacks", label: "Tote bags & backpacks", keywords: ["tote", "bag", "backpack", "drawstring"] },
  { slug: "phone-cases", label: "Phone cases", keywords: ["phone case", "iphone case", "samsung case", "phone", "iphone"] },
  { slug: "pins-patches", label: "Pins & patches", keywords: ["pin", "patch", "enamel pin", "badge"] },
  { slug: "socks", label: "Socks", keywords: ["sock"] },
];

const normalize = (s: string) =>
  ` ${s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()} `;

/** True when one of the keywords appears as a whole word (plural allowed) in the text. */
function mentions(text: string, keywords: string[]): boolean {
  const t = normalize(text);
  return keywords.some((k) => {
    const word = normalize(k).trim();
    return t.includes(` ${word} `) || t.includes(` ${word}s `) || t.includes(` ${word}es `);
  });
}

export function findCategory(slug: string | undefined | null): Category | null {
  return CATEGORIES.find((c) => c.slug === slug) ?? null;
}

/** Category slugs chosen by hand in the admin (Products tab), keyed by product handle. */
export type CategoryOverrides = Map<string, string>;

export type CategoryMatch = { category: Category | null; reason: string };

/**
 * Which category a product lands in, and why.
 * A category chosen in the admin always wins. Otherwise: Product type, then title, then tags.
 * (The title counts before tags because tags are often generic or shared between products.)
 */
export function explainCategory(p: Product, overrides?: CategoryOverrides): CategoryMatch {
  const chosen = findCategory(overrides?.get(p.handle));
  if (chosen) return { category: chosen, reason: "Chosen in the admin" };

  const sources: [string, string][] = [
    ["Product type", p.productType ?? ""],
    ["Title", p.title],
    ["Tags", (p.tags ?? []).join(" , ")],
  ];
  for (const [label, text] of sources) {
    if (!text.trim()) continue;
    const hit = CATEGORIES.find((c) => mentions(text, c.keywords));
    if (hit) return { category: hit, reason: `${label}: “${text.length > 60 ? `${text.slice(0, 57)}…` : text}”` };
  }
  return { category: null, reason: "No match: shows under All products only" };
}

/** The category a product belongs to, or null when nothing matches. */
export function productCategory(p: Product, overrides?: CategoryOverrides): Category | null {
  return explainCategory(p, overrides).category;
}

export function productsInCategory(products: Product[], slug: string, overrides?: CategoryOverrides): Product[] {
  return products.filter((p) => productCategory(p, overrides)?.slug === slug);
}
