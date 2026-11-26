// GET /admin/social/connect/instagram/callback: Instagram sends the admin back here.
// Swaps the code for a long-lived token, stores it encrypted and returns to the accounts page.
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { encryptToken, isTokenKeyConfigured } from "@/lib/social/crypto";
import { instagramConnect } from "@/lib/social/instagram";
import { scrub } from "@/lib/social/meta";
import { accountsUrl, checkOAuthState, redirectUri } from "@/lib/social/oauth";
import { SocialError } from "@/lib/social/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await requireAdmin();
  const q = new URL(request.url).searchParams;

  if (q.get("error")) {
    const denied = q.get("error_reason") === "user_denied" || q.get("error") === "access_denied";
    redirect(accountsUrl({ error: denied ? "Instagram access was not allowed, so nothing was connected." : `Instagram: ${scrub(q.get("error_description") ?? "connecting failed").slice(0, 200)}` }));
  }
  if (!(await checkOAuthState("INSTAGRAM", q.get("state")))) {
    redirect(accountsUrl({ error: "The Instagram connection expired or didn't start here. Please click Connect again." }));
  }
  if (!isTokenKeyConfigured()) redirect(accountsUrl({ error: "SOCIAL_TOKEN_KEY is not set, so the token can't be stored safely." }));

  let message: string;
  try {
    const acc = await instagramConnect(q.get("code") ?? "", redirectUri("INSTAGRAM"));
    await prisma.socialAccount.upsert({
      where: { platform_externalUserId: { platform: "INSTAGRAM", externalUserId: acc.externalUserId } },
      update: { username: acc.username, accessToken: encryptToken(acc.accessToken), expiresAt: acc.expiresAt, lastRefreshError: "" },
      create: { platform: "INSTAGRAM", externalUserId: acc.externalUserId, username: acc.username, accessToken: encryptToken(acc.accessToken), expiresAt: acc.expiresAt },
    });
    message = "";
  } catch (err) {
    if (!(err instanceof SocialError)) console.error("Instagram connect failed:", scrub(err instanceof Error ? err.message : String(err)));
    message = err instanceof SocialError ? err.message : "Connecting Instagram failed. Please try again.";
  }
  redirect(message ? accountsUrl({ error: message.slice(0, 300) }) : accountsUrl({ done: "connected" }));
}
