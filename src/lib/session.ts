// Admin session tokens (signed JWT in an httpOnly cookie).
// Kept free of Next.js server-only imports so it can run in src/proxy.ts.
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "tp_admin_session";
/** "Remember me" checked: stay signed in for 30 days, across browser restarts. */
export const REMEMBER_MAX_AGE = 60 * 60 * 24 * 30;
/** "Remember me" unchecked: the cookie ends when the browser closes, the token after 12 hours at most. */
export const SHORT_MAX_AGE = 60 * 60 * 12;
/** Remembers the admin email (never the password) so the login form is pre-filled. */
export const REMEMBER_EMAIL_COOKIE = "tp_admin_email";

function getSecret(): Uint8Array {
  // ⚠️ Set AUTH_SECRET in .env (random, 32+ characters).
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET is missing or too short. Set a random 32+ character value in .env.");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(email: string, maxAgeSeconds: number): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(email)
    .setIssuedAt()
    .setExpirationTime(`${maxAgeSeconds}s`)
    .sign(getSecret());
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ["HS256"] });
    return payload.role === "admin";
  } catch {
    return false;
  }
}
