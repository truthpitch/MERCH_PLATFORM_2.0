-- Replace the old placeholder about text with the longer About page text, unless it was edited.
UPDATE "SiteSettings"
SET "aboutText" = 'There is a lot of noise out there: spin, hype and sales talk. In all of that, the truth often gets lost. TruthPitch is a pitch for the truth: clear words, honest ideas and the courage to say them out loud.

This shop is one way to carry that idea into everyday life. Each piece is a small, visible statement and a conversation starter for the things worth saying.

Every item is printed on demand when you order it, which means less waste and no warehouses full of unsold stock.'
WHERE "aboutText" = 'TruthPitch is about saying what matters, plainly. This shop carries a small, considered range of pieces that carry that idea with them.

Every item is printed on demand when you order it, which means less waste and no warehouses full of unsold stock.';
