// GET /api/health — quick diagnostics for the live server.
// Reports whether the database is reachable and set up, without exposing secrets.
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function clean(message: string): string {
  // Hide server home paths and keep it short.
  return message.replace(/\/home\/[^/\s]+/g, "~").replace(/\s+/g, " ").trim().slice(0, 400);
}

export async function GET() {
  const url = process.env.DATABASE_URL ?? "";
  const checks: Record<string, unknown> = {
    databaseUrlSet: Boolean(url),
    databaseUrlHasPlaceholder: url.includes("u123456789"),
    authConfigured: Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD && process.env.AUTH_SECRET),
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

  return Response.json({ ok, ...checks }, { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
