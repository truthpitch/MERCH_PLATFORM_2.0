-- CreateTable
CREATE TABLE "SocialAccount" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "platform" TEXT NOT NULL,
    "username" TEXT NOT NULL DEFAULT '',
    "externalUserId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "expiresAt" DATETIME,
    "lastRefreshError" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SocialPost" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "caption" TEXT NOT NULL DEFAULT '',
    "imageUrl" TEXT,
    "productHandle" TEXT,
    "scheduledAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SocialPostTarget" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "postId" INTEGER NOT NULL,
    "accountId" INTEGER,
    "platform" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "containerId" TEXT,
    "externalPostId" TEXT,
    "permalink" TEXT,
    "error" TEXT,
    "lockedAt" DATETIME,
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SocialPostTarget_postId_fkey" FOREIGN KEY ("postId") REFERENCES "SocialPost" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SocialPostTarget_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "SocialAccount" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "SocialAccount_platform_externalUserId_key" ON "SocialAccount"("platform", "externalUserId");

-- CreateIndex
CREATE INDEX "SocialPost_scheduledAt_idx" ON "SocialPost"("scheduledAt");

-- CreateIndex
CREATE INDEX "SocialPostTarget_status_idx" ON "SocialPostTarget"("status");

-- CreateIndex
CREATE INDEX "SocialPostTarget_postId_idx" ON "SocialPostTarget"("postId");
