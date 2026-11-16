// Product categories shown under SHOP in the menu.
//
// A product lands in a category based on (in this order):
//   1. its Shopify "Product type" (e.g. "T-Shirt", "Hoodie", "Mug"),
//   2. its Shopify tags,
//   3. its title.
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

/** The category a product belongs to, or null when nothing matches. */
export function productCategory(p: Product): Category | null {
  const sources = [p.productType ?? "", (p.tags ?? []).join(" , "), p.title];
  for (const source of sources) {
    if (!source.trim()) continue;
    const hit = CATEGORIES.find((c) => mentions(source, c.keywords));
    if (hit) return hit;
  }
  return null;
}

export function productsInCategory(products: Product[], slug: string): Product[] {
  return products.filter((p) => productCategory(p)?.slug === slug);
}
