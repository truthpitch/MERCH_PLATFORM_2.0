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

export async function composerProducts(): Promise<ComposerProduct[]> {
  const products = await getProducts().catch(() => []);
  return products.map((p) => ({
    handle: p.handle,
    title: p.title,
    image: p.featuredImage?.url ?? p.images[0]?.url ?? null,
    url: absoluteUrl(`/products/${p.handle}`),
  }));
}
