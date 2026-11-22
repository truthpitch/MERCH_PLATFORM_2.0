-- Starter blog posts, saved as DRAFTS: review them in admin → Blog, then tick Published.
-- Only added when a post with the same address doesn't exist yet.
INSERT OR IGNORE INTO "BlogPost" ("slug", "title", "excerpt", "content", "tags", "metaDescription", "author", "published", "createdAt", "updatedAt")
VALUES ('welcome-to-truthpitch', 'Welcome to TruthPitch: merch with a message', 'What TruthPitch is, why we started it and what you can expect from our shop.', 'There is a lot of noise out there: spin, hype and sales talk. In all of that, the truth often gets lost. **TruthPitch is a pitch for the truth**: clear words, honest ideas and the courage to say them out loud.

## Why we started

We wanted clothing and everyday items that say something without shouting. A small word on a chest, a clear line on a mug: pieces that start a conversation about the things worth saying.

## What you''ll find in the shop

- **T-shirts and hoodies** in soft, organic cotton
- **Accessories** like tote bags, caps and mugs
- A clean look in black, white and grey, so the message does the talking

Browse everything in the [shop](/products).

## Made to order, not mass-produced

Every item is printed when you order it. That means less waste and no warehouses full of unsold stock. Read more in [how print on demand works](/blog/how-print-on-demand-works).

## Stay in touch

Questions, ideas or feedback? We''d love to hear from you on our [contact page](/contact).', 'about us, news', 'Meet TruthPitch: clean, honest merch with a message, printed on demand. Read why we started and what we stand for.', 'TruthPitch', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO "BlogPost" ("slug", "title", "excerpt", "content", "tags", "metaDescription", "author", "published", "createdAt", "updatedAt")
VALUES ('how-print-on-demand-works', 'How print on demand works (and why we chose it)', 'From your order to your door: what happens after you click Checkout, how long it takes and why it''s better for the planet.', 'Every TruthPitch item is **printed on demand**: we don''t keep a warehouse full of stock. Your item is made just for you, right after you order it.

## From your order to your door

1. **You order** in our shop and pay with Shopify''s secure checkout.
2. **Your item is printed**, usually within 2 to 5 business days, by our production partner Printful.
3. **It''s checked and packed**, then handed to a carrier.
4. **You get a tracking link** by email, so you can follow your package.

Delivery time after shipping depends on where you live. You''ll see the shipping options and costs at checkout.

## Why we chose print on demand

- **Less waste.** Nothing is made that nobody wants. No piles of unsold clothes.
- **More choice.** We can offer every size and colour without guessing how many to stock.
- **Quality control.** Every item is printed fresh and checked before it ships.

> Made when you order it, so nothing goes to waste.

## Something wrong with your order?

If your item arrives damaged, misprinted or faulty, [contact us](/contact) within 30 days of delivery with a photo and we''ll make it right.', 'sustainability, shipping, how it works', 'What happens after you order from TruthPitch: printing on demand, production time, shipping with tracking and less waste.', 'TruthPitch', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO "BlogPost" ("slug", "title", "excerpt", "content", "tags", "metaDescription", "author", "published", "createdAt", "updatedAt")
VALUES ('how-to-find-your-size', 'How to find your size', 'Measure once, order right: how to use our size guides and what to know about European sizing.', 'Because every item is made to order, we can''t take returns for a wrong size. A minute with a measuring tape saves a lot of disappointment, so here''s how to get it right.

## Where to find the size guide

On every product page with sizes, click **Size guide** next to the size buttons. It opens a table with the exact measurements of that item in centimetres and inches.

## How to measure yourself

- **Chest:** measure around the fullest part of your chest, under your arms. Keep the tape level.
- **Head (for caps):** measure around your head about 2.5 cm (1 inch) above your ears.

Compare your chest measurement with the **Fits chest** column in the size guide.

## Or measure a shirt you love

Lay your favourite tee flat and measure:

- **Width:** from armpit to armpit
- **Length:** from the highest point of the shoulder to the bottom hem

Then pick the size in our guide with the closest **Width** and **Length**.

## European sizing

Our organic tees and hoodies use European sizes. **If you usually wear US sizes, order one size up.**

## Between two sizes?

Go for the larger size if you like a relaxed fit, the smaller one for a closer fit. Still not sure? [Ask us](/contact): we''re happy to help.', 'size guide, how it works', 'Find the right size for TruthPitch tees and hoodies: how to measure yourself, how to read our size guides and EU vs US sizing.', 'TruthPitch', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO "BlogPost" ("slug", "title", "excerpt", "content", "tags", "metaDescription", "author", "published", "createdAt", "updatedAt")
VALUES ('how-to-care-for-your-printed-tee', 'How to care for your printed tee', 'Simple washing tips that keep the print sharp and the cotton soft for years.', 'A good tee should last for years. With a little care, the print stays sharp and the cotton stays soft.

## Washing

- **Turn it inside out** before washing. This protects the print.
- **Wash cold or at 30 °C** with similar colours.
- **Use a mild detergent** and skip the bleach.

## Drying

- **Hang it to dry** for the longest life, or tumble dry on a low setting.
- Avoid high heat: it can shrink cotton and crack the print.

## Ironing

- **Iron inside out** on a low to medium setting.
- **Never iron directly on the print.**

## Quick checklist

1. Inside out
2. Cold wash
3. Hang dry
4. No iron on the print

> Washing cooler and air drying is also better for the planet.

Ready for a new favourite? [Shop T-shirts](/products?category=t-shirts).', 'care guide, sustainability', 'Keep your printed T-shirt looking new: how to wash, dry and iron printed organic cotton tees and hoodies.', 'TruthPitch', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO "BlogPost" ("slug", "title", "excerpt", "content", "tags", "metaDescription", "author", "published", "createdAt", "updatedAt")
VALUES ('shipping-returns-and-payment', 'Shipping, returns and payment: everything you need to know', 'How shipping works, what to do if something''s wrong, how you can pay and whether you need an account.', 'All the practical answers in one place.

## Shipping

Every item is printed on demand. Production usually takes **2 to 5 business days**, then your order ships with a **tracking link** by email. Delivery time depends on your country: you''ll see the options and costs at checkout. Read more in [how print on demand works](/blog/how-print-on-demand-works).

## Returns and exchanges

Because each item is made to order, we **can''t take returns for a wrong size or a change of mind**. Please check the [size guide](/blog/how-to-find-your-size) before ordering.

Did your order arrive **damaged, misprinted or faulty**? [Contact us](/contact) within 30 days of delivery with a photo, and we''ll send a free replacement or give you a refund.

## Payment

Checkout runs on **Shopify**, so your payment details are handled securely and never stored by us. You can pay by card (such as Visa and Mastercard) and with other methods like Klarna, depending on your country. Available options are shown at checkout.

## Do I need an account?

No. You can **check out as a guest**. With a free account you can:

- save your favourite products on every device
- check out faster, with your email filled in
- write reviews of products you''ve bought

[Create an account](/account/register) in under a minute.

## Still have a question?

We''re happy to help on our [contact page](/contact).', 'shipping, payment, how it works', 'TruthPitch shipping times, returns for damaged items, secure payment options and checking out with or without an account.', 'TruthPitch', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
