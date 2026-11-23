// The standard shipping policy for truthpitch.com, used until the admin writes their own
// (admin → Legal). Same formatting as blog posts. Countries, costs and delivery estimates
// come from Shopify's checkout, so this text points there instead of naming fixed prices.

export const DEFAULT_SHIPPING_POLICY = `**Last updated: 23 November 2026**

Every TruthPitch item is **printed on demand**: it's made just for you after you order it, by our production partner Printful. **We ship worldwide.** This page explains how production, shipping and delivery work.

## Production time

Production (also called fulfillment) takes **2 to 5 business days for most items**, counted from the next business day after you order. Some products take longer:

- **Shoes and some all-over prints:** usually 3 to 7 business days.
- **Knitwear** (such as knitted sweaters): usually 7 to 12 business days, and 9 to 16 business days in November and December.
- **Items made at partner facilities** can also take a little longer.

Busy periods, such as the weeks before the holidays, can add extra time. Production doesn't happen on weekends and public holidays. These are estimates: for the current times per product type, see Printful's [production times](https://help.printful.com/hc/en-us/articles/50265287600913-How-long-does-fulfillment-take).

## Where we ship to

**We ship worldwide.** You can choose your country at checkout. Delivery times and costs depend on your destination.

## Shipping costs and delivery time

Shipping costs and the estimated delivery time are shown at **checkout**, before you pay. They depend on your country, the shipping method you choose and what's in your order. Delivery time is counted from the moment your order ships, so it comes **on top of** the production time above.

**Total time until your order arrives = production time + shipping time.**

## Tracking your order

As soon as your order ships, you get an email with a **tracking link** so you can follow your package.

## Orders in more than one package

Our products are made at different production facilities around the world, often one close to you. If you order several items, they may arrive **in separate packages** and on different days. You don't pay extra for this.

## Customs and import duties

Because we ship worldwide, some orders cross a customs border. Orders shipped to a country outside the European Union, such as the United Kingdom, Switzerland, Norway, the United States or Australia, may be charged **import duties, taxes or customs fees** by that country. These costs are not included in our prices, unless the checkout clearly shows them as included, and are paid by the recipient.

## Check your address

Please check your shipping address carefully before you pay. Need to change something? [Contact us](/contact) as soon as possible: we can usually still change it until production has started.

If a package is returned to us because of an incorrect or incomplete address, or because it wasn't picked up, we can send it again, but the new shipping costs will be charged.

## Late, lost or damaged packages

- **Taking longer than expected?** Check the tracking link first. Still no package well after the estimated delivery date? [Contact us](/contact) and we'll look into it with the carrier. If we can't deliver within 30 days of your order, you may cancel and get a full refund.
- **Lost in transit?** Until your package is delivered, it's our responsibility. If it's lost on the way, we'll send a free replacement or give you a full refund. We may first check with the carrier.
- **Damaged, misprinted or faulty?** Let us know as soon as possible, preferably within **30 days** of delivery, with a photo, and we'll send a free replacement or give you a refund. This doesn't limit your legal guarantee. See our [refund policy](/refund-policy).

## Questions?

We're happy to help. Contact us at **info@truthpitch.com** or through our [contact page](/contact).`;

export const shippingPolicy = (s: { shippingPolicyText: string }) => s.shippingPolicyText.trim() || DEFAULT_SHIPPING_POLICY;
