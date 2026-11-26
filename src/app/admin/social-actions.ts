"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { absoluteUrl } from "@/lib/site";
import { encryptToken, isTokenKeyConfigured } from "@/lib/social/crypto";
import { accountState, publishTarget, validateForPlatform } from "@/lib/social/engine";
import { isSocialMock } from "@/lib/social/mock";
import { amsterdamToUtc } from "@/lib/social/time";
import { PLATFORM_LABEL, isPlatform } from "@/lib/social/types";

export type ComposeState = { error?: string };

const str = (fd: FormData, key: string, max: number) =>
  String(fd.get(key) ?? "")
    .replace(/\r\n?/g, "\n")
    .slice(0, max)
    .trim();
const idOf = (fd: FormData, key = "id") => {
  const n = Number(fd.get(key));
  return Number.isInteger(n) && n > 0 ? n : null;
};

/** Create (or edit) a post, then publish it now or leave it for the cron job at its time. */
export async function saveSocialPostAction(_prev: ComposeState, fd: FormData): Promise<ComposeState> {
  await requireAdmin();
  const editId = idOf(fd);
  // Not trimmed: spacing at the start/end of a caption can be intentional, but empty-only isn't.
  const caption = String(fd.get("caption") ?? "").replace(/\r\n?/g, "\n").slice(0, 5000);
  const imageUrl = str(fd, "imageUrl", 1000) || null;
  const productHandle = str(fd, "productHandle", 200) || null;
  const accountIds = fd
    .getAll("account")
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0);
  const when = fd.get("when") === "schedule" ? "schedule" : "now";

  if (imageUrl && !/^(https?:\/\/|\/)/i.test(imageUrl)) return { error: "That image address isn't valid." };
  if (accountIds.length === 0) return { error: "Choose at least one account (Instagram or Threads)." };
  const accounts = await prisma.socialAccount.findMany({ where: { id: { in: accountIds } } });
  if (accounts.length !== accountIds.length) return { error: "One of the accounts no longer exists. Reload the page." };

  // Site images (/media/…) become full addresses, because Meta downloads them from the web.
  const fullImage = imageUrl ? absoluteUrl(imageUrl) : null;

  const problems: string[] = [];
  for (const a of accounts) {
    if (!isPlatform(a.platform)) continue;
    problems.push(...validateForPlatform(a.platform, caption, fullImage));
    if (accountState(a.expiresAt) === "expired") problems.push(`The ${PLATFORM_LABEL[a.platform]} token has expired: reconnect it under Accounts first.`);
  }
  if (problems.length) return { error: [...new Set(problems)].join(" ") };

  let scheduledAt: Date | null = null;
  if (when === "schedule") {
    scheduledAt = amsterdamToUtc(str(fd, "scheduledLocal", 20));
    if (!scheduledAt) return { error: "Choose a date and time." };
    if (scheduledAt.getTime() < Date.now() + 60_000) return { error: "Choose a time in the future (at least a minute from now)." };
  }

  const targets = accounts.map((a) => ({ accountId: a.id, platform: a.platform }));
  let postId: number;
  if (editId) {
    const existing = await prisma.socialPost.findUnique({ where: { id: editId }, include: { targets: true } });
    if (!existing) return { error: "This post no longer exists." };
    if (existing.targets.some((t) => t.status !== "scheduled")) {
      return { error: "This post has already been (partly) published, so it can't be edited anymore." };
    }
    await prisma.$transaction([
      prisma.socialPostTarget.deleteMany({ where: { postId: editId } }),
      prisma.socialPost.update({
        where: { id: editId },
        data: { caption, imageUrl: fullImage, productHandle, scheduledAt, targets: { create: targets } },
      }),
    ]);
    postId = editId;
  } else {
    postId = (await prisma.socialPost.create({ data: { caption, imageUrl: fullImage, productHandle, scheduledAt, targets: { create: targets } } })).id;
  }

  let done = "scheduled";
  if (when === "now") {
    const rows = await prisma.socialPostTarget.findMany({ where: { postId }, select: { id: true } });
    const results = await Promise.all(rows.map((t) => publishTarget(t.id)));
    done = results.every((r) => r === "published") ? "posted" : "post-failed";
  }
  revalidatePath("/admin/social");
  redirect(`/admin/social?done=${done}#queue`);
}

/** Deletes a post from the list (not possible while it's being published). */
export async function deleteSocialPostAction(fd: FormData) {
  await requireAdmin();
  const id = idOf(fd);
  if (id) {
    const busy = await prisma.socialPostTarget.count({ where: { postId: id, status: "publishing" } });
    if (!busy) await prisma.socialPost.delete({ where: { id } }).catch(() => null);
  }
  redirect("/admin/social?done=deleted#queue");
}

/** Tries a failed target again, right away. */
export async function retrySocialTargetAction(fd: FormData) {
  await requireAdmin();
  const id = idOf(fd);
  let done = "post-failed";
  if (id) {
    const reset = await prisma.socialPostTarget.updateMany({ where: { id, status: "failed" }, data: { status: "scheduled", error: null } });
    if (reset.count === 1) done = (await publishTarget(id)) === "published" ? "posted" : "post-failed";
  }
  redirect(`/admin/social?done=${done}#queue`);
}

// ── Accounts ────────────────────────────────────────────────

/** Mock mode only: adds a pretend account so the whole flow can be tried without Meta. */
export async function connectMockAccountAction(fd: FormData) {
  await requireAdmin();
  const platform = fd.get("platform");
  if (!isSocialMock() || !isPlatform(platform)) redirect("/admin/social/accounts");
  if (!isTokenKeyConfigured()) redirect("/admin/social/accounts?error=key");
  const expiresAt = new Date(Date.now() + 60 * 24 * 3600 * 1000);
  const username = platform === "INSTAGRAM" ? "truthpitch_mock" : "truthpitch_mock_threads";
  const accessToken = encryptToken(`mock-token-${platform}`);
  await prisma.socialAccount.upsert({
    where: { platform_externalUserId: { platform, externalUserId: `mock-${platform}` } },
    update: { accessToken, expiresAt, lastRefreshError: "" },
    create: { platform, externalUserId: `mock-${platform}`, username, accessToken, expiresAt },
  });
  redirect("/admin/social/accounts?done=connected");
}

/** Removes an account and its token. Its scheduled posts will fail with a clear message; history stays. */
export async function disconnectSocialAccountAction(fd: FormData) {
  await requireAdmin();
  const id = idOf(fd);
  if (id) await prisma.socialAccount.delete({ where: { id } }).catch(() => null);
  redirect("/admin/social/accounts?done=disconnected");
}
