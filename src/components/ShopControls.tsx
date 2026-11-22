"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

type Option = { value: string; label: string };

/**
 * Sort and filter menus for the Shop page. Changing a menu updates the address
 * (?sort=…&size=…), so filtered pages can be shared and the back button works.
 * Without JavaScript the "Apply" button submits the same form.
 */
export function ShopControls({
  sorts,
  sizes,
  colors,
  prices,
  currency,
}: {
  sorts: Option[];
  sizes: string[];
  colors: string[];
  prices: Option[];
  currency: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const value = (key: string) => params.get(key) ?? "";
  const active = ["size", "color", "price"].some((k) => value(k));

  function update(key: string, v: string) {
    const next = new URLSearchParams(params.toString());
    if (v && !(key === "sort" && v === "newest")) next.set(key, v);
    else next.delete(key);
    const qs = next.toString();
    startTransition(() => router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false }));
  }

  function clearFilters() {
    const next = new URLSearchParams(params.toString());
    ["size", "color", "price"].forEach((k) => next.delete(k));
    const qs = next.toString();
    startTransition(() => router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false }));
  }

  const select =
    "w-full appearance-none border border-neutral-300 bg-white py-2 pl-3 pr-8 text-sm text-black outline-none focus:border-black aria-[current=true]:border-black";
  const field = (id: string, label: string, key: string, options: Option[], allLabel?: string) => (
    <label htmlFor={id} className="relative block min-w-0 sm:w-auto">
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-neutral-500">{label}</span>
      <select
        id={id}
        name={key}
        value={value(key) || (key === "sort" ? "newest" : "")}
        onChange={(e) => update(key, e.target.value)}
        aria-current={key !== "sort" && value(key) ? true : undefined}
        className={select}
      >
        {allLabel !== undefined && <option value="">{allLabel}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden className="pointer-events-none absolute bottom-3 right-2.5 text-black">
        <path d="m6 9 6 6 6-6" />
      </svg>
    </label>
  );

  return (
    <form action={pathname} className={`mb-8 transition-opacity ${pending ? "opacity-60" : ""}`} aria-busy={pending}>
      {/* Keep the chosen category when the form is submitted without JavaScript. */}
      {value("category") && <input type="hidden" name="category" value={value("category")} />}
      <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-end">
        {field("sort", "Sort by", "sort", sorts)}
        {sizes.length > 0 && field("filter-size", "Size", "size", sizes.map((s) => ({ value: s, label: s })), "All sizes")}
        {colors.length > 0 && field("filter-color", "Colour", "color", colors.map((c) => ({ value: c, label: c })), "All colours")}
        {field(
          "filter-price",
          `Price (${currency})`,
          "price",
          prices,
          "All prices",
        )}
        <noscript>
          <button className="border border-black bg-black px-4 py-2 text-sm font-medium text-white">Apply</button>
        </noscript>
        {active && (
          <button type="button" onClick={clearFilters} className="col-span-2 justify-self-start pb-2 text-sm text-black underline underline-offset-4 sm:col-span-1">
            Clear filters
          </button>
        )}
      </div>
    </form>
  );
}
