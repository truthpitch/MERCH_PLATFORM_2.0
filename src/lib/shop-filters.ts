// Sorting and filtering for the Shop page (/products?sort=…&size=…&color=…&price=…).
import type { Product } from "./types";

export const SORTS = [
  { key: "newest", label: "Newest" },
  { key: "price-asc", label: "Price: low to high" },
  { key: "price-desc", label: "Price: high to low" },
  { key: "name", label: "Name: A–Z" },
] as const;
export type SortKey = (typeof SORTS)[number]["key"];

/** Price bands in the shop's own currency. */
export const PRICE_BANDS = [
  { key: "under-25", label: "Under 25", min: 0, max: 25 },
  { key: "25-50", label: "25 – 50", min: 25, max: 50 },
  { key: "over-50", label: "Over 50", min: 50, max: Infinity },
] as const;

export type ShopQuery = { sort: SortKey; size: string; color: string; price: string };

const isSize = (name: string) => /^size$|größe|taille|maat/i.test(name);
const isColor = (name: string) => /^colou?r$|farbe|couleur|kleur/i.test(name);

/** Sizes in the order people expect, then anything else alphabetically. */
const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "2XL", "XXL", "3XL", "XXXL", "4XL", "5XL"];
const sizeRank = (s: string) => {
  const i = SIZE_ORDER.indexOf(s.toUpperCase());
  return i === -1 ? 100 : i;
};

function optionValues(product: Product, test: (name: string) => boolean, availableOnly = true): string[] {
  return product.variants
    .filter((v) => !availableOnly || v.availableForSale)
    .flatMap((v) => (v.selectedOptions ?? []).filter((o) => test(o.name)).map((o) => o.value.trim()))
    .filter(Boolean);
}

/** Read and clean the query string. Unknown values fall back to "no filter". */
export function parseShopQuery(sp: Record<string, string | undefined>): ShopQuery {
  const sort = SORTS.some((s) => s.key === sp.sort) ? (sp.sort as SortKey) : "newest";
  const price = PRICE_BANDS.some((b) => b.key === sp.price) ? sp.price! : "";
  return { sort, size: (sp.size ?? "").slice(0, 40), color: (sp.color ?? "").slice(0, 40), price };
}

/** The sizes and colours that exist among these products, for the filter menus. */
export function filterOptions(products: Product[]) {
  const sizes = [...new Set(products.flatMap((p) => optionValues(p, isSize)))].sort(
    (a, b) => sizeRank(a) - sizeRank(b) || a.localeCompare(b, undefined, { numeric: true }),
  );
  const colors = [...new Set(products.flatMap((p) => optionValues(p, isColor)))].sort((a, b) => a.localeCompare(b));
  return { sizes, colors };
}

const same = (a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: "base" }) === 0;

/** Apply the filters and the sort. Products keep Shopify's newest-first order for "Newest". */
export function applyShopQuery(products: Product[], q: ShopQuery): Product[] {
  const band = PRICE_BANDS.find((b) => b.key === q.price);
  const filtered = products.filter((p) => {
    if (q.size && !optionValues(p, isSize).some((v) => same(v, q.size))) return false;
    if (q.color && !optionValues(p, isColor).some((v) => same(v, q.color))) return false;
    if (band) {
      const price = Number(p.price.amount);
      if (price < band.min || price >= band.max) return false;
    }
    return true;
  });
  const byPrice = (p: Product) => Number(p.price.amount);
  switch (q.sort) {
    case "price-asc":
      return [...filtered].sort((a, b) => byPrice(a) - byPrice(b));
    case "price-desc":
      return [...filtered].sort((a, b) => byPrice(b) - byPrice(a));
    case "name":
      return [...filtered].sort((a, b) => a.title.localeCompare(b.title));
    default:
      return filtered;
  }
}

/** True when any filter (not the sort) is active. */
export const hasFilters = (q: ShopQuery) => Boolean(q.size || q.color || q.price);
