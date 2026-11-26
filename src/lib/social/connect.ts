// The two OAuth steps for connecting an account, shared by Instagram and Threads:
// start (send the admin to Meta) and finish (Meta sends the admin back with a code).
// Used by the route handlers under app/admin/social/connect/<platform>/.
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { encryptToken, isTokenKeyConfigured } from "./crypto";
import { instagramAppConfig, instagramAuthorizeUrl, instagramConnect } from "./instagram";
import { scrub } from "./meta";
import { accountsUrl, checkOAuthState, redirectUri, startOAuth } from "./oauth";
import { threadsAppConfig, threadsAuthorizeUrl, threadsConnect } from "./threads";
import { PLATFORM_LABEL, SocialError, type Platform } from "./types";

const PROVIDERS = {
  INSTAGRAM: {
    configured: instagramAppConfig,
    authorizeUrl: instagramAuthorizeUrl,
    connect: instagramConnect,
    env: "INSTAGRAM_APP_ID, INSTAGRAM_APP_SECRET and INSTAGRAM_CONFIG_ID",
  },
  THREADS: {
    configured: threadsAppConfig,
    authorizeUrl: threadsAuthorizeUrl,
    connect: async (code: string, uri: string) => [await threadsConnect(code, uri)],
    env: "THREADS_APP_ID and THREADS_APP_SECRET",
  },
} satisfies Record<Platform, unknown>;

export async function startConnect(platform: Platform): Promise<never> {
  await requireAdmin();
  const p = PROVIDERS[platform];
  if (!p.configured()) redirect(accountsUrl({ error: `${PLATFORM_LABEL[platform]} isn't set up yet: add ${p.env} (see SETUP.md).` }));
  const state = await startOAuth(platform);
  redirect(p.authorizeUrl(redirectUri(platform), state));
}

export async function finishConnect(platform: Platform, request: Request): Promise<never> {
  await requireAdmin();
  const name = PLATFORM_LABEL[platform];
  const q = new URL(request.url).searchParams;

  if (q.get("error")) {
    const denied = q.get("error_reason") === "user_denied" || q.get("error") === "access_denied";
    redirect(
      accountsUrl({
        error: denied ? `${name} access was not allowed, so nothing was connected.` : `${name}: ${scrub(q.get("error_description") ?? "connecting failed").slice(0, 200)}`,
      }),
    );
  }
  if (!(await checkOAuthState(platform, q.get("state")))) {
    redirect(accountsUrl({ error: `The ${name} connection expired or didn't start here. Please click Connect again.` }));
  }
  if (!isTokenKeyConfigured()) redirect(accountsUrl({ error: "SOCIAL_TOKEN_KEY is not set, so the token can't be stored safely." }));

  let message = "";
  try {
    // One login can share several accounts (Instagram); store each.
    for (const acc of await PROVIDERS[platform].connect(q.get("code") ?? "", redirectUri(platform))) {
      const data = { username: acc.username, accessToken: encryptToken(acc.accessToken), expiresAt: acc.expiresAt, lastRefreshError: "" };
      await prisma.socialAccount.upsert({
        where: { platform_externalUserId: { platform, externalUserId: acc.externalUserId } },
        update: data,
        create: { platform, externalUserId: acc.externalUserId, ...data },
      });
    }
  } catch (err) {
    if (!(err instanceof SocialError)) console.error(`${name} connect failed:`, scrub(err instanceof Error ? err.message : String(err)));
    message = err instanceof SocialError ? err.message : `Connecting ${name} failed. Please try again.`;
  }
  // redirect() works by throwing, so it stays outside the try/catch above.
  redirect(message ? accountsUrl({ error: message.slice(0, 300) }) : accountsUrl({ done: "connected" }));
}
