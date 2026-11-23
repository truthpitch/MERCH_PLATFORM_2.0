import type { Metadata } from "next";
import Link from "next/link";
import { toParagraphs } from "@/lib/format";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Legal notice",
  description: "Company details of TruthPitch: name, address, contact information, Chamber of Commerce (KvK) and VAT number.",
  alternates: { canonical: "/legal-notice" },
};

/** Legal notice / Impressum. Filled in at admin → Legal. Empty fields are left out. */
export default async function LegalNoticePage() {
  const s = await getSettings();
  const rows: [string, React.ReactNode][] = [
    ["Company", s.legalCompanyName],
    ["Address", s.legalAddress && <span className="whitespace-pre-line">{s.legalAddress}</span>],
    [
      "Email",
      s.legalEmail && (
        <a href={`mailto:${s.legalEmail}`} className="break-all underline underline-offset-4">
          {s.legalEmail}
        </a>
      ),
    ],
    [
      "Phone",
      s.legalPhone && (
        <a href={`tel:${s.legalPhone.replace(/[^\d+]/g, "")}`} className="underline underline-offset-4">
          {s.legalPhone}
        </a>
      ),
    ],
    ["Chamber of Commerce (KvK)", s.legalKvk],
    ["VAT number", s.legalVat],
  ].filter(([, v]) => Boolean(v)) as [string, React.ReactNode][];

  return (
    <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Legal</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-black sm:text-4xl">Legal notice</h1>
      <p className="mt-4 text-neutral-600">The company behind this online shop.</p>

      <dl className="mt-10 divide-y divide-neutral-200 border-y border-neutral-200">
        {rows.map(([label, value]) => (
          <div key={label} className="grid gap-1 py-4 sm:grid-cols-[14rem_1fr] sm:gap-6">
            <dt className="text-sm text-neutral-500">{label}</dt>
            <dd className="text-black">{value}</dd>
          </div>
        ))}
      </dl>

      {toParagraphs(s.legalExtra).map((p, i) => (
        <p key={i} className="mt-6 whitespace-pre-line text-sm leading-relaxed text-neutral-700">
          {p}
        </p>
      ))}

      <div className="mt-10 space-y-2 text-sm text-neutral-700">
        <p>
          Questions or complaints? Use our{" "}
          <Link href="/contact" className="text-black underline underline-offset-4">
            contact page
          </Link>
          .
        </p>
        <p>
          Every product is printed on demand by our production partner Printful and <strong className="font-medium text-black">shipped worldwide</strong>.
          Production takes 2–5 business days for most items, longer for specialty products. Payments are processed securely by Shopify.
        </p>
        <p>
          Read our{" "}
          <Link href="/terms-of-service" className="text-black underline underline-offset-4">
            terms of service
          </Link>
          ,{" "}
          <Link href="/shipping-policy" className="text-black underline underline-offset-4">
            shipping policy
          </Link>
          ,{" "}
          <Link href="/refund-policy" className="text-black underline underline-offset-4">
            refund policy
          </Link>{" "}
          and{" "}
          <Link href="/privacy-policy" className="text-black underline underline-offset-4">
            privacy policy
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
