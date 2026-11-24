// Counts cookie banner choices (just "accepted" or "rejected" and the time, nothing personal),
// so admin → SEO & Traffic can show how many visitors agree to analytics.
import { isBot } from "@/lib/analytics";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  if (isBot(request.headers.get("user-agent") ?? "")) return Response.json({ ok: true });
  const body = (await request.json().catch(() => ({}))) as { choice?: string };
  if (body.choice === "accepted" || body.choice === "rejected") await prisma.consentEvent.create({ data: { choice: body.choice } });
  return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
