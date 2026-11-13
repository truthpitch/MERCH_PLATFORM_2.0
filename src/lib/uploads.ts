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
};

/** Only allow names we generated ourselves: no slashes, no dot-dot. */
export function isSafeFilename(name: string): boolean {
  return /^[a-zA-Z0-9_-]+\.(jpg|png|webp|gif)$/.test(name);
}
