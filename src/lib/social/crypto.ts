// Encrypts social access tokens before they're stored (AES-256-GCM).
// The key is SOCIAL_TOKEN_KEY: 32 random bytes as 64 hex characters. Generate one with:
//   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
// Changing the key makes stored tokens unreadable: then simply reconnect the accounts.
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

function key(): Buffer {
  const hex = process.env.SOCIAL_TOKEN_KEY?.trim() ?? "";
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error("SOCIAL_TOKEN_KEY is missing or not 64 hex characters. See .env.example.");
  }
  return Buffer.from(hex, "hex");
}

export const isTokenKeyConfigured = () => /^[0-9a-fA-F]{64}$/.test(process.env.SOCIAL_TOKEN_KEY?.trim() ?? "");

/** "v1.<iv>.<tag>.<ciphertext>" (base64url parts). */
export function encryptToken(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return ["v1", iv, cipher.getAuthTag(), data].map((p) => (typeof p === "string" ? p : p.toString("base64url"))).join(".");
}

export function decryptToken(stored: string): string {
  const [v, iv, tag, data] = stored.split(".");
  if (v !== "v1" || !iv || !tag || !data) throw new Error("Stored token has an unknown format.");
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(data, "base64url")), decipher.final()]).toString("utf8");
}
