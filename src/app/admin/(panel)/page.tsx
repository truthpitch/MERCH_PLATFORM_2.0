import Link from "next/link";
import { Card, PageTitle, SavedNotice } from "@/components/admin/Card";
import { inputClass } from "@/components/admin/styles";
import { SubmitButton } from "@/components/admin/ui";
import { getProducts, isDemoMode } from "@/lib/catalog";
import { prisma } from "@/lib/db";
import { isPrintfulConfigured } from "@/lib/printful";
import { getSettings } from "@/lib/settings";
import { isShopifyAdminConfigured } from "@/lib/shopify/admin";
import { saveMaintenanceMessageAction, setMaintenanceAction } from "../actions";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const [settings, products, featuredCount, storyCount, unreadCount, sp] = await Promise.all([
    getSettings(),
    getProducts().catch(() => []),
    prisma.featuredProduct.count(),
    prisma.productStory.count({ where: { story: { not: "" } } }),
    prisma.contactMessage.count({ where: { read: false } }),
    searchParams,
  ]);
  const on = settings.maintenanceMode;

  return (
    <>
      <PageTitle title="Dashboard" description="Everything you need to run the shop." />
      <SavedNotice show={sp.saved === "1"} />

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

        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: "Products", value: products.length, href: "/admin/products" },
            { label: "Featured", value: featuredCount || "Auto", href: "/admin/homepage#featured" },
            { label: "Custom stories", value: storyCount, href: "/admin/products" },
            { label: "Unread messages", value: unreadCount, href: "/admin/messages" },
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
              offText="Optional — add SHOPIFY_ADMIN_ACCESS_TOKEN to .env"
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
