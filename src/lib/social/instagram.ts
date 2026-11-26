// Instagram via "Instagram API with Unified Login" (Meta's setup for new apps since 2026).
// The admin logs in through Facebook Login for Business with a *configuration* (config_id) and
// can choose "Log in with Instagram". Meta then gives a Business Integration System User token
// for the chosen Instagram professional account. With the configuration's expiry set to
// "Never", that token doesn't expire, so no renewal is needed. A business portfolio is required;
// a Facebook Page is not.
//
// Publishing is Meta's two-step flow on graph.facebook.com: create a media container → wait
// until it's FINISHED → media_publish → fetch the permalink.
import { metaRequest, sleep, unwrap } from "./meta";
import { SocialError, type SocialAdapter } from "./types";

const NAME = "Instagram";

// Hosts can be overridden for local testing only (SOCIAL_API_TEST_BASE points at a fake API).
const TEST_BASE = process.env.SOCIAL_API_TEST_BASE?.replace(/\/+$/, "");
const VERSION = process.env.INSTAGRAM_API_VERSION?.trim() || "v27.0";
const GRAPH = TEST_BASE ? `${TEST_BASE}/fb-graph` : "https://graph.facebook.com";
const API = `${GRAPH}/${VERSION}`;
const DIALOG = TEST_BASE ? `${TEST_BASE}/fb-www/dialog/oauth` : `https://www.facebook.com/${VERSION}/dialog/oauth`;

/** Meta App ID + App secret (App settings → Basic) and the Unified login configuration ID. */
export function instagramAppConfig() {
  const appId = process.env.INSTAGRAM_APP_ID?.trim() ?? "";
  const appSecret = process.env.INSTAGRAM_APP_SECRET?.trim() ?? "";
  const configId = process.env.INSTAGRAM_CONFIG_ID?.trim() ?? "";
  return appId && appSecret && configId ? { appId, appSecret, configId } : null;
}

const notConfigured = () => new SocialError("Instagram isn't configured: set INSTAGRAM_APP_ID, INSTAGRAM_APP_SECRET and INSTAGRAM_CONFIG_ID.");

// ── Connecting (OAuth) ──────────────────────────────────────

export function instagramAuthorizeUrl(redirectUri: string, state: string): string {
  const cfg = instagramAppConfig();
  if (!cfg) throw notConfigured();
  const q = new URLSearchParams({
    client_id: cfg.appId,
    config_id: cfg.configId,
    redirect_uri: redirectUri,
    response_type: "code",
    // System-user configurations return a code even though they're set up for a token.
    override_default_response_type: "true",
    state,
  });
  return `${DIALOG}?${q}`;
}

export type ConnectedAccount = { externalUserId: string; username: string; accessToken: string; expiresAt: Date | null };

/** Code from the redirect → system-user token and every Instagram account it was given access to. */
export async function instagramConnect(code: string, redirectUri: string): Promise<ConnectedAccount[]> {
  const cfg = instagramAppConfig();
  if (!cfg) throw notConfigured();

  const token = await metaRequest<{ access_token?: string; expires_in?: number }>(NAME, "GET", `${API}/oauth/access_token`, {
    client_id: cfg.appId,
    client_secret: cfg.appSecret,
    redirect_uri: redirectUri,
    code: code.replace(/#_$/, ""),
  });
  if (!token.access_token) throw new SocialError("Meta didn't return an access token. Please try connecting again.");
  // "Expiration: Never" in the configuration → no expires_in (or 0).
  const expiresAt = token.expires_in ? new Date(Date.now() + token.expires_in * 1000) : null;

  type IgAccount = { id: string; username?: string };
  const list = await metaRequest<{ data?: IgAccount[] }>(NAME, "GET", `${API}/me/assigned_instagram_accounts`, {
    fields: "id,username",
    access_token: token.access_token,
  });
  const accounts = list.data ?? [];
  if (accounts.length === 0) {
    throw new SocialError("No Instagram account was shared. Connect again and select your Instagram professional account when Meta asks which assets to share.");
  }
  return accounts.map((a) => ({ externalUserId: String(a.id), username: a.username ?? "", accessToken: token.access_token!, expiresAt }));
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

  // Unified login tokens set to "Never" don't expire. If a configuration did give an expiring
  // token, it can only be renewed by connecting again.
  async refreshToken() {
    throw new SocialError("This Instagram connection can't be renewed automatically. Click Reconnect on the Accounts page.");
  },
};
