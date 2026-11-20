import { Card, PageTitle } from "@/components/admin/Card";
import { formatMoney } from "@/lib/format";
import { getRecentOrders, isShopifyAdminConfigured, type OrderSummary } from "@/lib/shopify/admin";

const humanize = (s: string | null) => (s ? s.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase()) : "—");

export default async function OrdersAdmin() {
  if (!isShopifyAdminConfigured()) {
    return (
      <>
        <PageTitle title="Orders" description="A read-only overview of recent Shopify orders." />
        <Card title="Not connected yet">
          <ol className="list-decimal space-y-2 pl-5 text-sm text-neutral-700">
            <li>
              In Shopify admin go to Settings → Apps → <strong>Develop apps</strong> and open the <strong>Dev Dashboard</strong> (signed in with the
              store owner&apos;s account).
            </li>
            <li>Apps → Create app → Start from Dev Dashboard. Give it a name, e.g. &quot;TruthPitch website&quot;.</li>
            <li>
              Under Versions, set Scopes to <code>read_orders</code> and click Release.
            </li>
            <li>Click Install app and pick your store.</li>
            <li>
              In the app&apos;s Settings, copy the <strong>Client ID</strong> and <strong>Client secret</strong>.
            </li>
            <li>
              Add them in Hostinger as <code>SHOPIFY_ADMIN_CLIENT_ID</code> and <code>SHOPIFY_ADMIN_CLIENT_SECRET</code>, then redeploy.
            </li>
          </ol>
          <p className="mt-4 text-sm text-neutral-600">
            Already have an older custom app with a token starting with <code>shpat_</code>? Put that in <code>SHOPIFY_ADMIN_ACCESS_TOKEN</code> instead.
          </p>
          <p className="mt-4 text-sm text-neutral-600">Until then, you can see every order in your Shopify admin.</p>
        </Card>
      </>
    );
  }

  let orders: OrderSummary[] = [];
  let error: string | null = null;
  try {
    orders = await getRecentOrders(25);
  } catch (e) {
    error = e instanceof Error ? e.message : "Could not load orders.";
  }

  return (
    <>
      <PageTitle title="Orders" description="Latest 25 orders from Shopify. Printful marks orders as fulfilled when they ship." />
      {error ? (
        <Card>
          <p className="text-sm text-neutral-700">{error}</p>
        </Card>
      ) : (
        <div className="overflow-x-auto border border-neutral-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-200 text-xs uppercase tracking-wider text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Items</th>
                <th className="px-4 py-3 font-medium">Payment</th>
                <th className="px-4 py-3 font-medium">Fulfillment</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className="px-4 py-3 font-medium text-black">{o.name}</td>
                  <td className="px-4 py-3 text-neutral-700">{new Date(o.createdAt).toLocaleDateString("en-US", { dateStyle: "medium" })}</td>
                  <td className="px-4 py-3 text-neutral-700">{o.itemCount}</td>
                  <td className="px-4 py-3 text-neutral-700">{humanize(o.financialStatus)}</td>
                  <td className="px-4 py-3 text-neutral-700">{humanize(o.fulfillmentStatus)}</td>
                  <td className="px-4 py-3 text-right text-black">{formatMoney(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {orders.length === 0 && <p className="p-6 text-sm text-neutral-600">No orders yet.</p>}
        </div>
      )}
    </>
  );
}
