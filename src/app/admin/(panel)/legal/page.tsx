import Link from "next/link";
import { Card, PageTitle, SavedNotice } from "@/components/admin/Card";
import { inputClass, labelClass } from "@/components/admin/styles";
import { SubmitButton } from "@/components/admin/ui";
import { missingLegalFields, refundPolicy } from "@/lib/legal";
import { privacyPolicy } from "@/lib/privacy-policy";
import { getSettings } from "@/lib/settings";
import { saveLegalAction } from "../../actions";

export default async function LegalAdmin({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const [s, sp] = await Promise.all([getSettings(), searchParams]);
  const missing = missingLegalFields(s);

  return (
    <>
      <PageTitle
        title="Legal"
        description="Your legal notice (Impressum), refund policy and privacy policy. Shopify requires both to be published before it allows iDEAL | Wero, and Dutch law requires company details on an online shop."
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

        <Card
          title="Refund policy"
          actions={
            <Link href="/refund-policy" target="_blank" className="text-sm text-black underline underline-offset-4">
              View page ↗
            </Link>
          }
        >
          <textarea
            id="refundPolicyText"
            name="refundPolicyText"
            rows={22}
            defaultValue={refundPolicy(s)}
            aria-label="Refund policy text"
            className={`${inputClass} font-mono text-[13px] leading-relaxed`}
          />
          <p className="mt-2 text-xs text-neutral-500">
            Same formatting as blog posts: <code>## Heading</code>, <code>**bold**</code>, <code>- list item</code>, <code>[link](/contact)</code>. Empty the box and save to go back to the
            standard text. Keep the <strong>Shipping &amp; returns</strong> text (Products tab) and your Shopify refund policy in line with this page.
          </p>
        </Card>

        <Card
          title="Privacy policy"
          actions={
            <Link href="/privacy-policy" target="_blank" className="text-sm text-black underline underline-offset-4">
              View page ↗
            </Link>
          }
        >
          <textarea
            id="privacyPolicyText"
            name="privacyPolicyText"
            rows={22}
            defaultValue={privacyPolicy(s)}
            aria-label="Privacy policy text"
            className={`${inputClass} font-mono text-[13px] leading-relaxed`}
          />
          <p className="mt-2 text-xs text-neutral-500">
            Same formatting as blog posts. Update the <strong>Last updated</strong> date at the top when you change it. Empty the box and save to go back to the standard
            text. Use the same text for your Shopify privacy policy (Settings → Policies).
          </p>
        </Card>

        <div>
          <SubmitButton>Save legal pages</SubmitButton>
        </div>
      </form>
    </>
  );
}
