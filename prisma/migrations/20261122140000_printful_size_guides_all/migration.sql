-- Size guides for the remaining shop categories, from Printful's official catalog data
-- (api.printful.com/products/{id}/sizes and /products/{id}). One representative Printful
-- product per category:
--   hoodies-sweatshirts  Unisex Essential Organic Cruiser 2.0 Hoodie, Stanley/Stella SASU003 (834)
--   beanies              Rib Knit Beanie 2.0, Stanley/Stella STAU295 (1709)
--   hats-caps            Organic Baseball Cap, Econscious EC7000 (491)
--   socks                Sublimation Socks (882)
--   stickers-decals      Kiss-Cut Stickers (358)
--   posters-prints       Enhanced Matte Paper Poster (268)
--   mugs-drinkware       White Glossy Mug (19)
--   phone-cases          Clear Case for iPhone (181)
--   pins-patches         Set of Pin Buttons (660) and Embroidered Patches (516)
-- Only fills a category that has no size guide yet, so edits made in the admin are kept.

INSERT OR IGNORE INTO "SizeGuide" ("category", "content", "updatedAt") VALUES ('hoodies-sweatshirts',
'Size | Fits chest cm (in) | Width cm (in) | Length cm (in) | Sleeve cm (in)
S | 84–91 (33–36) | 55 (21.7) | 71 (28.0) | 64.5 (25.4)
M | 94–101 (37–40) | 59 (23.2) | 73 (28.7) | 65.5 (25.8)
L | 104–109 (41–43) | 63 (24.8) | 75 (29.5) | 66.5 (26.2)
XL | 111–116 (44–46) | 68 (26.8) | 78 (30.7) | 67.5 (26.6)
2XL | 119–124 (47–49) | 73 (28.7) | 80.5 (31.7) | 68 (26.8)
3XL | 127–135 (50–53) | 78 (30.7) | 83 (32.7) | 68.5 (27.0)
4XL | 137–145 (54–57) | 83 (32.7) | 84 (33.1) | 69 (27.2)
5XL | 147–155 (58–61) | 88 (34.6) | 87 (34.3) | 69.5 (27.4)
Fits chest is your body: measure around the fullest part of your chest. Width, length and sleeve are the hoodie laid flat (width from armpit to armpit, length from the highest point of the shoulder to the hem).
Measurements can vary by up to 5 cm (2 in).', CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO "SizeGuide" ("category", "content", "updatedAt") VALUES ('beanies',
'One size, fits most adults.
Soft, stretchy 1x1 rib knit with a double-folded brim for a snug fit.', CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO "SizeGuide" ("category", "content", "updatedAt") VALUES ('hats-caps',
'Measurement | cm | in
Fits head circumference | 52–60 | 20.5–23.6
Crown height | 11 | 4.3
Visor length | 7 | 2.8
Visor width | 18 | 7.1
One size, with an adjustable strap and brass slider at the back.
To find your size, measure around your head about 2.5 cm (1 in) above your ears.', CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO "SizeGuide" ("category", "content", "updatedAt") VALUES ('socks',
'Size | EU shoe size (approx.) | US men | US women | Length cm (in)
S | 36–39 | 5–6.5 | 6–8 | 33 (13.0)
M | 39–43 | 7–9.5 | 8.5–11 | 39 (15.4)
L | 43–47 | 10–13 | 11.5–13 | 41 (16.1)
Crew length. EU sizes are an approximate conversion of the US sizes.', CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO "SizeGuide" ("category", "content", "updatedAt") VALUES ('stickers-decals',
'Size | cm | in
Small | 7.6 × 7.6 | 3 × 3
Medium | 10.2 × 10.2 | 4 × 4
Large | 14 × 14 | 5.5 × 5.5
Wide | 38.1 × 9.5 | 15 × 3.75
Kiss-cut: the sticker is cut to the shape of the design, on a backing of this size.
Clean the surface before applying.', CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO "SizeGuide" ("category", "content", "updatedAt") VALUES ('posters-prints',
'Size | cm | in
A4 | 21 × 30 | 8.3 × 11.8
Small | 30 × 40 | 11.8 × 15.7
A2 | 42 × 59.4 | 16.5 × 23.4
Medium | 50 × 70 | 19.7 × 27.6
A1 | 59.4 × 84.1 | 23.4 × 33.1
Large | 61 × 91 | 24 × 35.8
Extra large | 70 × 100 | 27.6 × 39.4
Thick museum-quality matte paper (189 g/m²). Frame not included unless stated.', CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO "SizeGuide" ("category", "content", "updatedAt") VALUES ('mugs-drinkware',
'Size | Holds | Height cm (in) | Diameter cm (in)
11 oz | 325 ml | 9.6 (3.8) | 8.2 (3.2)
15 oz | 445 ml | 11.9 (4.7) | 8.5 (3.3)
20 oz | 590 ml | 10.9 (4.3) | 9.3 (3.7)
Ceramic, dishwasher and microwave safe.', CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO "SizeGuide" ("category", "content", "updatedAt") VALUES ('phone-cases',
'Choose your exact phone model when you order: each case is made to fit that model only.
Available for iPhone 7/8, SE (2020), X/XS, XR and the iPhone 11 to 18 series (mini, Plus, Pro, Pro Max and Air where they exist).
Precisely aligned openings for buttons, ports and camera. Works with wireless charging.', CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO "SizeGuide" ("category", "content", "updatedAt") VALUES ('pins-patches',
'Item | cm | in
Pin button, small | ⌀ 3.2 | ⌀ 1.25
Pin button, large | ⌀ 5.7 | ⌀ 2.25
Patch, circle | ⌀ 7.6 | ⌀ 3
Patch, square | 7.6 × 7.6 | 3 × 3
Patch, heart | 7.9 × 7.1 | 3.1 × 2.8
Patch, rectangle | 8.9 × 5.7 | 3.5 × 2.25
Patch, oval | 10.2 × 6.6 | 4 × 2.6
Pin buttons come in a set of 5. Patches can be ironed on, sewn on or attached with a safety pin.', CURRENT_TIMESTAMP);
