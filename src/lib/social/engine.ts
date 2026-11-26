// Publishing engine for the social scheduler. Used by the admin ("Post now", "Retry") and by
// the cron endpoint (/api/cron/publish-social), which runs every 5 minutes.
//
// Never posts twice: a target is switched from "scheduled" to "publishing" with one atomic
// update before any API call. Only the run that made that switch publishes it.
import { prisma } from "@/lib/db";
import { adapterFor } from "./adapters";
import { decryptToken, encryptToken } from "./crypto";
import { isSocialMock } from "./mock";
import { CAPTION_LIMIT, NEEDS_IMAGE, PLATFORM_LABEL, SocialError, isPlatform, type Platform } from "./types";

const DAY = 24 * 60 * 60 * 1000;
/** Tokens are refreshed when they expire within this time. */
export const REFRESH_WINDOW_MS = 7 * DAY;
/** A target stuck on "publishing" this long was interrupted (server restart, timeout). */
const STALE_MS = 15 * 60 * 1000;
/** Max posts per cron run, so one run stays well within the host's time limits. */
const MAX_PER_RUN = 10;

export type AccountState = "connected" | "expiring" | "expired";

export function accountState(expiresAt: Date | null, now = new Date()): AccountState {
  if (!expiresAt) return "connected";
  if (expiresAt <= now) return "expired";
  return expiresAt.getTime() - now.getTime() < REFRESH_WINDOW_MS ? "expiring" : "connected";
}

/** Problems that stop a post from going to a platform, as readable sentences (empty = fine). */
export function validateForPlatform(platform: Platform, caption: string, imageUrl: string | null): string[] {
  const name = PLATFORM_LABEL[platform];
  const problems: string[] = [];
  if (NEEDS_IMAGE[platform] && !imageUrl) problems.push(`${name} needs an image.`);
  if (!caption.trim() && !imageUrl) problems.push(`${name}: write a caption or add an image.`);
  // Threads refuses posts with more than 5 different links.
  if (platform === "THREADS" && new Set(caption.match(/https?:\/\/[^\s]+/gi) ?? []).size > 5) problems.push("Threads allows at most 5 different links in a post.");
  if (caption.length > CAPTION_LIMIT[platform]) problems.push(`${name} allows at most ${CAPTION_LIMIT[platform]} characters (now ${caption.length}).`);
  // Meta downloads the image itself, so it must be on a public https address (not localhost).
  if (imageUrl && !isSocialMock() && !/^https:\/\/(?!localhost|127\.)/i.test(imageUrl)) {
    problems.push(`${name} can only use an image on a public https address. Publish from the live site (truthpitch.com).`);
  }
  return problems;
}

function readableError(err: unknown, platform: string): string {
  const name = isPlatform(platform) ? PLATFORM_LABEL[platform] : platform;
  if (err instanceof SocialError) return err.needsReconnect ? `Token expired or revoked, reconnect ${name}. (${err.message})` : err.message;
  // Unknown errors: log the message only (adapters never put tokens in messages).
  console.error(`Social publish (${name}) failed:`, err instanceof Error ? err.message : String(err));
  return `${name}: something went wrong while publishing. Please try again.`;
}

/**
 * Publishes one target, but only if it's still "scheduled" (claimed atomically first).
 * Returns the final status, or null when another run already took it.
 */
export async function publishTarget(targetId: number): Promise<"published" | "failed" | null> {
  const claimed = await prisma.socialPostTarget.updateMany({
    where: { id: targetId, status: "scheduled" },
    data: { status: "publishing", lockedAt: new Date(), error: null },
  });
  if (claimed.count !== 1) return null;

  const target = await prisma.socialPostTarget.findUnique({ where: { id: targetId }, include: { post: true, account: true } });
  if (!target) return null;
  const fail = async (error: string) => {
    await prisma.socialPostTarget.update({ where: { id: targetId }, data: { status: "failed", error, lockedAt: null } });
    return "failed" as const;
  };

  const { post, account } = target;
  if (!account) return fail(`The ${PLATFORM_LABEL[target.platform as Platform] ?? target.platform} account was disconnected. Connect it again, then retry.`);
  if (!isPlatform(account.platform)) return fail("Unknown platform.");
  const platform = account.platform;

  const problems = validateForPlatform(platform, post.caption, post.imageUrl);
  if (problems.length) return fail(problems.join(" "));
  if (accountState(account.expiresAt) === "expired") return fail(`Token expired, reconnect ${PLATFORM_LABEL[platform]}.`);

  try {
    const accessToken = decryptToken(account.accessToken);
    const result = await adapterFor(platform).publish(
      { externalUserId: account.externalUserId, accessToken },
      { caption: post.caption, imageUrl: post.imageUrl, previousContainerId: target.containerId },
      async (containerId) => {
        await prisma.socialPostTarget.update({ where: { id: targetId }, data: { containerId } });
      },
    );
    await prisma.socialPostTarget.update({
      where: { id: targetId },
      data: { status: "published", externalPostId: result.id, permalink: result.permalink, publishedAt: new Date(), lockedAt: null, error: null },
    });
    return "published";
  } catch (err) {
    return fail(readableError(err, platform));
  }
}

/** Targets stuck on "publishing" (run interrupted): mark failed, so they're never posted twice by accident. */
async function failStale(now: Date) {
  const r = await prisma.socialPostTarget.updateMany({
    where: { status: "publishing", lockedAt: { lt: new Date(now.getTime() - STALE_MS) } },
    data: {
      status: "failed",
      lockedAt: null,
      error: "Publishing was interrupted. Check the account first: if the post isn't there, click Retry.",
    },
  });
  return r.count;
}

/** Publishes everything that is due (scheduled time passed, or "post now"). */
export async function publishDue(now = new Date()) {
  const stale = await failStale(now);
  const due = await prisma.socialPostTarget.findMany({
    where: { status: "scheduled", post: { OR: [{ scheduledAt: null }, { scheduledAt: { lte: now } }] } },
    orderBy: { post: { scheduledAt: "asc" } },
    take: MAX_PER_RUN,
    select: { id: true },
  });
  let published = 0;
  let failed = 0;
  for (const t of due) {
    const r = await publishTarget(t.id);
    if (r === "published") published++;
    else if (r === "failed") failed++;
  }
  return { due: due.length, published, failed, stale };
}

/** Refreshes tokens that expire within 7 days (both APIs give another ~60 days). */
export async function refreshExpiringTokens(now = new Date()) {
  const accounts = await prisma.socialAccount.findMany({
    where: { expiresAt: { gt: now, lt: new Date(now.getTime() + REFRESH_WINDOW_MS) } },
  });
  let refreshed = 0;
  let failed = 0;
  for (const a of accounts) {
    if (!isPlatform(a.platform)) continue;
    try {
      const fresh = await adapterFor(a.platform).refreshToken(decryptToken(a.accessToken));
      await prisma.socialAccount.update({
        where: { id: a.id },
        data: { accessToken: encryptToken(fresh.accessToken), expiresAt: fresh.expiresAt, lastRefreshError: "" },
      });
      refreshed++;
    } catch (err) {
      failed++;
      await prisma.socialAccount.update({ where: { id: a.id }, data: { lastRefreshError: readableError(err, a.platform).slice(0, 300) } });
    }
  }
  return { checked: accounts.length, refreshed, failed };
}
