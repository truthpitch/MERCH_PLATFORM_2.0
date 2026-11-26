// POST /api/cron/publish-social: called every 5 minutes by a Hostinger cron job (see SETUP.md).
// Publishes social posts that are due and refreshes tokens that expire within 7 days.
// Protected by CRON_SECRET, sent as "Authorization: Bearer <secret>".
import { timingSafeEqual } from "node:crypto";
import { publishDue, refreshExpiringTokens } from "@/lib/social/engine";

export const dynamic = "force-dynamic";
// Instagram can take a while to process an image; give the run time to finish.
export const maxDuration = 300;

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim() ?? "";
  if (secret.length < 16) return false; // not configured (or too weak): refuse everything
  const given = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  const a = Buffer.from(given);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  if (!authorized(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const started = Date.now();
  const tokens = await refreshExpiringTokens();
  const posts = await publishDue();
  return Response.json({ ok: true, posts, tokens, ms: Date.now() - started }, { headers: { "Cache-Control": "no-store" } });
}
