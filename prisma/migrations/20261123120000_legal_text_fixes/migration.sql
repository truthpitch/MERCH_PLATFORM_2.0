-- Legal check (23 November 2026): texts that still said "no returns for a wrong size" or treated
-- "within 30 days" as a hard limit conflict with the 14-day right to cancel and the legal guarantee.
-- Each UPDATE only matches the exact old text, so texts edited in the admin are left alone.

UPDATE "SiteSettings" SET "shippingReturnsText" = 'Every item is printed on demand, just for you, and shipped worldwide. Production takes 2–5 business days for most items (longer for some specialty products), after which your order ships with a tracking link. You''ll see the shipping options, costs and delivery time at checkout.

Changed your mind? You can cancel within 14 days after receiving your order, without giving a reason. See our refund policy for how it works.

Did your order arrive damaged, misprinted or faulty? Let us know as soon as possible, preferably within 30 days of delivery, with a photo, and we''ll send a free replacement or give you a refund.'
WHERE "shippingReturnsText" = 'Every item is printed on demand, just for you. Production usually takes 2–5 business days, after which your order ships with a tracking link. Delivery time depends on where you live; you''ll see the shipping options and costs at checkout.

Because each item is made to order, we can''t take returns for a wrong size or a change of mind, so please check the size guide before ordering.

Did your order arrive damaged, misprinted or faulty? Contact us within 30 days of delivery with a photo, and we''ll send a free replacement or give you a refund.';

UPDATE "BlogPost" SET "content" = 'Every TruthPitch item is **printed on demand**: we don''t keep a warehouse full of stock. Your item is made just for you, right after you order it.

## From your order to your door

1. **You order** in our shop and pay with Shopify''s secure checkout.
2. **Your item is printed** by our production partner Printful, usually within 2 to 5 business days. Specialty products such as knitwear take longer: see our [shipping policy](/shipping-policy).
3. **It''s checked and packed**, then handed to a carrier.
4. **You get a tracking link** by email, so you can follow your package.

We ship worldwide. Delivery time after shipping depends on where you live. You''ll see the shipping options and costs at checkout.

## Why we chose print on demand

- **Less waste.** Nothing is made that nobody wants. No piles of unsold clothes.
- **More choice.** We can offer every size and colour without guessing how many to stock.
- **Quality control.** Every item is printed fresh and checked before it ships.

> Made when you order it, so nothing goes to waste.

## Something wrong with your order?

If your item arrives damaged, misprinted or faulty, [contact us](/contact) as soon as possible, preferably within 30 days of delivery, with a photo and we''ll make it right.', "updatedAt" = CURRENT_TIMESTAMP
WHERE "slug" = 'how-print-on-demand-works' AND "content" = 'Every TruthPitch item is **printed on demand**: we don''t keep a warehouse full of stock. Your item is made just for you, right after you order it.

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

If your item arrives damaged, misprinted or faulty, [contact us](/contact) within 30 days of delivery with a photo and we''ll make it right.';

UPDATE "BlogPost" SET "content" = 'Ordered the wrong size? You can cancel within 14 days (see our [refund policy](/refund-policy)), but sending it back costs you time and postage. A minute with a measuring tape saves a lot of hassle, so here''s how to get it right.

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

Go for the larger size if you like a relaxed fit, the smaller one for a closer fit. Still not sure? [Ask us](/contact): we''re happy to help.', "updatedAt" = CURRENT_TIMESTAMP
WHERE "slug" = 'how-to-find-your-size' AND "content" = 'Because every item is made to order, we can''t take returns for a wrong size. A minute with a measuring tape saves a lot of disappointment, so here''s how to get it right.

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

Go for the larger size if you like a relaxed fit, the smaller one for a closer fit. Still not sure? [Ask us](/contact): we''re happy to help.';

UPDATE "BlogPost" SET "content" = 'All the practical answers in one place.

## Shipping

Every item is printed on demand and **we ship worldwide**. Production usually takes **2 to 5 business days** for most items (specialty products such as knitwear take longer), then your order ships with a **tracking link** by email. Delivery time depends on your country: you''ll see the options and costs at checkout. Read more in [how print on demand works](/blog/how-print-on-demand-works).

## Returns and exchanges

Changed your mind or ordered the wrong size? You can **cancel within 14 days** after receiving your order, without giving a reason. Read how it works in our [refund policy](/refund-policy). To avoid the hassle, check the [size guide](/blog/how-to-find-your-size) before ordering.

Did your order arrive **damaged, misprinted or faulty**? [Contact us](/contact) as soon as possible, preferably within 30 days of delivery, with a photo, and we''ll send a free replacement or give you a refund.

## Payment

Checkout runs on **Shopify**, so your payment details are handled securely and never stored by us. You can pay by card (such as Visa and Mastercard) and with other methods like Klarna, depending on your country. Available options are shown at checkout.

## Do I need an account?

No. You can **check out as a guest**. With a free account you can:

- save your favourite products on every device
- check out faster, with your email filled in
- write reviews of products you''ve bought

[Create an account](/account/register) in under a minute.

## Still have a question?

We''re happy to help on our [contact page](/contact).', "updatedAt" = CURRENT_TIMESTAMP
WHERE "slug" = 'shipping-returns-and-payment' AND "content" = 'All the practical answers in one place.

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

We''re happy to help on our [contact page](/contact).';
