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

/**
 * Google Search Console ownership code for https://www.truthpitch.com (property type: URL prefix).
 * Always in the page head, so the site stays verified; a code saved in admin → SEO & Traffic wins.
 * Not secret: Google requires it to be publicly visible in the page source.
 */
export const GOOGLE_SITE_VERIFICATION = "ZZDGKRPuyt7L5IuPALD6qae2B-EN_yU84QBpCPDlVKE";
