import { formatMoney, saleInfo } from "@/lib/format";
import type { Money } from "@/lib/types";

/**
 * A price, with the old price struck through when the item is on sale.
 * `size="lg"` is for the product page, which also shows "Save 20%".
 */
export function Price({ price, compareAtPrice, size = "sm" }: { price: Money; compareAtPrice?: Money | null; size?: "sm" | "lg" }) {
  const sale = saleInfo(price, compareAtPrice);
  return (
    <span className={`notranslate inline-flex flex-wrap items-baseline gap-x-2 ${size === "lg" ? "text-lg" : ""}`}>
      <span className={sale ? "font-semibold text-black" : size === "lg" ? "text-neutral-900" : "text-neutral-600"}>{formatMoney(price)}</span>
      {sale && (
        <>
          <span className="sr-only">, was</span>
          <s className={`text-neutral-500 ${size === "lg" ? "text-base" : "text-xs"}`}>{formatMoney(compareAtPrice!)}</s>
          {size === "lg" && <span className="text-xs font-semibold uppercase tracking-wider text-black">Save {sale.percent}%</span>}
        </>
      )}
    </span>
  );
}

/** Small black "Sale" label for the corner of a product image. */
export function SaleBadge() {
  return <span className="bg-black px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-white">Sale</span>;
}
