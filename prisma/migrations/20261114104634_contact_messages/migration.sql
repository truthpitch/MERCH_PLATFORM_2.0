-- CreateTable
CREATE TABLE "ContactMessage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subject" TEXT NOT NULL DEFAULT '',
    "orderNumber" TEXT NOT NULL DEFAULT '',
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SiteSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "maintenanceMessage" TEXT NOT NULL DEFAULT 'We''re making a few changes behind the scenes. Please check back shortly.',
    "announcementEnabled" BOOLEAN NOT NULL DEFAULT false,
    "announcementText" TEXT NOT NULL DEFAULT '',
    "heroTitle" TEXT NOT NULL DEFAULT 'Merch with a message.',
    "heroSubtitle" TEXT NOT NULL DEFAULT 'Clean, honest essentials from TruthPitch. Printed on demand, made to last.',
    "heroCtaLabel" TEXT NOT NULL DEFAULT 'Shop the collection',
    "heroImageUrl" TEXT NOT NULL DEFAULT '',
    "aboutTitle" TEXT NOT NULL DEFAULT 'About TruthPitch',
    "contactTitle" TEXT NOT NULL DEFAULT 'Contact',
    "contactIntro" TEXT NOT NULL DEFAULT 'Questions about an order, sizing or anything else? Send us a message and we will get back to you as soon as we can.',
    "contactEmail" TEXT NOT NULL DEFAULT '',
    "aboutText" TEXT NOT NULL DEFAULT 'TruthPitch is about saying what matters, plainly. This shop carries a small, considered range of pieces that carry that idea with them.

Every item is printed on demand when you order it, which means less waste and no warehouses full of unsold stock.',
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_SiteSettings" ("aboutText", "aboutTitle", "announcementEnabled", "announcementText", "heroCtaLabel", "heroImageUrl", "heroSubtitle", "heroTitle", "id", "maintenanceMessage", "maintenanceMode", "updatedAt") SELECT "aboutText", "aboutTitle", "announcementEnabled", "announcementText", "heroCtaLabel", "heroImageUrl", "heroSubtitle", "heroTitle", "id", "maintenanceMessage", "maintenanceMode", "updatedAt" FROM "SiteSettings";
DROP TABLE "SiteSettings";
ALTER TABLE "new_SiteSettings" RENAME TO "SiteSettings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "ContactMessage_read_createdAt_idx" ON "ContactMessage"("read", "createdAt");
