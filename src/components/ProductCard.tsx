import Link from "next/link";
import { formatMoney } from "@/lib/format";
import type { Product } from "@/lib/types";

export function ProductCard({ product, story }: { product: Product; story?: string }) {
  // A short, single-paragraph preview of the MORE INFO text (full text is on the product page).
  const preview = story?.replace(/\s+/g, " ").trim();
  const image = product.featuredImage;
  return (
    <Link href={`/products/${product.handle}`} className="group block">
      <div className="aspect-[4/5] overflow-hidden bg-neutral-100">
        {image ? (
          // Plain <img> keeps the build host-agnostic (no image optimizer needed on Hostinger).
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image.url}
            alt={image.altText ?? product.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : null}
      </div>
      <div className="mt-3 flex items-start justify-between gap-3 text-sm">
        <h3 className="font-medium text-neutral-900">{product.title}</h3>
        <p className="shrink-0 text-neutral-600">{formatMoney(product.price)}</p>
      </div>
      {preview && <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-neutral-500">{preview}</p>}
      {!product.availableForSale && <p className="mt-1 text-xs uppercase tracking-wider text-neutral-500">Sold out</p>}
    </Link>
  );
}

/** Pass `stories` (handle → MORE INFO text) to show a short story preview under each title. */
export function ProductGrid({ products, stories }: { products: Product[]; stories?: Map<string, string> }) {
  if (products.length === 0) return <p className="text-sm text-neutral-500">No products yet.</p>;
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} story={stories?.get(p.handle)} />
      ))}
    </div>
  );
}
