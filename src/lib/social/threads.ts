// Threads via the Threads API (graph.threads.com). Scopes: threads_basic, threads_content_publish.
//
// Publishing is Meta's two-step flow: create a container (TEXT or IMAGE) → wait until it's
// FINISHED → threads_publish → fetch the permalink.
import { metaRequest, sleep, unwrap } from "./meta";
import { SocialError, type SocialAdapter } from "./types";

const NAME = "Threads";
export const THREADS_SCOPES = ["threads_basic", "threads_content_publish"];

// Hosts can be overridden for local testing only (SOCIAL_API_TEST_BASE points at a fake API).
const TEST_BASE = process.env.SOCIAL_API_TEST_BASE?.replace(/\/+$/, "");
const VERSION = process.env.THREADS_API_VERSION?.trim() || "v1.0";
const GRAPH = TEST_BASE ? `${TEST_BASE}/th-graph` : "https://graph.threads.com";
const API = `${GRAPH}/${VERSION}`;
const AUTHORIZE = TEST_BASE ? `${TEST_BASE}/th-www/oauth/authorize` : "https://threads.com/oauth/authorize";

export function threadsAppConfig() {
  const appId = process.env.THREADS_APP_ID?.trim() ?? "";
  const appSecret = process.env.THREADS_APP_SECRET?.trim() ?? "";
  return appId && appSecret ? { appId, appSecret } : null;
}

const notConfigured = () => new SocialError("Threads isn't configured: set THREADS_APP_ID and THREADS_APP_SECRET.");

// ── Connecting (OAuth) ──────────────────────────────────────

export function threadsAuthorizeUrl(redirectUri: string, state: string): string {
  const cfg = threadsAppConfig();
  if (!cfg) throw notConfigured();
  const q = new URLSearchParams({ client_id: cfg.appId, redirect_uri: redirectUri, scope: THREADS_SCOPES.join(","), response_type: "code", state });
  return `${AUTHORIZE}?${q}`;
}

/** Code from the redirect → long-lived token (~60 days) and the profile's id and username. */
export async function threadsConnect(code: string, redirectUri: string) {
  const cfg = threadsAppConfig();
  if (!cfg) throw notConfigured();

  type ShortToken = { access_token: string; user_id: string | number };
  const short = unwrap(
    await metaRequest<ShortToken | { data: ShortToken[] }>(NAME, "POST", `${GRAPH}/oauth/access_token`, {
      client_id: cfg.appId,
      client_secret: cfg.appSecret,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      code: code.replace(/#_$/, ""), // Threads appends "#_"; it isn't part of the code
    }),
  );
  if (!short?.access_token || !short.user_id) throw new SocialError("Threads didn't return an access token. Please try connecting again.");

  const long = await metaRequest<{ access_token: string; expires_in?: number }>(NAME, "GET", `${GRAPH}/access_token`, {
    grant_type: "th_exchange_token",
    client_secret: cfg.appSecret,
    access_token: short.access_token,
  });

  const userId = String(short.user_id);
  const profile = await metaRequest<{ id?: string; username?: string }>(NAME, "GET", `${API}/${userId}`, {
    fields: "id,username",
    access_token: long.access_token,
  });

  return {
    externalUserId: String(profile.id ?? userId),
    username: profile.username ?? "",
    accessToken: long.access_token,
    expiresAt: long.expires_in ? new Date(Date.now() + long.expires_in * 1000) : null,
  };
}

// ── Publishing ──────────────────────────────────────────────

type ContainerStatus = "FINISHED" | "IN_PROGRESS" | "ERROR" | "EXPIRED" | "PUBLISHED";

async function containerStatus(id: string, token: string) {
  return metaRequest<{ status?: ContainerStatus; error_message?: string }>(NAME, "GET", `${API}/${id}`, { fields: "status,error_message", access_token: token });
}

/** Meta advises waiting before publishing; we check the status instead (text is usually ready at once). */
async function waitUntilFinished(id: string, token: string, maxMs = 60_000): Promise<void> {
  const until = Date.now() + maxMs;
  let delay = 2_000;
  for (;;) {
    const s = await containerStatus(id, token);
    if (s.status === "FINISHED") return;
    if (s.status === "ERROR") {
      throw new SocialError(`Threads couldn't process the post${s.error_message ? ` (${s.error_message})` : ""}. Images must be JPEG or PNG, max 8 MB.`);
    }
    if (s.status === "EXPIRED") throw new SocialError("The Threads upload expired before it was published. Click Retry.");
    if (s.status === "PUBLISHED") throw new SocialError("This post already seems to be on Threads. Check the profile before retrying.");
    if (Date.now() + delay > until) {
      throw new SocialError("Threads is still processing the post. Click Retry in a minute; it will continue with the same upload.");
    }
    await sleep(delay);
    delay = Math.min(delay * 2, 10_000);
  }
}

/** Threads allows 250 API posts per 24 hours. */
async function checkPublishingLimit(userId: string, token: string) {
  type Limit = { quota_usage?: number; config?: { quota_total?: number } };
  const limit = unwrap(await metaRequest<Limit | { data: Limit[] }>(NAME, "GET", `${API}/${userId}/threads_publishing_limit`, { fields: "quota_usage,config", access_token: token }));
  const used = limit?.quota_usage ?? 0;
  const total = limit?.config?.quota_total;
  if (total && used >= total) {
    throw new SocialError(`Threads' daily limit is reached (${used} of ${total} posts in the last 24 hours). Retry later.`);
  }
}

export const threadsAdapter: SocialAdapter = {
  platform: "THREADS",

  async publish({ externalUserId: userId, accessToken: token }, { caption, imageUrl, previousContainerId }, onContainer) {
    // Retry: continue with the earlier upload if Threads still has it ready.
    let containerId: string | null = null;
    if (previousContainerId) {
      const s = await containerStatus(previousContainerId, token).catch(() => null);
      if (s?.status === "PUBLISHED") throw new SocialError("This post already seems to be on Threads. Check the profile; it won't be posted again.");
      if (s?.status === "FINISHED" || s?.status === "IN_PROGRESS") containerId = previousContainerId;
    }

    await checkPublishingLimit(userId, token);

    if (!containerId) {
      const created = await metaRequest<{ id: string }>(
        NAME,
        "POST",
        `${API}/${userId}/threads`,
        imageUrl
          ? { media_type: "IMAGE", image_url: imageUrl, text: caption || undefined, access_token: token }
          : { media_type: "TEXT", text: caption, access_token: token },
        60_000,
      );
      containerId = created.id;
      await onContainer?.(containerId);
    }
    await waitUntilFinished(containerId, token);

    const published = await metaRequest<{ id: string }>(NAME, "POST", `${API}/${userId}/threads_publish`, { creation_id: containerId, access_token: token }, 60_000);
    // The post is live now; a missing permalink is not a failure.
    const info = await metaRequest<{ permalink?: string }>(NAME, "GET", `${API}/${published.id}`, { fields: "permalink", access_token: token }).catch(() => ({}) as { permalink?: string });
    return { id: published.id, permalink: info.permalink ?? null };
  },

  async refreshToken(token) {
    const r = await metaRequest<{ access_token: string; expires_in?: number }>(NAME, "GET", `${GRAPH}/refresh_access_token`, {
      grant_type: "th_refresh_token",
      access_token: token,
    });
    return { accessToken: r.access_token, expiresAt: r.expires_in ? new Date(Date.now() + r.expires_in * 1000) : null };
  },
};
