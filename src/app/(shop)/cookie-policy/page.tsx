import type { Metadata } from "next";
import { PolicyPage } from "@/components/PolicyPage";
import { cookiePolicy } from "@/lib/cookie-policy";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Cookie policy",
  description: "Which cookies TruthPitch uses, why, and how to accept or reject analytics cookies at any time.",
  alternates: { canonical: "/cookie-policy" },
};

/** Cookie policy, edited at admin → Legal. */
export default async function CookiePolicyPage() {
  return <PolicyPage title="Cookie policy" text={cookiePolicy(await getSettings())} />;
}
