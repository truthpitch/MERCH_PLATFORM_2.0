import Link from "next/link";
import { Card, PageTitle, SavedNotice } from "@/components/admin/Card";
import { inputClass, labelClass } from "@/components/admin/styles";
import { SubmitButton } from "@/components/admin/ui";
import { missingLegalFields, refundPolicy } from "@/lib/legal";
import { privacyPolicy } from "@/lib/privacy-policy";
import { shippingPolicy } from "@/lib/shipping-policy";
import { termsOfService } from "@/lib/terms";
import { getSettings } from "@/lib/settings";
import { saveLegalAction } from "../../actions";

export default async function LegalAdmin({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const [s, sp] = await Promise.all([getSettings(), searchParams]);
  const missing = missingLegalFields(s);
  // The policy pages, each in a fold-out box with its own text field.
  const policies = [
    { name: "termsText", title: "Terms of service", href: "/terms-of-service", text: termsOfService(s), custom: Boolean(s.termsText), help: "The rules for ordering: prices, contract, payment, delivery, warranty, accounts and reviews." },
    { name: "shippingPolicyText", title: "Shipping policy", href: "/shipping-policy", text: shippingPolicy(s), custom: Boolean(s.shippingPolicyText), help: "Production time, shipping costs, tracking, customs and late or lost packages." },
    { name: "refundPolicyText", title: "Refund policy", href: "/refund-policy", text: refundPolicy(s), custom: Boolean(s.refundPolicyText), help: "Cancelling, returning and refunds. Required by Shopify for iDEAL | Wero." },
    { name: "privacyPolicyText", title: "Privacy policy", href: "/privacy-policy", text: privacyPolicy(s), custom: Boolean(s.privacyPolicyText), help: "Which personal data you collect, why, with whom you share it, cookies and visitors' rights." },
  ];

  return (
    <>
      <PageTitle
        title="Legal"
        description="Your legal notice (Impressum) and policy pages: terms of service, shipping, refund and privacy. Shopify requires a legal notice and refund policy for iDEAL | Wero, and Dutch law requires company details on an online shop."
      />
      <SavedNotice show={sp.saved === "1"}>Saved. The pages are updated on the website.</SavedNotice>
      {missing.length > 0 && (
        <p className="mb-6 border border-black bg-white px-4 py-3 text-sm text-black">
          <strong>Still missing in the legal notice:</strong> {missing.join(", ")}. Fill these in so the page is complete.
        </p>
      )}

      <form action={saveLegalAction} className="grid gap-6">
        <Card
          title="Legal notice (Impressum)"
          actions={
            <Link href="/legal-notice" target="_blank" className="text-sm text-black underline underline-offset-4">
              View page ↗
            </Link>
          }
        >
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="legalCompanyName" className={labelClass}>
                Company name (as registered at the KvK)
              </label>
              <input id="legalCompanyName" name="legalCompanyName" defaultValue={s.legalCompanyName} className={inputClass} />
            </div>
            <div>
              <label htmlFor="legalKvk" className={labelClass}>
                KvK number
              </label>
              <input id="legalKvk" name="legalKvk" defaultValue={s.legalKvk} inputMode="numeric" className={inputClass} />
            </div>
            <div className="md:row-span-2">
              <label htmlFor="legalAddress" className={labelClass}>
                Address
              </label>
              <textarea
                id="legalAddress"
                name="legalAddress"
                rows={4}
                defaultValue={s.legalAddress}
                placeholder={"Street and number\nPostcode and city\nCountry"}
                className={inputClass}
              />
              <p className="mt-1 text-xs text-neutral-500">The address registered at the KvK (a visiting or business address, not a PO box).</p>
            </div>
            <div>
              <label htmlFor="legalVat" className={labelClass}>
                VAT number (btw-id)
              </label>
              <input id="legalVat" name="legalVat" defaultValue={s.legalVat} placeholder="NL000000000B01" className={inputClass} />
            </div>
            <div>
              <label htmlFor="legalEmail" className={labelClass}>
                Email
              </label>
              <input id="legalEmail" name="legalEmail" type="email" defaultValue={s.legalEmail} placeholder="info@truthpitch.com" className={inputClass} />
            </div>
            <div>
              <label htmlFor="legalPhone" className={labelClass}>
                Phone <span className="normal-case tracking-normal text-neutral-400">(recommended)</span>
              </label>
              <input id="legalPhone" name="legalPhone" type="tel" defaultValue={s.legalPhone} className={inputClass} />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="legalExtra" className={labelClass}>
                Extra information <span className="normal-case tracking-normal text-neutral-400">(optional)</span>
              </label>
              <textarea
                id="legalExtra"
                name="legalExtra"
                rows={3}
                defaultValue={s.legalExtra}
                placeholder="E.g. legal form (sole proprietorship / BV), the name of the owner or director."
                className={inputClass}
              />
            </div>
          </div>
        </Card>

        {policies.map((p) => (
          <details key={p.name} id={p.name} className="group scroll-mt-6 border border-neutral-200 bg-white">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-4 [&::-webkit-details-marker]:hidden">
              <span className="text-sm font-semibold uppercase tracking-wider text-black">{p.title}</span>
              <span className="flex items-center gap-4 text-xs text-neutral-500">
                <span>{p.custom ? "Your own text" : "Standard text"}</span>
                <span className="text-lg font-light leading-none text-black transition-transform group-open:rotate-45" aria-hidden>
                  +
                </span>
              </span>
            </summary>
            <div className="border-t border-neutral-200 p-6">
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-xs text-neutral-500">{p.help}</p>
                <Link href={p.href} target="_blank" className="text-sm text-black underline underline-offset-4">
                  View page ↗
                </Link>
              </div>
              <textarea
                name={p.name}
                rows={22}
                defaultValue={p.text}
                aria-label={`${p.title} text`}
                className={`${inputClass} font-mono text-[13px] leading-relaxed`}
              />
              <p className="mt-2 text-xs text-neutral-500">
                Same formatting as blog posts: <code>## Heading</code>, <code>**bold**</code>, <code>- list item</code>, <code>[link](/contact)</code>. Update the{" "}
                <strong>Last updated</strong> date when you change it. Empty the box and save to go back to the standard text. Use the same text in Shopify (Settings →
                Policies).
              </p>
            </div>
          </details>
        ))}

        <div>
          <SubmitButton>Save legal pages</SubmitButton>
        </div>
      </form>
    </>
  );
}
