-- CreateTable
CREATE TABLE "MediaFolder" (
    "slug" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Media" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "filename" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "folder" TEXT NOT NULL DEFAULT 'general',
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Media" ("createdAt", "filename", "id", "mimeType", "originalName", "size") SELECT "createdAt", "filename", "id", "mimeType", "originalName", "size" FROM "Media";
DROP TABLE "Media";
ALTER TABLE "new_Media" RENAME TO "Media";
CREATE UNIQUE INDEX "Media_filename_key" ON "Media"("filename");
CREATE INDEX "Media_folder_idx" ON "Media"("folder");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- Starting folders.
INSERT OR IGNORE INTO "MediaFolder" ("slug", "name") VALUES ('general', 'General'), ('blog', 'Blog'), ('products', 'Products'), ('pages', 'Pages');

-- Existing images: show their original file name (without extension) and put them in General.
UPDATE "Media" SET "name" = CASE WHEN instr("originalName", '.') > 0 THEN substr("originalName", 1, length("originalName") - length(replace("originalName", rtrim("originalName", replace("originalName", '.', '')), '')) - 1) ELSE "originalName" END WHERE "name" = '';
