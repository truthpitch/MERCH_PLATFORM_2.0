import type { Metadata } from "next";
import { PolicyPage } from "@/components/PolicyPage";
import { howItWorks } from "@/lib/how-it-works";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "How it works",
  description: "How ordering at TruthPitch works: choosing your size, paying securely, print-on-demand production, worldwide shipping, returns, accounts and reviews.",
  alternates: { canonical: "/how-it-works" },
};

/** Explains the shop's processes step by step. Edited at admin → Legal. */
export default async function HowItWorksPage() {
  return <PolicyPage title="How it works" label="Help" text={howItWorks(await getSettings())} />;
}
