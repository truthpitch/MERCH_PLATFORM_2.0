// Shared bits for connecting accounts with OAuth (admin → Social → Accounts).
// A random "state" value is kept in a short-lived cookie and must come back unchanged,
// so nobody can trick the admin's browser into connecting someone else's account.
import { randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { publicSiteUrl } from "@/lib/site";
import type { Platform } from "./types";

const COOKIE = "tp_social_oauth";
const PATH = "/admin/social/connect";

const slug = (p: Platform) => p.toLowerCase();

/** The exact redirect address registered in the Meta app, e.g. https://www.truthpitch.com/admin/social/connect/instagram/callback */
export const redirectUri = (p: Platform) => `${publicSiteUrl()}${PATH}/${slug(p)}/callback`;

export async function startOAuth(p: Platform): Promise<string> {
  const state = randomBytes(24).toString("base64url");
  (await cookies()).set(COOKIE, `${slug(p)}.${state}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax", // sent along when Meta redirects back to us
    path: PATH,
    maxAge: 10 * 60,
  });
  return state;
}

/** Checks the state from the redirect against the cookie (and removes the cookie). */
export async function checkOAuthState(p: Platform, state: string | null): Promise<boolean> {
  const jar = await cookies();
  const stored = jar.get(COOKIE)?.value ?? "";
  jar.delete({ name: COOKIE, path: PATH });
  const expected = Buffer.from(stored);
  const given = Buffer.from(`${slug(p)}.${state ?? ""}`);
  return Boolean(state) && expected.length === given.length && timingSafeEqual(expected, given);
}

/** Back to the accounts page with a readable message. */
export function accountsUrl(params: Record<string, string>): string {
  return `/admin/social/accounts?${new URLSearchParams(params)}`;
}
