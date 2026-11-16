-- AlterTable
ALTER TABLE "Customer" ADD COLUMN "activatedAt" DATETIME;

-- CreateTable
CREATE TABLE "EmailActivation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "customerId" INTEGER NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "usedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmailActivation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailActivation_tokenHash_key" ON "EmailActivation"("tokenHash");

-- CreateIndex
CREATE INDEX "EmailActivation_customerId_idx" ON "EmailActivation"("customerId");

-- Accounts made before activation existed keep working: count them as activated.
UPDATE "Customer" SET "activatedAt" = "createdAt" WHERE "activatedAt" IS NULL;
