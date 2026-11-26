// GET /admin/social/connect/instagram: sends the admin to Instagram to allow access.
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { instagramAuthorizeUrl, instagramAppConfig } from "@/lib/social/instagram";
import { accountsUrl, redirectUri, startOAuth } from "@/lib/social/oauth";

export const dynamic = "force-dynamic";

export async function GET() {
  await requireAdmin();
  if (!instagramAppConfig()) redirect(accountsUrl({ error: "Instagram isn't set up yet: add INSTAGRAM_APP_ID and INSTAGRAM_APP_SECRET (see SETUP.md)." }));
  const state = await startOAuth("INSTAGRAM");
  redirect(instagramAuthorizeUrl(redirectUri("INSTAGRAM"), state));
}
