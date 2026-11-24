// The standard cookie policy for truthpitch.com, used until the admin writes their own
// (admin → Legal). Same formatting as blog posts. Keep it in line with what the code really
// sets: components/CookieBanner, components/AnalyticsTracker and the privacy policy.

export const DEFAULT_COOKIE_POLICY = `**Last updated: 24 November 2026**

Cookies are small text files that a website saves in your browser. Local storage and session storage work in a similar way. This page explains which ones truthpitch.com uses, why, and how you can change your choice.

## Your choice

When you first visit truthpitch.com, we ask whether you accept analytics cookies. **Reject** and **Accept** are equally easy, and the shop works exactly the same either way. Nothing is measured until you click Accept.

You can change your choice at any time with **Cookie settings** at the bottom of every page. If you change Accept into Reject, the analytics cookies are removed from your browser straight away.

## Necessary cookies (always on)

These are needed for the website to work or remember choices you made yourself. They don't need your consent.

- **tp_cart:** remembers your shopping cart (30 days).
- **tp_customer:** keeps you signed in to your account (up to 30 days).
- **tp_favorites:** remembers your favorites while you're not signed in.
- **tp_bar_closed:** remembers that you closed the offer bar.
- **tp_consent:** remembers whether you accepted or rejected analytics (1 year).
- **Light or dark mode and language:** saved on your own device, in local storage.

## Analytics (only after you click Accept)

We use our own, privacy-friendly statistics, stored on our own server. **No data goes to Google Analytics, advertisers or other companies.**

- **tp_vid** (local storage): a random visitor number, so we can tell new visitors from returning ones. It stays until you clear your browser data or click Reject.
- **tp_sid** (session storage): a random visit number. It's deleted when you close the browser tab.

With these we learn which pages are viewed and for how long, how visitors find us (for example a search engine, social media or a campaign link), the rough location (country, or the time zone of the device), the browser language, and the type of device, browser and operating system. **We never store your IP address, name or email address with these statistics.** They are deleted automatically after 13 months.

We use this only to improve the shop: to see which products and blog posts people like, and which pages need work.

## Cookies from others

- **Google Translate:** if you choose a language other than English, the page is translated by Google, which may set its own cookies.
- **Shopify checkout:** when you go to checkout, Shopify's pages may set their own cookies for payment and fraud prevention. See [Shopify's privacy policy](https://www.shopify.com/legal/privacy/app-users).

## Deleting cookies

You can delete cookies at any time in your browser settings. Some parts of the shop, like the cart and your account, won't work without the necessary cookies.

## More information

Read our [privacy policy](/privacy-policy) for how we handle personal information and what your rights are. Questions? Email **info@truthpitch.com** or use our [contact page](/contact).`;

export const cookiePolicy = (s: { cookiePolicyText: string }) => s.cookiePolicyText.trim() || DEFAULT_COOKIE_POLICY;
