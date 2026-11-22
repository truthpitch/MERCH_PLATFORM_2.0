import Link from "next/link";
import { FavoriteButton } from "./favorites/FavoritesProvider";
import { Price, SaleBadge } from "./Price";
import { Stars } from "./reviews/Stars";
import { saleInfo, toParagraphs } from "@/lib/format";
import type { RatingSummary } from "@/lib/reviews";
import type { Product } from "@/lib/types";

export function ProductCard({ product, story, rating }: { product: Product; story?: string; rating?: RatingSummary }) {
  const image = product.featuredImage;
  const paragraphs = story ? toParagraphs(story) : [];
  const onSale = product.variants.some((v) => saleInfo(v.price, v.compareAtPrice)) || Boolean(saleInfo(product.price, product.compareAtPrice));
  return (
    <div>
      <div className="relative">
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
          <h3 className="font-medium text-neutral-900 group-hover:underline group-hover:underline-offset-4">{product.title}</h3>
          <p className="shrink-0 text-right">
            <Price price={product.price} compareAtPrice={product.compareAtPrice} />
          </p>
        </div>
        {rating && rating.count > 0 && (
          <p className="mt-1 flex items-center gap-1.5 text-xs text-neutral-600">
            <Stars value={rating.average} size={12} />
            <span>
              {rating.average.toFixed(1)} ({rating.count})
            </span>
          </p>
        )}
      </Link>
      {onSale && (
        <div className="pointer-events-none absolute left-2 top-2">
          <SaleBadge />
        </div>
      )}
      {/* The heart sits on the image, outside the link so it can be clicked on its own. */}
      <div className="absolute right-2 top-2">
        <FavoriteButton handle={product.handle} title={product.title} />
      </div>
      </div>
      {!product.availableForSale && <p className="mt-1 text-xs uppercase tracking-wider text-neutral-500">Sold out</p>}

      {/* Foldable MORE INFO: the full story only shows once it's opened. Native <details>, no JavaScript needed. */}
      {paragraphs.length > 0 && (
        <details className="group mt-2 border-t border-neutral-200">
          <summary className="flex cursor-pointer items-center justify-between py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-700 hover:text-black">
            More info
            <span className="text-base font-light leading-none transition-transform group-open:rotate-45" aria-hidden>
              +
            </span>
          </summary>
          <div className="space-y-3 pb-3 text-sm leading-relaxed text-neutral-600">
            {paragraphs.map((p, i) => (
              <p key={i} className="whitespace-pre-line">
                {p}
              </p>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

/**
 * Pass `stories` (handle → MORE INFO text) to show a foldable MORE INFO under each title,
 * and `ratings` (handle → average and count) to show review stars.
 */
export function ProductGrid({
  products,
  stories,
  ratings,
}: {
  products: Product[];
  stories?: Map<string, string>;
  ratings?: Map<string, RatingSummary>;
}) {
  if (products.length === 0) return <p className="text-sm text-neutral-500">No products found.</p>;
  return (
    <div className="grid grid-cols-2 items-start gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} story={stories?.get(p.handle)} rating={ratings?.get(p.handle)} />
      ))}
    </div>
  );
}
