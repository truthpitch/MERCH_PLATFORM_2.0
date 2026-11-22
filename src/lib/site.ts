// The site's public address, used for SEO: canonical links, sitemap, link previews, RSS.
// Set SITE_URL in production if the shop ever moves to another domain.

export const SITE_NAME = "TruthPitch";

export function publicSiteUrl(): string {
  const fromEnv = process.env.SITE_URL?.trim().replace(/\/+$/, "");
  if (fromEnv) return fromEnv;
  return process.env.NODE_ENV === "production" ? "https://www.truthpitch.com" : "http://localhost:3000";
}

/** "/blog/my-post" → "https://www.truthpitch.com/blog/my-post" (absolute URLs are kept). */
export function absoluteUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${publicSiteUrl()}${path.startsWith("/") ? "" : "/"}${path}`;
}
