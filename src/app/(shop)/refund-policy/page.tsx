import type { Metadata } from "next";
import { PolicyPage } from "@/components/PolicyPage";
import { refundPolicy } from "@/lib/legal";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Refund policy",
  description: "How cancelling, returning and refunds work at TruthPitch, including the 14-day right to cancel and what to do with a damaged or faulty item.",
  alternates: { canonical: "/refund-policy" },
};

/** Refund policy, edited at admin → Legal. */
export default async function RefundPolicyPage() {
  return <PolicyPage title="Refund policy" text={refundPolicy(await getSettings())} />;
}
