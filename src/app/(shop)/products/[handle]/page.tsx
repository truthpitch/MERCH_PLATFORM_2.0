import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/AddToCart";
import { FoldSection, MoreInfo, ProductDetails, TextFold } from "@/components/MoreInfo";
import { FavoriteButton } from "@/components/favorites/FavoritesProvider";
import { ProductGrid } from "@/components/ProductCard";
import { ReviewsSection } from "@/components/reviews/ReviewsSection";
import { Stars } from "@/components/reviews/Stars";
import { SizeTable } from "@/components/SizeTable";
import { getCategoryOverrides, getProduct, getProductStory, getRelatedProducts } from "@/lib/catalog";
import { productCategory } from "@/lib/categories";
import { getCustomerId } from "@/lib/customers";
import { getProductReviews, getRatingSummaries } from "@/lib/reviews";
import { orderingState, pauseText } from "@/lib/ordering";
import { getSettings } from "@/lib/settings";
import { getSizeGuide } from "@/lib/size-guides";

type Props = { params: Promise<{ handle: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct((await params).handle);
  return product ? { title: product.title, description: product.description.slice(0, 160) } : {};
}

export default async function ProductPage({ params }: Props) {
  const { handle } = await params;
  const product = await getProduct(handle);
  if (!product) notFound();

  const [story, related, overrides, settings, customerId] = await Promise.all([
    getProductStory(product),
    getRelatedProducts(handle),
    getCategoryOverrides(),
    getSettings(),
    getCustomerId(),
  ]);
  const [sizeGuide, reviews, relatedRatings] = await Promise.all([
    getSizeGuide(productCategory(product, overrides)?.slug),
    getProductReviews(handle, customerId),
    getRatingSummaries(related.map((p) => p.handle)),
  ]);
  const ordering = orderingState(settings);
  const images = product.images.length ? product.images : product.featuredImage ? [product.featuredImage] : [];
  const { summary } = reviews;

  return (
    <>
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 md:gap-16">
        {/* Images */}
        <div className="space-y-4">
          {images.map((img, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={img.url}
              src={img.url}
              alt={img.altText ?? product.title}
              loading={i === 0 ? "eager" : "lazy"}
              className="aspect-[4/5] w-full bg-neutral-100 object-cover"
            />
          ))}
        </div>

        {/* Details */}
        {/* min-w-0: lets wide content (the size table) scroll inside instead of widening the page. */}
        <div className="min-w-0 md:sticky md:top-24 md:self-start">
          <h1 className="text-3xl font-semibold tracking-tight text-black">{product.title}</h1>
          {summary.count > 0 && (
            <a href="#reviews" className="mt-2 inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-black">
              <Stars value={summary.average} />
              <span className="underline-offset-4 hover:underline">
                {summary.average.toFixed(1)} · {summary.count} {summary.count === 1 ? "review" : "reviews"}
              </span>
            </a>
          )}
          <div className="mt-6">
            <AddToCart variants={product.variants} hasSizeGuide={Boolean(sizeGuide)} pausedMessage={ordering.paused ? pauseText(ordering) : null} />
          </div>
          <div className="mt-3">
            <FavoriteButton handle={product.handle} title={product.title} variant="full" />
          </div>
          {/* All fold open on click and start closed; one line between them. */}
          <div className="mt-10 divide-y divide-neutral-200 border-y border-neutral-200 empty:hidden">
            <ProductDetails description={product.description} />
            {sizeGuide && (
              <FoldSection title="Size guide" id="size-guide">
                <SizeTable table={sizeGuide} />
              </FoldSection>
            )}
            <TextFold title="Shipping & returns" text={settings.shippingReturnsText} />
            <MoreInfo story={story.story} imageUrl={story.imageUrl} />
          </div>
        </div>
      </section>

      <ReviewsSection handle={product.handle} productTitle={product.title} signedIn={Boolean(customerId)} {...reviews} />

      {related.length > 0 && (
        <section className="mx-auto max-w-6xl border-t border-neutral-200 px-4 py-16 sm:px-6">
          <h2 className="mb-10 text-xs font-semibold uppercase tracking-[0.2em] text-black">You may also like</h2>
          <ProductGrid products={related} ratings={relatedRatings} />
        </section>
      )}
    </>
  );
}
