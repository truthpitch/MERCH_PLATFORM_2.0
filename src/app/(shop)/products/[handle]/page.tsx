import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/AddToCart";
import { MoreInfo, ProductDetails } from "@/components/MoreInfo";
import { FavoriteButton } from "@/components/favorites/FavoritesProvider";
import { ProductGrid } from "@/components/ProductCard";
import { getProduct, getProductStory, getRelatedProducts } from "@/lib/catalog";

type Props = { params: Promise<{ handle: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct((await params).handle);
  return product ? { title: product.title, description: product.description.slice(0, 160) } : {};
}

export default async function ProductPage({ params }: Props) {
  const { handle } = await params;
  const product = await getProduct(handle);
  if (!product) notFound();

  const [story, related] = await Promise.all([getProductStory(product), getRelatedProducts(handle)]);
  const images = product.images.length ? product.images : product.featuredImage ? [product.featuredImage] : [];

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
        <div className="md:sticky md:top-24 md:self-start">
          <h1 className="text-3xl font-semibold tracking-tight text-black">{product.title}</h1>
          <div className="mt-6">
            <AddToCart variants={product.variants} />
          </div>
          <div className="mt-3">
            <FavoriteButton handle={product.handle} title={product.title} variant="full" />
          </div>
          {/* Both fold open on click and start closed; one line between them. */}
          <div className="mt-10 divide-y divide-neutral-200 border-y border-neutral-200 empty:hidden">
            <ProductDetails description={product.description} />
            <MoreInfo story={story.story} imageUrl={story.imageUrl} />
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="mx-auto max-w-6xl border-t border-neutral-200 px-4 py-16 sm:px-6">
          <h2 className="mb-10 text-xs font-semibold uppercase tracking-[0.2em] text-black">You may also like</h2>
          <ProductGrid products={related} />
        </section>
      )}
    </>
  );
}
