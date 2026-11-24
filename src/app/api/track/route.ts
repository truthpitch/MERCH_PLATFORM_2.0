// Records page views and time on page for admin → SEO & Traffic.
// Refuses anything unless the visitor accepted analytics cookies. Admin visits and bots are skipped.
import { cleanupOldStats, countryFromHeaders, isBot, parseUserAgent, referrerDomain } from "@/lib/analytics";
import { isAdmin } from "@/lib/auth";
import { readConsent } from "@/lib/consent";
import { prisma } from "@/lib/db";
import { isRateLimited } from "@/lib/rate-limit";

const ok = (body: object = {}) => Response.json(body, { headers: { "Cache-Control": "no-store" } });
const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");
const ID = /^[a-zA-Z0-9-]{8,64}$/;

export async function POST(request: Request) {
  if (readConsent(request.headers.get("cookie")) !== "accepted") return ok({ skipped: "no consent" });
  const ua = request.headers.get("user-agent") ?? "";
  if (isBot(ua)) return ok({ skipped: "bot" });
  if (await isAdmin()) return ok({ skipped: "admin" });
  // Against spam: at most 300 requests per 15 minutes per visitor connection.
  if (await isRateLimited("track", 300, 15 * 60 * 1000)) return ok({ skipped: "rate limit" });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return ok({ skipped: "bad request" });
  }
  const sid = str(body.sid, 64);
  if (!ID.test(sid)) return ok({ skipped: "bad id" });

  // Leaving a page: store how long it was looked at (max 30 minutes, never less than before).
  if (body.t === "leave") {
    const pv = Number(body.pv);
    const ms = Math.min(Math.max(Number(body.ms) || 0, 0), 30 * 60 * 1000);
    if (Number.isInteger(pv)) {
      await prisma.analyticsPageView.updateMany({ where: { id: pv, sessionId: sid, durationMs: { lt: ms } }, data: { durationMs: ms } });
      await prisma.analyticsSession.updateMany({ where: { id: sid }, data: { lastSeenAt: new Date() } });
    }
    return ok();
  }

  if (body.t !== "view") return ok({ skipped: "unknown" });
  const vid = str(body.vid, 64);
  const path = str(body.path, 300);
  if (!ID.test(vid) || !path.startsWith("/")) return ok({ skipped: "bad data" });

  const host = request.headers.get("host") ?? "";
  const { device, browser, os } = parseUserAgent(ua);
  const now = new Date();
  await prisma.analyticsSession.upsert({
    where: { id: sid },
    update: { lastSeenAt: now },
    create: {
      id: sid,
      visitorId: vid,
      landingPath: path,
      referrer: referrerDomain(str(body.ref, 500), host),
      utmSource: str(body.utm_source, 100),
      utmMedium: str(body.utm_medium, 100),
      utmCampaign: str(body.utm_campaign, 100),
      device,
      browser,
      os,
      country: countryFromHeaders(request.headers),
      timeZone: str(body.tz, 60),
      language: str(body.lang, 20),
    },
  });
  const view = await prisma.analyticsPageView.create({ data: { sessionId: sid, path, title: str(body.title, 200) } });

  if (Math.random() < 0.01) await cleanupOldStats().catch(() => undefined);
  return ok({ pv: view.id });
}
