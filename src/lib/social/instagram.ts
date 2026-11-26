// Instagram via "Instagram API with Instagram Login" (graph.instagram.com).
// Works with Instagram Business and Creator accounts; no Facebook Page needed.
// Scopes: instagram_business_basic, instagram_business_content_publish.
//
// Publishing is Meta's two-step flow: create a media container → wait until it's FINISHED →
// media_publish → fetch the permalink.
import { metaRequest, sleep, unwrap } from "./meta";
import { SocialError, type SocialAdapter } from "./types";

const NAME = "Instagram";
export const INSTAGRAM_SCOPES = ["instagram_business_basic", "instagram_business_content_publish"];

// Hosts can be overridden for local testing only (SOCIAL_API_TEST_BASE points at a fake API).
const TEST_BASE = process.env.SOCIAL_API_TEST_BASE?.replace(/\/+$/, "");
const VERSION = process.env.INSTAGRAM_API_VERSION?.trim() || "v27.0";
const GRAPH = TEST_BASE ? `${TEST_BASE}/ig-graph` : "https://graph.instagram.com";
const API = `${GRAPH}/${VERSION}`;
const OAUTH = TEST_BASE ? `${TEST_BASE}/ig-api` : "https://api.instagram.com";
const AUTHORIZE = TEST_BASE ? `${TEST_BASE}/ig-www/oauth/authorize` : "https://www.instagram.com/oauth/authorize";

export function instagramAppConfig() {
  const appId = process.env.INSTAGRAM_APP_ID?.trim() ?? "";
  const appSecret = process.env.INSTAGRAM_APP_SECRET?.trim() ?? "";
  return appId && appSecret ? { appId, appSecret } : null;
}

// ── Connecting (OAuth) ──────────────────────────────────────

export function instagramAuthorizeUrl(redirectUri: string, state: string): string {
  const cfg = instagramAppConfig();
  if (!cfg) throw new SocialError("Instagram isn't configured: set INSTAGRAM_APP_ID and INSTAGRAM_APP_SECRET.");
  const q = new URLSearchParams({
    client_id: cfg.appId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: INSTAGRAM_SCOPES.join(","),
    state,
    enable_fb_login: "0",
    force_reauth: "true",
  });
  return `${AUTHORIZE}?${q}`;
}

/** Code from the redirect → long-lived token (~60 days) and the account's id and username. */
export async function instagramConnect(code: string, redirectUri: string) {
  const cfg = instagramAppConfig();
  if (!cfg) throw new SocialError("Instagram isn't configured: set INSTAGRAM_APP_ID and INSTAGRAM_APP_SECRET.");
  // Instagram appends "#_" to the redirect; it isn't part of the code.
  const cleanCode = code.replace(/#_$/, "");

  type ShortToken = { access_token: string; user_id: string | number; permissions?: string | string[] };
  const short = unwrap(
    await metaRequest<ShortToken | { data: ShortToken[] }>(NAME, "POST", `${OAUTH}/oauth/access_token`, {
      client_id: cfg.appId,
      client_secret: cfg.appSecret,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      code: cleanCode,
    }),
  );
  if (!short?.access_token) throw new SocialError("Instagram didn't return an access token. Please try connecting again.");
  const perms = Array.isArray(short.permissions) ? short.permissions : String(short.permissions ?? "").split(",");
  if (short.permissions && !perms.map((p) => p.trim()).includes("instagram_business_content_publish")) {
    throw new SocialError("Publishing permission wasn't granted. Connect again and allow Instagram to publish content.");
  }

  const long = await metaRequest<{ access_token: string; expires_in?: number }>(NAME, "GET", `${GRAPH}/access_token`, {
    grant_type: "ig_exchange_token",
    client_secret: cfg.appSecret,
    access_token: short.access_token,
  });

  type Me = { user_id?: string | number; id?: string; username?: string; account_type?: string };
  const me = unwrap(await metaRequest<Me | { data: Me[] }>(NAME, "GET", `${API}/me`, { fields: "user_id,username,account_type", access_token: long.access_token }));
  // user_id = the Instagram professional account id used for publishing (id is app-scoped).
  const userId = String(me?.user_id ?? short.user_id ?? "");
  if (!userId) throw new SocialError("Instagram didn't say which account was connected. Please try again.");
  if (me?.account_type && !/BUSINESS|MEDIA_CREATOR|CREATOR/i.test(me.account_type)) {
    throw new SocialError("This is a personal Instagram account. Switch it to a Business or Creator account in the Instagram app, then connect again.");
  }

  return {
    externalUserId: userId,
    username: me?.username ?? "",
    accessToken: long.access_token,
    expiresAt: long.expires_in ? new Date(Date.now() + long.expires_in * 1000) : null,
  };
}

// ── Publishing ──────────────────────────────────────────────

type ContainerStatus = "FINISHED" | "IN_PROGRESS" | "ERROR" | "EXPIRED" | "PUBLISHED";

async function containerStatus(id: string, token: string) {
  return metaRequest<{ status_code?: ContainerStatus; status?: string }>(NAME, "GET", `${API}/${id}`, { fields: "status_code,status", access_token: token });
}

/** Waits until a container is ready. Images are usually done within seconds. */
async function waitUntilFinished(id: string, token: string, maxMs = 60_000): Promise<void> {
  const until = Date.now() + maxMs;
  let delay = 2_000;
  for (;;) {
    const s = await containerStatus(id, token);
    if (s.status_code === "FINISHED") return;
    if (s.status_code === "ERROR") throw new SocialError(`Instagram couldn't process the image${s.status ? ` (${s.status})` : ""}. Use a JPEG between 4:5 and 1.91:1 and under 8 MB.`);
    if (s.status_code === "EXPIRED") throw new SocialError("The Instagram upload expired before it was published. Click Retry.");
    if (s.status_code === "PUBLISHED") throw new SocialError("This post already seems to be on Instagram. Check the account before retrying.");
    if (Date.now() + delay > until) {
      throw new SocialError("Instagram is still processing the image. Click Retry in a minute; it will continue with the same upload.");
    }
    await sleep(delay);
    delay = Math.min(delay * 2, 10_000);
  }
}

/** Instagram allows a limited number of API posts per 24 hours. */
async function checkPublishingLimit(userId: string, token: string) {
  type Limit = { quota_usage?: number; config?: { quota_total?: number } };
  const limit = unwrap(await metaRequest<Limit | { data: Limit[] }>(NAME, "GET", `${API}/${userId}/content_publishing_limit`, { fields: "quota_usage,config", access_token: token }));
  const used = limit?.quota_usage ?? 0;
  const total = limit?.config?.quota_total;
  if (total && used >= total) {
    throw new SocialError(`Instagram's daily limit is reached (${used} of ${total} posts in the last 24 hours). Retry later.`);
  }
}

export const instagramAdapter: SocialAdapter = {
  platform: "INSTAGRAM",

  async publish({ externalUserId: userId, accessToken: token }, { caption, imageUrl, previousContainerId }, onContainer) {
    if (!imageUrl) throw new SocialError("Instagram needs an image.");

    // Retry: continue with the earlier upload if Instagram still has it ready.
    let containerId: string | null = null;
    if (previousContainerId) {
      const s = await containerStatus(previousContainerId, token).catch(() => null);
      if (s?.status_code === "PUBLISHED") throw new SocialError("This post already seems to be on Instagram. Check the account; it won't be posted again.");
      if (s?.status_code === "FINISHED" || s?.status_code === "IN_PROGRESS") containerId = previousContainerId;
    }

    await checkPublishingLimit(userId, token);

    if (!containerId) {
      const created = await metaRequest<{ id: string }>(NAME, "POST", `${API}/${userId}/media`, { image_url: imageUrl, caption, access_token: token }, 60_000);
      containerId = created.id;
      await onContainer?.(containerId);
    }
    await waitUntilFinished(containerId, token);

    const published = await metaRequest<{ id: string }>(NAME, "POST", `${API}/${userId}/media_publish`, { creation_id: containerId, access_token: token }, 60_000);
    // The post is live now; a missing permalink is not a failure.
    const info = await metaRequest<{ permalink?: string }>(NAME, "GET", `${API}/${published.id}`, { fields: "permalink", access_token: token }).catch(() => ({}) as { permalink?: string });
    return { id: published.id, permalink: info.permalink ?? null };
  },

  async refreshToken(token) {
    const r = await metaRequest<{ access_token: string; expires_in?: number }>(NAME, "GET", `${GRAPH}/refresh_access_token`, {
      grant_type: "ig_refresh_token",
      access_token: token,
    });
    return { accessToken: r.access_token, expiresAt: r.expires_in ? new Date(Date.now() + r.expires_in * 1000) : null };
  },
};
