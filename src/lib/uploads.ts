import { unlink } from "node:fs/promises";
import path from "node:path";

/** Folder for admin uploads. Set UPLOAD_DIR in production to a path outside the app folder. */
export function getUploadDir(): string {
  return process.env.UPLOAD_DIR?.trim() || path.join(process.cwd(), "uploads");
}

export const ALLOWED_UPLOAD_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

export const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  ico: "image/x-icon",
};

/** Only allow names we generated ourselves: no slashes, no dot-dot. */
export function isSafeFilename(name: string): boolean {
  return /^[a-zA-Z0-9_-]+\.(jpg|png|webp|gif|ico)$/.test(name);
}

// ── Favicon ────────────────────────────────────────────────

export const MAX_FAVICON_BYTES = 1024 * 1024; // 1 MB

/**
 * Works out the favicon's real format from its first bytes (not from the name or the
 * browser-reported type, which can be wrong or faked). Returns the extension, or null.
 * SVG is left out on purpose: an SVG can carry scripts.
 */
export function detectFaviconType(bytes: Uint8Array): "png" | "ico" | "jpg" | "webp" | "gif" | null {
  const starts = (...sig: number[]) => sig.every((b, i) => bytes[i] === b);
  if (starts(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "png";
  if (starts(0x00, 0x00, 0x01, 0x00)) return "ico";
  if (starts(0xff, 0xd8, 0xff)) return "jpg";
  if (starts(0x47, 0x49, 0x46, 0x38)) return "gif";
  if (starts(0x52, 0x49, 0x46, 0x46) && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return "webp";
  return null;
}

/** Deletes an old favicon file we uploaded ourselves; ignores anything else. */
export async function removeFaviconFile(url: string) {
  const name = url.startsWith("/media/favicon-") ? url.slice("/media/".length) : "";
  if (name && isSafeFilename(name)) await unlink(path.join(getUploadDir(), name)).catch(() => undefined);
}
