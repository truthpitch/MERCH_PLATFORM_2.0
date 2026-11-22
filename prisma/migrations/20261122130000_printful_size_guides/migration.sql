-- Size guides from Printful's official catalog data (api.printful.com/products/{id}/sizes):
--   T-shirts: Unisex Organic Cotton Creator 2.0 T-Shirt, Stanley/Stella STTU169 (catalog 456)
--   Tote bags: Eco Tote Bag, Econscious EC8000 (catalog 367)
-- Only fills a category that has no size guide yet, so edits made in the admin are kept.

INSERT OR IGNORE INTO "SizeGuide" ("category", "content", "updatedAt") VALUES ('t-shirts',
'Size | Fits chest cm (in) | Width cm (in) | Length cm (in) | Sleeve cm (in)
XS | 69–76 (27–30) | 47.5 (18.7) | 65 (25.6) | 21 (8.3)
S | 79–86 (31–34) | 49.5 (19.5) | 69 (27.2) | 22.5 (8.9)
M | 89–97 (35–38) | 53.5 (21.1) | 73 (28.7) | 24 (9.5)
L | 99–104 (39–41) | 56.5 (22.2) | 75 (29.5) | 24.5 (9.7)
XL | 107–114 (42–45) | 59.5 (23.4) | 77 (30.3) | 25 (9.8)
2XL | 117–122 (46–48) | 63.5 (25.0) | 79 (31.1) | 25.5 (10.0)
3XL | 124–130 (49–51) | 67.5 (26.6) | 81 (31.9) | 26 (10.2)
4XL | 132–137 (52–54) | 72.5 (28.5) | 83 (32.7) | 26 (10.2)
5XL | 140–145 (55–57) | 77.5 (30.5) | 84 (33.1) | 26 (10.2)
Fits chest is your body: measure around the fullest part of your chest. Width, length and sleeve are the shirt laid flat (width from armpit to armpit, length from the highest point of the shoulder to the hem).
European sizing: if you usually wear US sizes, order one size up.
Measurements can vary by up to 5 cm (2 in).', CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO "SizeGuide" ("category", "content", "updatedAt") VALUES ('tote-bags-backpacks',
'Measurement | cm | in
Width | 40.6 | 16
Height | 36.8 | 14.5
Depth (gusset) | 12.7 | 5
Handle length | 62.2 | 24.5
Handle width | 2.5 | 1
One size. Holds up to 13.6 kg (30 lb).', CURRENT_TIMESTAMP);
