import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { BAR_CLOSED_COOKIE } from "@/lib/announcement";
import { FavoritesProvider } from "@/components/favorites/FavoritesProvider";
import { MaintenancePage } from "@/components/MaintenancePage";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { isAdmin } from "@/lib/auth";
import { getCart } from "@/lib/cart";
import { getCustomerId } from "@/lib/customers";
import { getFavoriteHandles } from "@/lib/favorites";
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

  const [cart, customerId, favorites, jar] = await Promise.all([getCart(), getCustomerId(), getFavoriteHandles(), cookies()]);

  // Announcement bar: on, has content, not expired and not closed by this visitor.
  const endsAt = settings.announcementEndsAt;
  const ctaLabel = settings.announcementCtaUrl.trim() ? settings.announcementCtaLabel.trim() : "";
  const dismissKey = barKey(`${settings.announcementText}|${endsAt?.toISOString() ?? ""}|${ctaLabel}`);
  const showBar =
    settings.announcementEnabled &&
    Boolean(settings.announcementText.trim() || ctaLabel || endsAt) &&
    !(endsAt && endsAt.getTime() <= Date.now()) &&
    decodeURIComponent(jar.get(BAR_CLOSED_COOKIE)?.value ?? "") !== dismissKey;

  // .shop-root scopes dark mode to the storefront (see globals.css).
  return (
    <FavoritesProvider initial={favorites}>
      <div className="shop-root flex flex-1 flex-col bg-white text-neutral-900">
        {settings.maintenanceMode && (
          <div className="bg-neutral-200 px-4 py-2 text-center text-xs text-neutral-800">
            Maintenance mode is ON — visitors see the &ldquo;back soon&rdquo; page. Only you can see the store.{" "}
            <Link href="/admin" className="underline underline-offset-2">
              Control panel
            </Link>
          </div>
        )}
        {showBar && (
          <AnnouncementBar
            text={settings.announcementText.trim()}
            timerLabel={settings.announcementTimerLabel.trim()}
            endsAt={endsAt ? endsAt.toISOString() : null}
            ctaLabel={ctaLabel}
            ctaUrl={settings.announcementCtaUrl.trim()}
            dismissKey={dismissKey}
          />
        )}
        <SiteHeader cartCount={cart.totalQuantity} signedIn={customerId !== null} />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </div>
    </FavoritesProvider>
  );
}

/** Short fingerprint of the current offer, so a closed bar reappears when the offer changes. */
function barKey(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}
