import Link from "next/link";
import { Card, PageTitle, SavedNotice } from "@/components/admin/Card";
import { inputClass, labelClass } from "@/components/admin/styles";
import { SubmitButton } from "@/components/admin/ui";
import { contactRecipient } from "@/lib/mail";
import { getSettings } from "@/lib/settings";
import { saveContactPageAction } from "../../actions";

export default async function ContactAdmin({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const [settings, sp] = await Promise.all([getSettings(), searchParams]);

  return (
    <>
      <PageTitle title="Contact page" description="The texts on /contact. The form itself emails the shop's mailbox directly." />
      <SavedNotice show={sp.saved === "1"}>Contact page saved.</SavedNotice>

      <form action={saveContactPageAction} className="grid gap-6">
        <Card title="Texts">
          <div className="grid gap-4">
            <p className="text-sm text-neutral-600">
              Messages from the form are emailed straight to <span className="font-medium text-black">{contactRecipient()}</span>. Nothing
              is stored on the website.
            </p>
            <div>
              <label className={labelClass} htmlFor="contactTitle">
                Heading
              </label>
              <input id="contactTitle" name="contactTitle" defaultValue={settings.contactTitle} className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="contactIntro">
                Intro text
              </label>
              <textarea id="contactIntro" name="contactIntro" rows={4} defaultValue={settings.contactIntro} className={inputClass} />
              <p className="mt-1 text-xs text-neutral-500">Leave a blank line between paragraphs.</p>
            </div>
            <div>
              <label className={labelClass} htmlFor="contactEmail">
                Email address shown on the page (optional)
              </label>
              <input
                id="contactEmail"
                name="contactEmail"
                type="email"
                defaultValue={settings.contactEmail}
                placeholder="info@truthpitch.com"
                className={inputClass}
              />
              <p className="mt-1 text-xs text-neutral-500">Shown next to the form. Leave empty to show only the form.</p>
            </div>
          </div>
        </Card>

        <div className="flex items-center gap-4">
          <SubmitButton>Save Contact page</SubmitButton>
          <Link href="/contact" target="_blank" className="text-sm text-neutral-600 underline underline-offset-4 hover:text-black">
            View page
          </Link>
        </div>
      </form>
    </>
  );
}
