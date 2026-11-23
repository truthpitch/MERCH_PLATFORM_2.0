// Legal notice (Impressum) and refund policy, edited in admin → Legal.
// Shopify requires a published legal notice and a clear refund policy for iDEAL | Wero.

/**
 * Used when the admin hasn't written their own policy. It follows the EU rules for
 * online shops (14-day right of withdrawal). Same formatting as blog posts (## headings, - lists).
 */
export const DEFAULT_REFUND_POLICY = `We want you to be happy with your order. This policy explains how cancelling, returning and refunds work.

## Your right to cancel (14 days)

You can cancel your purchase without giving a reason within **14 days** after you, or someone you named, received the product. To cancel, let us know before those 14 days are over by email or through our [contact page](/contact). Then send the product back within 14 days after telling us. We ship worldwide, and this right applies to customers in every country.

**Changed your mind right after ordering?** Contact us as soon as possible. Every item is made to order, usually within 2 to 5 business days. If production hasn't started yet, we can cancel your order at no cost.

## Returning a product

- **Contact us first**, so we can give you the return address.
- Products must be unused, unwashed and in their original condition. You may try an item on, as you would in a shop.
- You pay the cost of sending the product back, unless it's faulty or we sent the wrong item.
- **Returning from outside the EU?** Mark the package as a return to avoid extra customs costs. Any customs costs for the return are paid by you.

## Refunds

We refund the purchase price, including the original standard shipping cost, within **14 days** after you cancel. We may wait until we have received the product back, or until you show us it has been sent. The refund goes to the payment method you used.

Import duties and taxes charged by your country when your order arrived are collected by that country's customs, not by us, so we can't refund them. Your local customs office or carrier may be able to tell you whether you can reclaim them.

## Damaged, misprinted or faulty items

Did your order arrive damaged, misprinted or faulty? Contact us within **30 days** of delivery with a photo, and we'll send a free replacement or give you a full refund. You don't need to send the item back. A replacement is made and shipped like a new order: see the production and delivery times in our [shipping policy](/shipping-policy).

## Exceptions

Items made to your own specifications or clearly personalised for you (for example with your own name or text) can't be cancelled, unless they're faulty.

## Questions?

We're happy to help. Contact us through our [contact page](/contact).`;

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
