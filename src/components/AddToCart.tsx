"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { addToCartAction } from "@/app/(shop)/cart/actions";
import { formatMoney } from "@/lib/format";
import type { ProductVariant } from "@/lib/types";

export function AddToCart({ variants }: { variants: ProductVariant[] }) {
  const firstAvailable = variants.find((v) => v.availableForSale) ?? variants[0];
  const [variantId, setVariantId] = useState(firstAvailable?.id);
  const [status, setStatus] = useState<"idle" | "added" | "error">("idle");
  const [pending, startTransition] = useTransition();

  const variant = variants.find((v) => v.id === variantId) ?? firstAvailable;
  const hasOptions = variants.length > 1 || (variants[0] && variants[0].title !== "Default Title");

  if (!variant) return null;

  function add() {
    if (!variant) return;
    setStatus("idle");
    startTransition(async () => {
      const res = await addToCartAction(variant.id, 1);
      setStatus(res.ok ? "added" : "error");
    });
  }

  return (
    <div className="space-y-5">
      <p className="text-lg text-neutral-900">{formatMoney(variant.price)}</p>

      {hasOptions && (
        <div>
          <p className="mb-2 text-xs uppercase tracking-wider text-neutral-500">Option</p>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => (
              <button
                key={v.id}
                type="button"
                disabled={!v.availableForSale}
                onClick={() => {
                  setVariantId(v.id);
                  setStatus("idle");
                }}
                className={`min-w-12 border px-3 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:text-neutral-300 disabled:line-through ${
                  v.id === variant.id ? "border-black bg-black text-white" : "border-neutral-300 text-neutral-800 hover:border-black"
                }`}
              >
                {v.title}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={add}
        disabled={pending || !variant.availableForSale}
        className="w-full bg-black px-6 py-4 text-sm font-medium uppercase tracking-wider text-white transition-colors hover:bg-neutral-800 disabled:bg-neutral-400"
      >
        {!variant.availableForSale ? "Sold out" : pending ? "Adding…" : "Add to cart"}
      </button>

      {status === "added" && (
        <p className="text-sm text-neutral-700">
          Added to your cart.{" "}
          <Link href="/cart" className="underline underline-offset-4 hover:text-black">
            View cart &amp; checkout
          </Link>
        </p>
      )}
      {status === "error" && <p className="text-sm text-neutral-700">Something went wrong. Please try again.</p>}
    </div>
  );
}
