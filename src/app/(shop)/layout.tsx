import type { Metadata } from "next";
import Link from "next/link";
import { MaintenancePage } from "@/components/MaintenancePage";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { isAdmin } from "@/lib/auth";
import { getCart } from "@/lib/cart";
import { getSettings } from "@/lib/settings";

// Content comes from the database and cookies, so always render on request.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  // Keep search engines from indexing the maintenance page.
  return settings.maintenanceMode ? { robots: { index: false, follow: false } } : {};
}

/**
 * Every public page renders inside this layout. When MAINTENANCE MODE is on,
 * visitors only ever see the maintenance page. A logged-in admin still sees
 * the real store (with a notice) so they can check changes before reopening.
 * The /admin area lives outside this layout and is never blocked.
 */
export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const [settings, admin] = await Promise.all([getSettings(), isAdmin()]);

  if (settings.maintenanceMode && !admin) {
    return (
      <div className="shop-root flex flex-1 flex-col bg-white">
        <MaintenancePage message={settings.maintenanceMessage} />
      </div>
    );
  }

  const cart = await getCart();

  // .shop-root scopes dark mode to the storefront (see globals.css).
  return (
    <div className="shop-root flex flex-1 flex-col bg-white text-neutral-900">
      {settings.maintenanceMode && (
        <div className="bg-neutral-200 px-4 py-2 text-center text-xs text-neutral-800">
          Maintenance mode is ON — visitors see the &ldquo;back soon&rdquo; page. Only you can see the store.{" "}
          <Link href="/admin" className="underline underline-offset-2">
            Control panel
          </Link>
        </div>
      )}
      {settings.announcementEnabled && settings.announcementText.trim() && (
        <div className="bg-black px-4 py-2 text-center text-xs tracking-wide text-white">{settings.announcementText}</div>
      )}
      <SiteHeader cartCount={cart.totalQuantity} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
