// Data the social admin pages need (accounts for the composer, products to start from).
import { getProducts } from "@/lib/catalog";
import { prisma } from "@/lib/db";
import { absoluteUrl } from "@/lib/site";
import { accountState } from "./engine";
import { isPlatform } from "./types";
import type { ComposerAccount, ComposerProduct } from "@/components/admin/SocialComposer";

export async function composerAccounts(): Promise<ComposerAccount[]> {
  const rows = await prisma.socialAccount.findMany({ orderBy: [{ platform: "asc" }, { createdAt: "asc" }] });
  return rows.flatMap((a) =>
    isPlatform(a.platform) ? [{ id: a.id, platform: a.platform, username: a.username, state: accountState(a.expiresAt) }] : [],
  );
}

/**
 * Instagram only accepts JPEG. Shopify's image CDN can convert on the fly, so ask it for a
 * JPEG at most 1440 px wide (Instagram's maximum width). Other addresses are left alone.
 */
function jpegImage(url: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (!u.hostname.endsWith("cdn.shopify.com")) return url;
    u.searchParams.set("format", "jpg");
    u.searchParams.set("width", "1440");
    return u.toString();
  } catch {
    return url;
  }
}

export async function composerProducts(): Promise<ComposerProduct[]> {
  const products = await getProducts().catch(() => []);
  return products.map((p) => ({
    handle: p.handle,
    title: p.title,
    image: jpegImage(p.featuredImage?.url ?? p.images[0]?.url ?? null),
    url: absoluteUrl(`/products/${p.handle}`),
  }));
}
