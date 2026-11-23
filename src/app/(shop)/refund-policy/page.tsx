import type { Metadata } from "next";
import { renderPost } from "@/lib/blog-format";
import { refundPolicy } from "@/lib/legal";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Refund policy",
  description: "How cancelling, returning and refunds work at TruthPitch, including the 14-day right to cancel and what to do with a damaged or faulty item.",
  alternates: { canonical: "/refund-policy" },
};

/** Refund policy, edited at admin → Legal (same formatting as blog posts). */
export default async function RefundPolicyPage() {
  const s = await getSettings();
  return (
    <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Legal</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-black sm:text-4xl">Refund policy</h1>
      <div className="blog-content mt-10">{renderPost(refundPolicy(s))}</div>
    </section>
  );
}
