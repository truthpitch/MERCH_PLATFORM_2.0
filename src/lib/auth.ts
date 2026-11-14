import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  REMEMBER_EMAIL_COOKIE,
  REMEMBER_MAX_AGE,
  SESSION_COOKIE,
  SHORT_MAX_AGE,
  createSessionToken,
  verifySessionToken,
} from "./session";

/** True when admin credentials are configured in the environment. */
export function isAuthConfigured(): boolean {
  return Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD && process.env.AUTH_SECRET);
}

function safeEqual(a: string, b: string): boolean {
  // Hash first so both buffers have equal length, then compare in constant time.
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

/**
 * Checks the single owner account.
 * ⚠️ Set ADMIN_EMAIL and ADMIN_PASSWORD in .env (server-side only, never committed).
 */
export function checkCredentials(email: string, password: string): boolean {
  const expectedEmail = process.env.ADMIN_EMAIL;
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedEmail || !expectedPassword) return false;
  const emailOk = safeEqual(email.trim().toLowerCase(), expectedEmail.trim().toLowerCase());
  const passwordOk = safeEqual(password, expectedPassword);
  return emailOk && passwordOk;
}

const cookieBase = () => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
});

/**
 * Signs the admin in.
 * remember = true  → stays signed in for 30 days (also after closing the browser),
 *                    and the email is remembered to pre-fill the login form.
 * remember = false → signed out when the browser closes (12 hours at most); email forgotten.
 * The password itself is never stored by the site; the browser's password manager can save it.
 */
export async function startSession(email: string, remember: boolean): Promise<void> {
  const maxAge = remember ? REMEMBER_MAX_AGE : SHORT_MAX_AGE;
  const token = await createSessionToken(email, maxAge);
  const jar = await cookies();
  // No maxAge = a browser-session cookie that disappears when the browser closes.
  jar.set(SESSION_COOKIE, token, { ...cookieBase(), path: "/", ...(remember ? { maxAge } : {}) });

  if (remember) {
    jar.set(REMEMBER_EMAIL_COOKIE, email.trim(), { ...cookieBase(), path: "/admin", maxAge: 60 * 60 * 24 * 365 });
  } else {
    jar.set(REMEMBER_EMAIL_COOKIE, "", { ...cookieBase(), path: "/admin", maxAge: 0 });
  }
}

/** Email saved by "Remember me", used to pre-fill the login form. */
export async function getRememberedEmail(): Promise<string> {
  const jar = await cookies();
  return jar.get(REMEMBER_EMAIL_COOKIE)?.value ?? "";
}

/** Logs out. A remembered email stays, so signing back in is quick. */
export async function endSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function isAdmin(): Promise<boolean> {
  if (!process.env.AUTH_SECRET) return false;
  const jar = await cookies();
  return verifySessionToken(jar.get(SESSION_COOKIE)?.value);
}

/** Use at the top of every admin page and server action. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/login");
}
