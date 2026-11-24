// Server side of the visitor statistics (admin → SEO & Traffic).
// Privacy by design: no IP addresses, names or e-mail addresses are stored. Only after consent.
import { prisma } from "./db";

/** Rough device / browser / system from the browser's user-agent text (nothing is stored raw). */
export function parseUserAgent(ua: string) {
  const s = ua.toLowerCase();
  const device = /ipad|tablet|(android(?!.*mobile))/.test(s) ? "Tablet" : /mobi|iphone|ipod|android/.test(s) ? "Mobile" : "Desktop";
  const browser = /edg\//.test(s)
    ? "Edge"
    : /opr\/|opera/.test(s)
      ? "Opera"
      : /samsungbrowser/.test(s)
        ? "Samsung Internet"
        : /firefox|fxios/.test(s)
          ? "Firefox"
          : /chrome|crios/.test(s)
            ? "Chrome"
            : /safari/.test(s)
              ? "Safari"
              : "Other";
  const os = /windows/.test(s)
    ? "Windows"
    : /iphone|ipad|ipod/.test(s)
      ? "iOS"
      : /android/.test(s)
        ? "Android"
        : /mac os x|macintosh/.test(s)
          ? "macOS"
          : /linux/.test(s)
            ? "Linux"
            : "Other";
  return { device, browser, os };
}

export const isBot = (ua: string) => !ua || /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse|pingdom|monitor/i.test(ua);

/** Country code from the hosting provider or CDN, when it adds one (e.g. Cloudflare). */
export function countryFromHeaders(h: Headers): string {
  const v = h.get("cf-ipcountry") || h.get("x-vercel-ip-country") || h.get("x-country-code") || h.get("x-geo-country") || "";
  return /^[A-Za-z]{2}$/.test(v) && v.toUpperCase() !== "XX" ? v.toUpperCase() : "";
}

/** "https://www.google.com/search?q=…" → "google.com"; own site and empty → "". */
export function referrerDomain(ref: string, ownHost: string): string {
  try {
    const host = new URL(ref).hostname.replace(/^www\./, "").toLowerCase();
    const own = ownHost.replace(/^www\./, "").replace(/:\d+$/, "").toLowerCase();
    return host && host !== own ? host.slice(0, 100) : "";
  } catch {
    return "";
  }
}

/** Where a time zone is, for display: "Europe/Amsterdam" → "Amsterdam, Europe". */
export function timeZoneLabel(tz: string): string {
  if (!tz) return "Unknown";
  const [region, ...rest] = tz.split("/");
  const city = (rest.pop() ?? region).replace(/_/g, " ");
  return rest.length || city !== region ? `${city}, ${region.replace(/_/g, " ")}` : city;
}

/** Statistics older than 13 months are deleted (now and then, while recording new visits). */
export async function cleanupOldStats() {
  const cutoff = new Date(Date.now() - 395 * 24 * 60 * 60 * 1000);
  await prisma.analyticsSession.deleteMany({ where: { lastSeenAt: { lt: cutoff } } });
  await prisma.consentEvent.deleteMany({ where: { createdAt: { lt: cutoff } } });
}
