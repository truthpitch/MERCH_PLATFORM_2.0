import { renderPost } from "@/lib/blog-format";

/** Layout for the legal pages (refund, privacy, shipping, terms). Text uses the blog formatting. */
export function PolicyPage({ title, text }: { title: string; text: string }) {
  return (
    <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Legal</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-black sm:text-4xl">{title}</h1>
      <div className="blog-content mt-10">{renderPost(text)}</div>
    </section>
  );
}
