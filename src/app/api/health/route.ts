// GET /api/health — quick diagnostics for the live server.
// Reports whether the database is reachable and set up, without exposing secrets.
import { prisma } from "@/lib/db";
import { describeMailError, isMailConfigured, verifyMailLogin } from "@/lib/mail";

export const dynamic = "force-dynamic";

function clean(message: string): string {
  // Hide server home paths and keep it short.
  return message.replace(/\/home\/[^/\s]+/g, "~").replace(/\s+/g, " ").trim().slice(0, 400);
}

// /api/health?mail=1 also tests the mail login. The result is cached for a minute so the
// mail server is not hammered if someone refreshes the page a lot.
let mailCheckCache: { at: number; result: unknown } | null = null;

async function checkMail() {
  if (mailCheckCache && Date.now() - mailCheckCache.at < 60_000) return mailCheckCache.result;
  let result: unknown;
  try {
    await verifyMailLogin();
    result = "ok";
  } catch (err) {
    result = { error: describeMailError(err) };
  }
  mailCheckCache = { at: Date.now(), result };
  return result;
}

export async function GET(request: Request) {
  const url = process.env.DATABASE_URL ?? "";
  const checks: Record<string, unknown> = {
    databaseUrlSet: Boolean(url),
    databaseUrlHasPlaceholder: url.includes("u123456789"),
    authConfigured: Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD && process.env.AUTH_SECRET),
    mailConfigured: isMailConfigured(),
    shopifyConfigured: Boolean(process.env.SHOPIFY_STORE_DOMAIN && process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN),
  };

  let ok = false;
  try {
    await prisma.siteSettings.count();
    checks.database = "ok";
    ok = true;
  } catch (err) {
    const e = err as { code?: string; message?: string };
    checks.database = "error";
    checks.databaseErrorCode = e.code ?? null;
    checks.databaseError = clean(e.message ?? String(err));
  }

  if (new URL(request.url).searchParams.get("mail") === "1" && isMailConfigured()) {
    checks.mailLogin = await checkMail();
  }

  return Response.json({ ok, ...checks }, { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
