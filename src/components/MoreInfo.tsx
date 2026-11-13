import { toParagraphs } from "@/lib/format";

/** Foldable "MORE INFO" section — native <details>, so it works without JavaScript. */
export function MoreInfo({ story, imageUrl }: { story: string; imageUrl?: string }) {
  const paragraphs = toParagraphs(story);
  if (paragraphs.length === 0 && !imageUrl) return null;

  return (
    <details className="group border-y border-neutral-200">
      <summary className="flex cursor-pointer items-center justify-between py-4 text-xs font-semibold uppercase tracking-[0.2em] text-black">
        More info
        <span className="text-lg font-light leading-none transition-transform group-open:rotate-45" aria-hidden>
          +
        </span>
      </summary>
      <div className="space-y-4 pb-6 text-sm leading-relaxed text-neutral-700">
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" loading="lazy" className="w-full bg-neutral-100 object-cover" />
        )}
        {paragraphs.map((p, i) => (
          <p key={i} className="whitespace-pre-line">
            {p}
          </p>
        ))}
      </div>
    </details>
  );
}
