import type { Metadata } from "next";
import { PolicyPage } from "@/components/PolicyPage";
import { privacyPolicy } from "@/lib/privacy-policy";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How TruthPitch collects, uses and protects your personal information, which cookies we use, and your rights under the GDPR.",
  alternates: { canonical: "/privacy-policy" },
};

/** Privacy policy, edited at admin → Legal. */
export default async function PrivacyPolicyPage() {
  return <PolicyPage title="Privacy policy" text={privacyPolicy(await getSettings())} />;
}
