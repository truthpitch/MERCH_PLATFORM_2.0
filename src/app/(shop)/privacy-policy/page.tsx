import type { Metadata } from "next";
import { renderPost } from "@/lib/blog-format";
import { privacyPolicy } from "@/lib/privacy-policy";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How TruthPitch collects, uses and protects your personal information, which cookies we use, and your rights under the GDPR.",
  alternates: { canonical: "/privacy-policy" },
};

/** Privacy policy, edited at admin → Legal (same formatting as blog posts). */
export default async function PrivacyPolicyPage() {
  const s = await getSettings();
  return (
    <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Legal</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-black sm:text-4xl">Privacy policy</h1>
      <div className="blog-content mt-10">{renderPost(privacyPolicy(s))}</div>
    </section>
  );
}
