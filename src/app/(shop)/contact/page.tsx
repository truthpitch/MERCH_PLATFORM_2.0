import type { Metadata } from "next";
import { toParagraphs } from "@/lib/format";
import { getSettings } from "@/lib/settings";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with TruthPitch about orders, sizing or anything else.",
};

export default async function ContactPage() {
  const settings = await getSettings();
  return (
    <section className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 md:grid-cols-[1fr_2fr] md:gap-16 md:py-24">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-black sm:text-4xl">{settings.contactTitle}</h1>
        <div className="mt-6 space-y-4 text-neutral-600">
          {toParagraphs(settings.contactIntro).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        {settings.contactEmail && (
          <div className="mt-8 border-t border-neutral-200 pt-6 text-sm">
            <p className="text-xs uppercase tracking-wider text-neutral-500">Email</p>
            <a href={`mailto:${settings.contactEmail}`} className="mt-1 inline-block break-all text-black underline underline-offset-4">
              {settings.contactEmail}
            </a>
          </div>
        )}
      </div>
      <ContactForm />
    </section>
  );
}
