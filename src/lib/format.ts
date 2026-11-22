import type { Money } from "./types";

export function formatMoney(money: Money): string {
  const value = Number(money.amount);
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: money.currencyCode }).format(value);
  } catch {
    return `${value.toFixed(2)} ${money.currencyCode}`;
  }
}

/** When compareAt is higher than price, the item is on sale: returns the discount in whole percent. */
export function saleInfo(price: Money, compareAt?: Money | null): { percent: number } | null {
  if (!compareAt || compareAt.currencyCode !== price.currencyCode) return null;
  const now = Number(price.amount);
  const was = Number(compareAt.amount);
  if (!(was > now) || !(now >= 0)) return null;
  return { percent: Math.max(1, Math.round(((was - now) / was) * 100)) };
}

/** Split admin-entered text into paragraphs on blank lines. */
export function toParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}
