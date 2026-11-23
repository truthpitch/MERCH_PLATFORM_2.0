// The standard shipping policy for truthpitch.com, used until the admin writes their own
// (admin → Legal). Same formatting as blog posts. Countries, costs and delivery estimates
// come from Shopify's checkout, so this text points there instead of naming fixed prices.

export const DEFAULT_SHIPPING_POLICY = `**Last updated: 23 November 2026**

Every TruthPitch item is **printed on demand**: it's made just for you after you order it, by our production partner Printful. This page explains how production, shipping and delivery work.

## Production time

Production usually takes **2 to 5 business days** after your order is placed. Some products, and busy periods such as the weeks before the holidays, can take a little longer. We don't produce or ship on weekends and public holidays.

## Where we ship to

We ship to the countries you can select at checkout. If your country isn't listed, please [contact us](/contact) and we'll see what's possible.

## Shipping costs and delivery time

Shipping costs and the estimated delivery time are shown at **checkout**, before you pay. They depend on your address, the shipping method you choose and what's in your order. Delivery time is counted from the moment your order ships, so on top of the production time above.

## Tracking your order

As soon as your order ships, you get an email with a **tracking link** so you can follow your package.

## Orders in more than one package

Our products are made at different production facilities. If you order several items, they may arrive **in separate packages** and on different days. You don't pay extra for this.

## Customs and import duties

Orders shipped to a country outside the European Union, such as the United Kingdom, Switzerland, Norway or the United States, may be charged **import duties, taxes or customs fees** by that country. These costs are not included in our prices, unless the checkout clearly shows them as included, and are paid by the recipient.

## Check your address

Please check your shipping address carefully before you pay. Need to change something? [Contact us](/contact) as soon as possible: we can usually still change it until production has started.

If a package is returned to us because of an incorrect or incomplete address, or because it wasn't picked up, we can send it again, but the new shipping costs will be charged.

## Late, lost or damaged packages

- **Taking longer than expected?** Check the tracking link first. Still no package well after the estimated delivery date? [Contact us](/contact) and we'll look into it with the carrier.
- **Lost in transit?** If the carrier confirms your package is lost, we'll send a free replacement or give you a full refund.
- **Damaged, misprinted or faulty?** Contact us within **30 days** of delivery with a photo, and we'll send a free replacement or give you a refund. See our [refund policy](/refund-policy).

## Questions?

We're happy to help. Contact us at **info@truthpitch.com** or through our [contact page](/contact).`;

export const shippingPolicy = (s: { shippingPolicyText: string }) => s.shippingPolicyText.trim() || DEFAULT_SHIPPING_POLICY;
