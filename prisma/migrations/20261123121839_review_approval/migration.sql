-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Review" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "handle" TEXT NOT NULL,
    "customerId" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "body" TEXT NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "approvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Review_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Review" ("body", "createdAt", "customerId", "handle", "id", "rating", "title", "updatedAt") SELECT "body", "createdAt", "customerId", "handle", "id", "rating", "title", "updatedAt" FROM "Review";
DROP TABLE "Review";
ALTER TABLE "new_Review" RENAME TO "Review";
CREATE INDEX "Review_handle_idx" ON "Review"("handle");
CREATE UNIQUE INDEX "Review_customerId_handle_key" ON "Review"("customerId", "handle");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- Reviews posted before approval existed were already public: keep them approved.
UPDATE "Review" SET "approved" = true, "approvedAt" = "createdAt";
