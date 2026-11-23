// Legal notice (Impressum) and refund policy, edited in admin → Legal.
// Shopify requires a published legal notice and a clear refund policy for iDEAL | Wero.

/**
 * Used when the admin hasn't written their own policy. It follows the EU rules for
 * online shops (14-day right of withdrawal). Same formatting as blog posts (## headings, - lists).
 */
export const DEFAULT_REFUND_POLICY = `**Last updated: 23 November 2026**

We want you to be happy with your order. This policy explains how cancelling, returning and refunds work. It applies to customers in every country we ship to (we ship worldwide).

## Your right to cancel (14 days)

You can cancel your purchase **without giving a reason within 14 days**. The 14 days start on the day you, or someone you named (not the carrier), receive the product. If your order arrives in more than one package, the 14 days start when you receive the **last** package.

To cancel, tell us before the 14 days are over with a clear statement, for example by email to **info@truthpitch.com** or through our [contact page](/contact). You may use the model cancellation form at the bottom of this page, but you don't have to. Sending your message before the 14 days are over is enough.

**Changed your mind right after ordering?** Contact us as soon as possible. Every item is made to order, usually within 2 to 5 business days. If production hasn't started yet, we can cancel your order at no cost.

## Returning a product

- Send the product back **within 14 days** after you told us you're cancelling. **Contact us first**, so we can give you the return address.
- You pay the cost of sending the product back, unless it's faulty or we sent the wrong item.
- Please handle the product only as you would in a shop: you may try it on, but not wear, wash or use it. If it's been used beyond that, we may deduct the loss in value from your refund.
- **Returning from outside the EU?** Mark the package as a return (returned goods) to avoid extra customs costs. Any customs costs for the return are paid by you.

## Refunds

We refund everything you paid for the cancelled items, **including the original standard shipping cost**, within **14 days** after you told us you're cancelling. If you chose a more expensive shipping method than our standard one, we only refund the cost of standard shipping. We may wait with the refund until we have received the product back, or until you show us it has been sent, whichever comes first. The refund goes to the payment method you used, at no extra cost for you.

Import duties and taxes charged by your country when your order arrived are collected by that country's customs, not by us, so we can't refund them. Your local customs office or carrier may be able to tell you whether you can reclaim them.

## Damaged, misprinted or faulty items

Did your order arrive damaged, misprinted or faulty? Let us know as soon as possible, **preferably within 30 days of delivery**, with a photo. We'll send a free replacement or give you a full refund, and you don't need to send the item back. A replacement is made and shipped like a new order: see the production and delivery times in our [shipping policy](/shipping-policy).

This doesn't limit your **legal guarantee**. Under the law, the products you buy must be as described and fit for normal use, and in the EU you are protected for at least two years after delivery. If you discover a defect later, please tell us within two months of discovering it.

## Exceptions

You can't cancel items that were made to your own specifications or clearly personalised for you (for example with your own name or text), unless they're faulty. Our standard designs, printed on demand, are **not** an exception: you can cancel them within 14 days.

## Model cancellation form

You can copy this form into an email to **info@truthpitch.com**. Using it is optional.

> To: TruthPitch, info@truthpitch.com (our address is in our legal notice)
> I hereby give notice that I cancel my contract of sale of the following goods:
> Order number:
> Ordered on / received on:
> Name:
> Address:
> Date:

Our full company details are in our [legal notice](/legal-notice).

## Questions?

We're happy to help. Contact us at **info@truthpitch.com** or through our [contact page](/contact).`;

type LegalFields = {
  legalCompanyName: string;
  legalAddress: string;
  legalEmail: string;
  legalPhone: string;
  legalKvk: string;
  legalVat: string;
  refundPolicyText: string;
};

export const refundPolicy = (s: Pick<LegalFields, "refundPolicyText">) => s.refundPolicyText.trim() || DEFAULT_REFUND_POLICY;

/** Fields Shopify (and Dutch law) expect in a legal notice that are still empty. */
export function missingLegalFields(s: LegalFields): string[] {
  const missing: string[] = [];
  if (!s.legalCompanyName.trim()) missing.push("company name");
  if (!s.legalAddress.trim()) missing.push("address");
  if (!s.legalEmail.trim()) missing.push("email address");
  if (!s.legalKvk.trim()) missing.push("KvK number");
  return missing;
}
