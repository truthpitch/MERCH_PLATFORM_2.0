// "Forgot password" links.
// The link holds a random token; the database only stores its SHA-256 hash, so a leaked
// database can't be used to reset passwords. A link works once and expires after 1 hour.
import { createHash, randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { prisma } from "./db";

export const RESET_MINUTES = 60;

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

/**
 * The public address used in emailed links.
 * Set SITE_URL (e.g. https://www.truthpitch.com) in production. The request's own host is
 * only trusted in development: in production a forged Host header could otherwise
 * put someone else's domain in the reset email.
 */
export async function siteUrl(): Promise<string> {
  const fromEnv = process.env.SITE_URL?.trim().replace(/\/+$/, "");
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV === "production") return "https://www.truthpitch.com";
  const h = await headers();
  return `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host") ?? "localhost:3000"}`;
}

/** Creates a new reset token for this customer (earlier unused links stop working). */
export async function createResetToken(customerId: number): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  await prisma.passwordReset.deleteMany({ where: { customerId } });
  await prisma.passwordReset.create({
    data: { customerId, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + RESET_MINUTES * 60 * 1000) },
  });
  return token;
}

/** The reset row for a token, if it exists, is unused and hasn't expired. */
export async function findValidReset(token: unknown) {
  if (typeof token !== "string" || token.length < 20 || token.length > 100) return null;
  const row = await prisma.passwordReset.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!row || row.usedAt || row.expiresAt.getTime() < Date.now()) return null;
  return row;
}
