// The standard "How it works" page for truthpitch.com, used until the admin writes their own
// (admin → Legal). Explains the shop's processes from browsing to delivery in plain words.
// Same formatting as blog posts. Keep it in line with the policies and what the code does.

export const DEFAULT_HOW_IT_WORKS = `Every TruthPitch item is **made just for you**. Here's how everything works, from picking a design to wearing it.

## 1. Find your design

Browse **All Products** or pick a category in the menu. On phones, tap **Category** to filter. You can sort by price or newest, and search for any word in the search bar.

On a product page you choose your **color and size**. Not sure about your size? Open the **size guide** on the product page: it shows the exact measurements per size. Tap the heart to save a product to your **favorites** for later.

## 2. Order and pay

Put the item in your cart and click **Checkout**. Our secure checkout is run by **Shopify**, one of the largest shop platforms in the world. You can pay with the methods shown at checkout, such as credit and debit cards, Apple Pay, Google Pay, Klarna and, where available, iDEAL | Wero. **We never see your card details.**

Right after paying, you receive an **order confirmation** by email. Prices include VAT; shipping costs are shown at checkout before you pay.

## 3. We make it for you

We don't keep stock. Your order goes straight to our production partner **Printful**, who prints your item on demand. That means less waste and no unsold piles of clothes.

Production usually takes **2 to 5 business days**. Some products, like knitwear, shoes and some all-over prints, take a little longer. Read more in our [shipping policy](/shipping-policy).

## 4. Shipping and tracking

**We ship worldwide.** As soon as your order leaves the production facility, you receive an email with a **tracking link**, so you can follow your package until it's at your door. Outside the EU, customs duties or import taxes may apply.

Did you make a mistake in your address? [Contact us](/contact) as soon as possible: we can usually still change it until production has started.

## 5. Returns and problems

Changed your mind? Within the EU you can **cancel within 14 days** after you receive your order, without giving a reason. **Contact us first**, so we can give you the return address.

Damaged, misprinted or faulty? Send us a photo, preferably within 30 days, and we'll send a free replacement or give you a refund. You don't have to send it back. See our [refund policy](/refund-policy) for all the details.

## Your account

An account is optional: you can also check out as a guest. With an account you keep your **favorites** on every device and can **write reviews**.

1. Create an account with your name, email address and a password.
2. We send you an **activation link** by email, once. Click it to activate your account (the link works for 48 hours).
3. Sign in and you're ready. Forgot your password? Use **Forgot password** on the sign-in page.

You can delete your account yourself at any time under **My account**.

## Reviews

Bought something? Tell others what you think. Sign in, go to the product page and give it **1 to 5 stars** and a short review. Every review is **checked by us before it appears** on the website, to keep out spam and abuse. If you edit your review later, it's checked again. Your review is shown with your first name and the first letter of your last name.

## Cookies and privacy

When you first visit, we ask whether you accept **analytics cookies**. Reject or Accept: the shop works the same either way. If you accept, we keep anonymous statistics on our own server, like which pages are popular, to improve the shop. We never store your IP address with them and never share them with advertisers. Change your choice any time with **Cookie settings** at the bottom of every page.

Read our [cookie policy](/cookie-policy) and [privacy policy](/privacy-policy) for all the details.

## Questions?

We're happy to help. Email **info@truthpitch.com** or use our [contact page](/contact). The rules for ordering are in our [terms of service](/terms-of-service).`;

export const howItWorks = (s: { howItWorksText: string }) => s.howItWorksText.trim() || DEFAULT_HOW_IT_WORKS;
