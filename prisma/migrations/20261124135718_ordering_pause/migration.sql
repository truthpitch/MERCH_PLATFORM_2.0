-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SiteSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "maintenanceMessage" TEXT NOT NULL DEFAULT 'We''re making a few changes behind the scenes. Please check back shortly.',
    "orderingPaused" BOOLEAN NOT NULL DEFAULT false,
    "orderingPauseMessage" TEXT NOT NULL DEFAULT 'Ordering is paused for a short while. You can still browse and save your favorites.',
    "orderingPausedUntil" DATETIME,
    "faviconUrl" TEXT NOT NULL DEFAULT '',
    "shippingReturnsText" TEXT NOT NULL DEFAULT 'Every item is printed on demand, just for you. Production usually takes 2–5 business days, after which your order ships with a tracking link. Delivery time depends on where you live; you''ll see the shipping options and costs at checkout.

Because each item is made to order, we can''t take returns for a wrong size or a change of mind, so please check the size guide before ordering.

Did your order arrive damaged, misprinted or faulty? Contact us within 30 days of delivery with a photo, and we''ll send a free replacement or give you a refund.',
    "legalCompanyName" TEXT NOT NULL DEFAULT 'TruthPitch',
    "legalAddress" TEXT NOT NULL DEFAULT '',
    "legalEmail" TEXT NOT NULL DEFAULT '',
    "legalPhone" TEXT NOT NULL DEFAULT '',
    "legalKvk" TEXT NOT NULL DEFAULT '',
    "legalVat" TEXT NOT NULL DEFAULT '',
    "legalExtra" TEXT NOT NULL DEFAULT '',
    "refundPolicyText" TEXT NOT NULL DEFAULT '',
    "privacyPolicyText" TEXT NOT NULL DEFAULT '',
    "termsText" TEXT NOT NULL DEFAULT '',
    "shippingPolicyText" TEXT NOT NULL DEFAULT '',
    "announcementEnabled" BOOLEAN NOT NULL DEFAULT false,
    "announcementText" TEXT NOT NULL DEFAULT '',
    "announcementTimerLabel" TEXT NOT NULL DEFAULT 'Current offer expires in',
    "announcementEndsAt" DATETIME,
    "announcementCtaLabel" TEXT NOT NULL DEFAULT '',
    "announcementCtaUrl" TEXT NOT NULL DEFAULT '',
    "heroTitle" TEXT NOT NULL DEFAULT 'Merch with a message.',
    "heroSubtitle" TEXT NOT NULL DEFAULT 'Clean, honest essentials from TruthPitch. Printed on demand, made to last.',
    "heroCtaLabel" TEXT NOT NULL DEFAULT 'Shop the collection',
    "heroImageUrl" TEXT NOT NULL DEFAULT '',
    "aboutTitle" TEXT NOT NULL DEFAULT 'About TruthPitch',
    "contactTitle" TEXT NOT NULL DEFAULT 'Contact',
    "contactIntro" TEXT NOT NULL DEFAULT 'Questions about an order, sizing or anything else? Send us a message and we will get back to you as soon as we can.',
    "contactEmail" TEXT NOT NULL DEFAULT '',
    "aboutText" TEXT NOT NULL DEFAULT 'There is a lot of noise out there: spin, hype and sales talk. In all of that, the truth often gets lost. TruthPitch is a pitch for the truth: clear words, honest ideas and the courage to say them out loud.

This shop is one way to carry that idea into everyday life. Each piece is a small, visible statement and a conversation starter for the things worth saying.

Every item is printed on demand when you order it, which means less waste and no warehouses full of unsold stock.',
    "aboutIntro" TEXT NOT NULL DEFAULT 'TruthPitch started with a simple idea: say what matters, plainly, and stand behind it.',
    "aboutImageUrl" TEXT NOT NULL DEFAULT '',
    "aboutValue1Title" TEXT NOT NULL DEFAULT 'Honest',
    "aboutValue1Text" TEXT NOT NULL DEFAULT 'No spin and no slogans for the sake of it. Every design starts with something we actually believe.',
    "aboutValue2Title" TEXT NOT NULL DEFAULT 'Simple',
    "aboutValue2Text" TEXT NOT NULL DEFAULT 'Black, white and grey. Clean typography. Pieces that let the message do the talking.',
    "aboutValue3Title" TEXT NOT NULL DEFAULT 'Made to order',
    "aboutValue3Text" TEXT NOT NULL DEFAULT 'Everything is printed on demand when you order it, so nothing is wasted on stock nobody wants.',
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_SiteSettings" ("aboutImageUrl", "aboutIntro", "aboutText", "aboutTitle", "aboutValue1Text", "aboutValue1Title", "aboutValue2Text", "aboutValue2Title", "aboutValue3Text", "aboutValue3Title", "announcementCtaLabel", "announcementCtaUrl", "announcementEnabled", "announcementEndsAt", "announcementText", "announcementTimerLabel", "contactEmail", "contactIntro", "contactTitle", "faviconUrl", "heroCtaLabel", "heroImageUrl", "heroSubtitle", "heroTitle", "id", "legalAddress", "legalCompanyName", "legalEmail", "legalExtra", "legalKvk", "legalPhone", "legalVat", "maintenanceMessage", "maintenanceMode", "privacyPolicyText", "refundPolicyText", "shippingPolicyText", "shippingReturnsText", "termsText", "updatedAt") SELECT "aboutImageUrl", "aboutIntro", "aboutText", "aboutTitle", "aboutValue1Text", "aboutValue1Title", "aboutValue2Text", "aboutValue2Title", "aboutValue3Text", "aboutValue3Title", "announcementCtaLabel", "announcementCtaUrl", "announcementEnabled", "announcementEndsAt", "announcementText", "announcementTimerLabel", "contactEmail", "contactIntro", "contactTitle", "faviconUrl", "heroCtaLabel", "heroImageUrl", "heroSubtitle", "heroTitle", "id", "legalAddress", "legalCompanyName", "legalEmail", "legalExtra", "legalKvk", "legalPhone", "legalVat", "maintenanceMessage", "maintenanceMode", "privacyPolicyText", "refundPolicyText", "shippingPolicyText", "shippingReturnsText", "termsText", "updatedAt" FROM "SiteSettings";
DROP TABLE "SiteSettings";
ALTER TABLE "new_SiteSettings" RENAME TO "SiteSettings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
