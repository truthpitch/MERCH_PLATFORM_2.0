// Shop customer accounts (separate from the admin login).
// Passwords are hashed with scrypt; the plain password is never stored.
// The session is a signed token in an httpOnly cookie, valid for 30 days.
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./db";
import { getSecret } from "./session";

const scrypt = promisify(scryptCb) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>;

export const CUSTOMER_COOKIE = "tp_customer";
const SESSION_DAYS = 30;
export const MIN_PASSWORD_LENGTH = 8;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, saltHex, hashHex] = stored.split("$");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = await scrypt(password, Buffer.from(saltHex, "hex"), expected.length);
  return timingSafeEqual(actual, expected);
}

export async function startCustomerSession(customerId: number): Promise<void> {
  const maxAge = 60 * 60 * 24 * SESSION_DAYS;
  const token = await new SignJWT({ role: "customer" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(customerId))
    .setIssuedAt()
    .setExpirationTime(`${maxAge}s`)
    .sign(getSecret());
  (await cookies()).set(CUSTOMER_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });
}

export async function endCustomerSession(): Promise<void> {
  (await cookies()).delete(CUSTOMER_COOKIE);
}

/** The signed-in customer's id, or null. */
export async function getCustomerId(): Promise<number | null> {
  const token = (await cookies()).get(CUSTOMER_COOKIE)?.value;
  if (!token || !process.env.AUTH_SECRET) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ["HS256"] });
    const id = Number(payload.sub);
    return payload.role === "customer" && Number.isInteger(id) ? id : null;
  } catch {
    return null;
  }
}

export type CurrentCustomer = { id: number; email: string; name: string; createdAt: Date };

/** The signed-in customer (null for guests, or when the account was deleted). */
export async function getCurrentCustomer(): Promise<CurrentCustomer | null> {
  const id = await getCustomerId();
  if (!id) return null;
  return prisma.customer.findUnique({ where: { id }, select: { id: true, email: true, name: true, createdAt: true } });
}

/** Only allow redirects back into this site (e.g. ?next=/cart), never to another domain. */
export function safeNext(value: unknown, fallback = "/account"): string {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : fallback;
}
