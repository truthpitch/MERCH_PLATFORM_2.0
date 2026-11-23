import type { Metadata } from "next";
import { PolicyPage } from "@/components/PolicyPage";
import { getSettings } from "@/lib/settings";
import { shippingPolicy } from "@/lib/shipping-policy";

export const metadata: Metadata = {
  title: "Shipping policy",
  description: "How TruthPitch orders are produced and shipped: production time, shipping costs, tracking, customs and what to do if a package is late or damaged.",
  alternates: { canonical: "/shipping-policy" },
};

/** Shipping policy, edited at admin → Legal. */
export default async function ShippingPolicyPage() {
  return <PolicyPage title="Shipping policy" text={shippingPolicy(await getSettings())} />;
}
