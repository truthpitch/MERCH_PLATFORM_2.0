import type { Money } from "./types";

export function formatMoney(money: Money): string {
  const value = Number(money.amount);
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: money.currencyCode }).format(value);
  } catch {
    return `${value.toFixed(2)} ${money.currencyCode}`;
  }
}

/** Split admin-entered text into paragraphs on blank lines. */
export function toParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}
