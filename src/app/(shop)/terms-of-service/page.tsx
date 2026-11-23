import type { Metadata } from "next";
import { PolicyPage } from "@/components/PolicyPage";
import { getSettings } from "@/lib/settings";
import { termsOfService } from "@/lib/terms";

export const metadata: Metadata = {
  title: "Terms of service",
  description: "The terms that apply to orders in the TruthPitch online shop: prices, ordering, payment, delivery, your right to cancel, warranty and more.",
  alternates: { canonical: "/terms-of-service" },
};

/** Terms of service, edited at admin → Legal. */
export default async function TermsOfServicePage() {
  return <PolicyPage title="Terms of service" text={termsOfService(await getSettings())} />;
}
