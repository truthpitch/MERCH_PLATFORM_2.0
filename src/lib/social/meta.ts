// Small helper for Meta's Graph APIs (graph.instagram.com, graph.threads.net).
// Turns API errors into readable SocialErrors and makes sure access tokens and app secrets
// never end up in an error message or a log line.
import { SocialError } from "./types";

type Params = Record<string, string | number | undefined>;

/** Removes anything that looks like a token or secret from a message. */
export function scrub(text: string): string {
  return text
    .replace(/(access_token|client_secret|code)=[^&\s"]+/gi, "$1=[hidden]")
    .replace(/\b(IG|TH)[A-Za-z0-9_-]{30,}\b/g, "[hidden]")
    .replace(/\bEAA[A-Za-z0-9]{20,}\b/g, "[hidden]");
}

type MetaErrorBody = {
  error?: { message?: string; type?: string; code?: number; error_subcode?: number; error_user_title?: string; error_user_msg?: string };
  error_message?: string;
  error_type?: string;
};

/** Error codes that mean "the token is no longer valid": the account must be reconnected. */
const AUTH_CODES = new Set([190, 102, 463, 467]);
/** Rate-limit codes. */
const RATE_CODES = new Set([4, 17, 32, 613, 80001, 80002]);

function toSocialError(platformName: string, status: number, body: MetaErrorBody): SocialError {
  const e = body.error;
  const code = e?.code;
  const detail = scrub(e?.error_user_msg || e?.message || body.error_message || `HTTP ${status}`);
  if ((code && AUTH_CODES.has(code)) || (e?.type === "OAuthException" && status === 401)) {
    return new SocialError(`${platformName} says the access token is invalid or expired: ${detail}`, true);
  }
  if (code && RATE_CODES.has(code)) return new SocialError(`${platformName} rate limit reached. Try again later. (${detail})`);
  if (e?.error_subcode === 2207052 || e?.error_subcode === 2207026 || /media.*(download|fetch)|image_url/i.test(detail)) {
    return new SocialError(
      `${platformName} couldn't use the image: ${detail} Check that it's a JPEG on a public https address (open the image link in a private browser window).`,
    );
  }
  return new SocialError(`${platformName}: ${detail}`);
}

/**
 * Calls a Graph API endpoint. GET sends params in the query string, POST as a form body.
 * The access token travels as a parameter but is never included in thrown errors.
 */
export async function metaRequest<T>(
  platformName: string,
  method: "GET" | "POST",
  url: string,
  params: Params,
  timeoutMs = 30_000,
): Promise<T> {
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)]));
  const body = new URLSearchParams(clean);
  const target = method === "GET" ? `${url}${url.includes("?") ? "&" : "?"}${body}` : url;
  let res: Response;
  try {
    res = await fetch(target, {
      method,
      body: method === "POST" ? body : undefined,
      headers: method === "POST" ? { "Content-Type": "application/x-www-form-urlencoded" } : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    const reason = err instanceof Error && err.name === "TimeoutError" ? "took too long to answer" : "could not be reached";
    throw new SocialError(`${platformName} ${reason}. Please try again.`);
  }
  const text = await res.text();
  let json: unknown = null;
  try {
    // Meta ids can be sent as numbers bigger than JavaScript can hold exactly (e.g. Threads'
    // user_id 17841405793187218), which would silently change them. Read long numbers as text.
    json = text ? JSON.parse(text.replace(/([:\[,]\s*)(-?\d{16,})(?=\s*[,}\]])/g, '$1"$2"')) : null;
  } catch {
    // not JSON (e.g. an HTML error page)
  }
  const errBody = (json ?? {}) as MetaErrorBody;
  if (!res.ok || errBody.error || errBody.error_message) throw toSocialError(platformName, res.status, errBody);
  return json as T;
}

/** Some endpoints wrap their answer in { data: [ … ] }, others don't: accept both. */
export function unwrap<T>(json: T | { data?: T[] }): T | undefined {
  const d = (json as { data?: T[] })?.data;
  return Array.isArray(d) ? d[0] : (json as T);
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
