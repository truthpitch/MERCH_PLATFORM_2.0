-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ProductStory" (
    "handle" TEXT NOT NULL PRIMARY KEY,
    "story" TEXT NOT NULL DEFAULT '',
    "imageUrl" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT '',
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_ProductStory" ("handle", "imageUrl", "story", "updatedAt") SELECT "handle", "imageUrl", "story", "updatedAt" FROM "ProductStory";
DROP TABLE "ProductStory";
ALTER TABLE "new_ProductStory" RENAME TO "ProductStory";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
