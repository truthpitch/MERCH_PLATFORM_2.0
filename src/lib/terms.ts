// The standard terms of service for truthpitch.com, used until the admin writes their own
// (admin → Legal). Same formatting as blog posts. Written for a Dutch online shop selling
// to consumers in the EU: nothing here limits consumers' mandatory legal rights.

export const DEFAULT_TERMS = `**Last updated: 23 November 2026**

These terms of service ("Terms") apply to every visit to truthpitch.com and every order placed in our online shop. Please read them before you order. By placing an order, you agree to these Terms.

## 1. Who we are

This online shop is run by TruthPitch. Our company details, including our address, Chamber of Commerce (KvK) number and VAT number, are in our [legal notice](/legal-notice). You can reach us at **info@truthpitch.com** or through our [contact page](/contact).

## 2. Our products

- Every product is **printed on demand**: it's made for you after you order it.
- We describe and show our products as accurately as possible. Colours on your screen and in mockup images can differ slightly from the real product, and small differences in print placement are normal for printed items.
- Measurements are in the size guide on each product page. Small variations (up to about 5 cm) are possible.

## 3. Prices

- Prices are shown in **euros** and **include VAT** where it applies, unless stated otherwise.
- **Shipping costs** are not included in the product price. They are shown at checkout before you pay.
- Obvious mistakes in prices, for example a clearly wrong price because of a typing error, don't bind us. If that happens, we'll contact you and you can choose to cancel the order.
- Orders shipped outside the European Union may be subject to import duties and taxes. See our [shipping policy](/shipping-policy).

## 4. Ordering and your contract with us

- You can order as a guest or with an account.
- Your order is a binding offer to buy. The contract between you and us starts when you receive our **order confirmation by email**.
- We may refuse or cancel an order in exceptional cases, for example if a product can't be made, in case of suspected fraud, or because of an obvious pricing error. If you have already paid, you get a full refund.

## 5. Payment

Payment is handled securely by **Shopify** at checkout. The available payment methods are shown there. Your order goes into production once your payment is confirmed.

## 6. Delivery

How production, shipping, delivery times and tracking work is described in our [shipping policy](/shipping-policy). Delivery times are estimates. If your order is very late, please [contact us](/contact). The risk of loss or damage passes to you once the package has been delivered to you.

## 7. Your right to cancel (14 days)

As a consumer, you have the right to cancel your purchase **within 14 days** after you received it, without giving a reason. How this works, and the exceptions for items personalised for you, are explained in our [refund policy](/refund-policy).

## 8. Warranty and complaints

- You have the **legal guarantee** that the products you buy are as described and fit for normal use. Your statutory rights as a consumer always apply.
- Is a product damaged, misprinted or faulty? Contact us within **30 days** of delivery with a photo, and we'll send a free replacement or give you a refund.
- Other complaints? Please [contact us](/contact) with a clear description. We aim to respond within 14 days.

## 9. Your account

- You can create an account to save favorites, check out faster and write reviews. The information you give must be correct.
- Keep your password safe and don't share it. You are responsible for what happens with your account.
- You can delete your account at any time under **My account**.
- We may suspend or delete an account in case of misuse, for example fraud or posting unlawful content.

## 10. Reviews

- Signed-in customers can write reviews. Reviews must be honest and about the product, and may not contain offensive, discriminating or unlawful content, advertising or personal details of others.
- We check every review before it's published. We may refuse or remove reviews that don't follow these rules, but we don't remove reviews just because they're negative.
- By posting a review, you allow us to show it on our website.

## 11. Intellectual property

All designs, texts, images, logos and other content on truthpitch.com belong to TruthPitch or its licensors. Buying a product gives you the product, not the right to copy or sell the design. You may not use our content for commercial purposes without our written permission.

## 12. Liability

- We do our best to keep our website and information correct and available, but we can't guarantee it's always free of errors or interruptions.
- Our liability is limited to the amount you paid for the order concerned, except in case of intent or gross negligence on our side, and except where the law doesn't allow a limitation.
- Nothing in these Terms limits the rights you have as a consumer under mandatory law.

## 13. Force majeure

We are not responsible for delays or failures caused by circumstances beyond our control, such as strikes, natural disasters, problems at carriers or suppliers, or internet outages. We'll let you know as soon as possible and, if the delay is long, you may cancel your order for a full refund.

## 14. Privacy

We handle your personal information carefully. How we do that is explained in our [privacy policy](/privacy-policy).

## 15. Disputes and applicable law

- These Terms and every contract with us are governed by **Dutch law**. If you live in another EU country, you keep the protection of the mandatory consumer law of that country.
- Have a complaint? Please contact us first, so we can find a solution together. If we can't, you can take the dispute to the competent court.

## 16. Changes to these Terms

We may change these Terms from time to time. The version shown on our website when you place your order applies to that order. The date at the top shows when the Terms were last updated.

## 17. Contact

Questions about these Terms? Email **info@truthpitch.com** or use our [contact page](/contact).`;

export const termsOfService = (s: { termsText: string }) => s.termsText.trim() || DEFAULT_TERMS;
