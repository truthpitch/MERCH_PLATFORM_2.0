import Link from "next/link";
import { Card, PageTitle, SavedNotice } from "@/components/admin/Card";
import { inputClass } from "@/components/admin/styles";
import { SubmitButton } from "@/components/admin/ui";
import { getProducts, isDemoMode } from "@/lib/catalog";
import { prisma } from "@/lib/db";
import { countPendingReviews } from "@/lib/reviews";
import { countPendingComments } from "@/lib/blog-comments";
import { isPrintfulConfigured } from "@/lib/printful";
import { getSettings } from "@/lib/settings";
import { isShopifyAdminConfigured } from "@/lib/shopify/admin";
import { removeFaviconAction, saveMaintenanceMessageAction, saveOrderingPauseAction, setMaintenanceAction, setOrderingPausedAction } from "../actions";
import { DateTimeField } from "@/components/admin/DateTimeField";
import { formatResumeTime, orderingState } from "@/lib/ordering";

const ORDERING_MESSAGES: Record<string, string> = {
  paused: "Ordering is paused. Visitors can still browse, but can't add to cart or check out.",
  open: "Ordering is open again.",
  saved: "Message and time saved.",
};

const FAVICON_MESSAGES: Record<string, string> = {
  saved: "Favicon saved. Browsers can take a moment to show the new icon; reload the tab if you still see the old one.",
  removed: "Favicon removed.",
  missing: "Choose a file first.",
  type: "That file isn't a PNG, ICO, JPG, WebP or GIF image.",
  size: "That file is too large. The maximum is 1 MB.",
};

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ saved?: string; favicon?: string; ordering?: string }> }) {
  const [settings, products, featuredCount, storyCount, mediaCount, sp, pendingReviews, pendingReplies] = await Promise.all([
    getSettings(),
    getProducts().catch(() => []),
    prisma.featuredProduct.count(),
    prisma.productStory.count({ where: { story: { not: "" } } }),
    prisma.media.count(),
    searchParams,
    countPendingReviews(),
    countPendingComments(),
  ]);
  const on = settings.maintenanceMode;
  const ordering = orderingState(settings);

  return (
    <>
      <PageTitle title="Dashboard" description="Everything you need to run the shop." />
      <SavedNotice show={sp.saved === "1"} />
      {pendingReviews > 0 && (
        <Link
          href="/admin/reviews?status=pending"
          className="mb-6 flex items-center justify-between gap-4 border border-black bg-white px-5 py-4 text-sm text-black hover:bg-neutral-50"
        >
          <span>
            <strong>
              {pendingReviews} {pendingReviews === 1 ? "review is" : "reviews are"} waiting for approval.
            </strong>{" "}
            They&apos;re not on the website until you approve them.
          </span>
          <span className="shrink-0 font-medium underline underline-offset-4">Check reviews →</span>
        </Link>
      )}
      {pendingReplies > 0 && (
        <Link
          href="/admin/replies?status=pending"
          className="mb-6 flex items-center justify-between gap-4 border border-black bg-white px-5 py-4 text-sm text-black hover:bg-neutral-50"
        >
          <span>
            <strong>
              {pendingReplies} blog {pendingReplies === 1 ? "reply is" : "replies are"} waiting for approval.
            </strong>{" "}
            They&apos;re not on the website until you approve them.
          </span>
          <span className="shrink-0 font-medium underline underline-offset-4">Check replies →</span>
        </Link>
      )}

      <div className="grid gap-6">
        {/* Maintenance switch */}
        <Card title="Maintenance mode">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-2xl font-semibold text-black">{on ? "ON — store is hidden" : "OFF — store is live"}</p>
              <p className="mt-1 text-sm text-neutral-600">
                {on
                  ? "Visitors see the “We’ll be back soon” page. You can still browse the store while logged in."
                  : "Turn on to show visitors a “We’ll be back soon” page while you make changes."}
              </p>
            </div>
            <form action={setMaintenanceAction}>
              <input type="hidden" name="on" value={on ? "0" : "1"} />
              <button
                className={`min-w-48 px-5 py-3 text-sm font-medium ${on ? "border border-black bg-white text-black hover:bg-neutral-100" : "bg-black text-white hover:bg-neutral-800"}`}
              >
                {on ? "Turn maintenance OFF" : "Turn maintenance ON"}
              </button>
            </form>
          </div>
          <form action={saveMaintenanceMessageAction} className="mt-6 flex flex-col gap-3 border-t border-neutral-200 pt-6 sm:flex-row sm:items-end">
            <label className="flex-1">
              <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-neutral-600">Maintenance message</span>
              <input name="maintenanceMessage" defaultValue={settings.maintenanceMessage} className={inputClass} />
            </label>
            <SubmitButton variant="secondary">Save message</SubmitButton>
          </form>
        </Card>

        {/* Ordering pause */}
        <div id="ordering" className="scroll-mt-6">
          <Card title="Ordering">
            {sp.ordering && ORDERING_MESSAGES[sp.ordering] && (
              <p role="status" className="mb-5 border border-neutral-300 bg-neutral-100 px-4 py-3 text-sm text-neutral-800">
                {ORDERING_MESSAGES[sp.ordering]}
              </p>
            )}
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-2xl font-semibold text-black">{ordering.paused ? "PAUSED — no new orders" : "OPEN — customers can order"}</p>
                <p className="mt-1 text-sm text-neutral-600">
                  {ordering.paused
                    ? ordering.until
                      ? `Opens again by itself on ${formatResumeTime(ordering.until)} (Amsterdam time).`
                      : "Stays paused until you turn ordering back on."
                    : "Pause ordering while you change products or prices, or when you're away. The shop stays open for browsing and favorites; adding to cart and checkout are switched off."}
                </p>
              </div>
              <form action={setOrderingPausedAction}>
                <input type="hidden" name="on" value={ordering.paused ? "0" : "1"} />
                <button
                  className={`min-w-48 px-5 py-3 text-sm font-medium ${
                    ordering.paused ? "bg-black text-white hover:bg-neutral-800" : "border border-black bg-white text-black hover:bg-neutral-100"
                  }`}
                >
                  {ordering.paused ? "Turn ordering back ON" : "Pause ordering"}
                </button>
              </form>
            </div>
            {settings.orderingPaused && !ordering.paused && (
              <p className="mt-4 text-sm text-neutral-600">The end time has passed, so ordering is open again. Pause again with the button above.</p>
            )}
            <form action={saveOrderingPauseAction} className="mt-6 grid gap-4 border-t border-neutral-200 pt-6 md:grid-cols-[1fr_18rem] md:items-start">
              <label className="block">
                <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-neutral-600">Message for visitors</span>
                <input name="orderingPauseMessage" defaultValue={settings.orderingPauseMessage} maxLength={300} className={inputClass} />
                <span className="mt-1 block text-xs text-neutral-500">Shown in a bar on every page, on product pages and in the cart while ordering is paused.</span>
              </label>
              <div>
                <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-neutral-600">Open again automatically (optional)</span>
                <DateTimeField
                  id="orderingPausedUntil"
                  name="orderingPausedUntil"
                  defaultIso={settings.orderingPausedUntil?.toISOString() ?? null}
                  help="Empty = stays paused until you turn it back on."
                />
              </div>
              <div className="md:col-span-2">
                <SubmitButton variant="secondary">Save message and time</SubmitButton>
              </div>
            </form>
            <p className="mt-5 text-xs text-neutral-500">
              Tip: a customer who already opened Shopify&apos;s checkout before you paused can still finish that order. For a complete stop, also set your store in
              Printful to hold new orders for manual approval instead of fulfilling them automatically.
            </p>
          </Card>
        </div>

        {/* Favicon */}
        <div id="favicon" className="scroll-mt-6">
          <Card title="Favicon">
            {sp.favicon && FAVICON_MESSAGES[sp.favicon] && (
              <p role="status" className="mb-5 border border-neutral-300 bg-neutral-100 px-4 py-3 text-sm text-neutral-800">
                {FAVICON_MESSAGES[sp.favicon]}
              </p>
            )}
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              {/* Preview at the sizes a browser tab and a phone home screen use */}
              <div className="flex shrink-0 items-end gap-4">
                {settings.faviconUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={settings.faviconUrl} alt="Current favicon" width={64} height={64} className="h-16 w-16 border border-neutral-200 object-contain p-1" />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={settings.faviconUrl} alt="" width={16} height={16} className="h-4 w-4 object-contain" />
                  </>
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center border border-dashed border-neutral-300 text-xs text-neutral-400">None</div>
                )}
              </div>
              <div className="flex-1 text-sm text-neutral-600">
                <p>The small icon in the browser tab and in bookmarks.</p>
                <p className="mt-1">Use a square PNG or ICO (at least 64×64, ideally 512×512). JPG, WebP and GIF also work. Max 1 MB.</p>
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-3 border-t border-neutral-200 pt-6 sm:flex-row sm:items-center">
              <form action="/admin/favicon" method="post" encType="multipart/form-data" className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  type="file"
                  name="file"
                  required
                  accept="image/png,image/x-icon,image/vnd.microsoft.icon,.ico,image/jpeg,image/webp,image/gif"
                  aria-label="Favicon file"
                  className="min-w-0 flex-1 text-sm text-neutral-700 file:mr-3 file:border file:border-neutral-300 file:bg-white file:px-3 file:py-2 file:text-sm file:text-black hover:file:border-black"
                />
                <SubmitButton>{settings.faviconUrl ? "Replace favicon" : "Upload favicon"}</SubmitButton>
              </form>
              {settings.faviconUrl && (
                <form action={removeFaviconAction}>
                  <SubmitButton variant="secondary">Remove</SubmitButton>
                </form>
              )}
            </div>
          </Card>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: "Products", value: products.length, href: "/admin/products" },
            { label: "Featured", value: featuredCount || "Auto", href: "/admin/homepage#featured" },
            { label: "Custom stories", value: storyCount, href: "/admin/products" },
            { label: "Images", value: mediaCount, href: "/admin/media" },
          ].map((s) => (
            <Link key={s.label} href={s.href} className="border border-neutral-200 bg-white p-5 hover:border-black">
              <p className="text-xs uppercase tracking-wider text-neutral-500">{s.label}</p>
              <p className="mt-2 text-2xl font-semibold text-black">{s.value}</p>
            </Link>
          ))}
        </div>

        {/* Connections */}
        <Card title="Connections">
          <ul className="divide-y divide-neutral-200 text-sm">
            <Status
              label="Shopify — products & checkout"
              ok={!isDemoMode()}
              okText="Connected"
              offText="Demo mode — add SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_ACCESS_TOKEN to .env"
            />
            <Status
              label="Shopify — order overview"
              ok={isShopifyAdminConfigured()}
              okText="Connected"
              offText="Optional — see the Orders tab for setup"
            />
            <Status
              label="Printful — fulfillment"
              ok
              okText={isPrintfulConfigured() ? "Via Shopify app · API key set" : "Handled by the Printful app inside Shopify"}
              offText=""
            />
          </ul>
        </Card>
      </div>
    </>
  );
}

function Status({ label, ok, okText, offText }: { label: string; ok: boolean; okText: string; offText: string }) {
  return (
    <li className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
      <span className="font-medium text-black">{label}</span>
      <span className={`flex items-center gap-2 ${ok ? "text-black" : "text-neutral-500"}`}>
        <span className={`inline-block h-2 w-2 rounded-full ${ok ? "bg-black" : "border border-neutral-400"}`} />
        {ok ? okText : offText}
      </span>
    </li>
  );
}
