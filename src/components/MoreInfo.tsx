import { toParagraphs } from "@/lib/format";

/**
 * A foldable section with a "+" that turns into "×" when open. Closed by default.
 * Native <details>, so it works without JavaScript. Stack several inside a
 * `divide-y border-y` wrapper so they share one line between them.
 */
export function FoldSection({ title, children, id }: { title: string; children: React.ReactNode; id?: string }) {
  return (
    <details id={id} className="group scroll-mt-24">
      <summary className="flex cursor-pointer list-none items-center justify-between py-4 text-xs font-semibold uppercase tracking-[0.2em] text-black [&::-webkit-details-marker]:hidden">
        {title}
        <span className="text-lg font-light leading-none transition-transform group-open:rotate-45" aria-hidden>
          +
        </span>
      </summary>
      <div className="space-y-4 pb-6 text-sm leading-relaxed text-neutral-700">{children}</div>
    </details>
  );
}

/** The product description from Shopify, folded away under "Product details". */
export function ProductDetails({ description }: { description: string }) {
  const paragraphs = toParagraphs(description);
  if (paragraphs.length === 0) return null;
  return (
    <FoldSection title="Product details">
      {paragraphs.map((p, i) => (
        <p key={i} className="whitespace-pre-line">
          {p}
        </p>
      ))}
    </FoldSection>
  );
}

/** Plain text set in the admin (e.g. "Shipping & returns"), split into paragraphs. */
export function TextFold({ title, text }: { title: string; text: string }) {
  const paragraphs = toParagraphs(text);
  if (paragraphs.length === 0) return null;
  return (
    <FoldSection title={title}>
      {paragraphs.map((p, i) => (
        <p key={i} className="whitespace-pre-line">
          {p}
        </p>
      ))}
    </FoldSection>
  );
}

/** Foldable "MORE INFO" section: the story (and optional image) written in the admin. */
export function MoreInfo({ story, imageUrl }: { story: string; imageUrl?: string }) {
  const paragraphs = toParagraphs(story);
  if (paragraphs.length === 0 && !imageUrl) return null;

  return (
    <FoldSection title="More info">
      {imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" loading="lazy" className="w-full bg-neutral-100 object-cover" />
      )}
      {paragraphs.map((p, i) => (
        <p key={i} className="whitespace-pre-line">
          {p}
        </p>
      ))}
    </FoldSection>
  );
}
