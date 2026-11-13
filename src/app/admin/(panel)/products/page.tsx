import Link from "next/link";
import { PageTitle } from "@/components/admin/Card";
import { getProducts, isDemoMode } from "@/lib/catalog";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/format";

export default async function ProductsAdmin() {
  const [products, stories] = await Promise.all([getProducts().catch(() => []), prisma.productStory.findMany()]);
  const storyByHandle = new Map(stories.map((s) => [s.handle, s]));

  return (
    <>
      <PageTitle
        title="Products"
        description={
          isDemoMode()
            ? "Showing sample products (demo mode). Once Shopify is connected, your real products appear here."
            : "Products, prices and stock are managed in Shopify / Printful. Here you edit the “MORE INFO” story for each one."
        }
      />

      <div className="overflow-x-auto border border-neutral-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 text-xs uppercase tracking-wider text-neutral-500">
            <tr>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Story</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {products.map((p) => {
              const custom = storyByHandle.get(p.handle);
              const status = custom?.story.trim() ? "Custom" : p.defaultStory ? "Sample text" : "Empty";
              return (
                <tr key={p.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.featuredImage && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.featuredImage.url} alt="" className="h-12 w-10 bg-neutral-100 object-cover" />
                      )}
                      <div>
                        <p className="font-medium text-black">{p.title}</p>
                        <p className="text-xs text-neutral-500">{p.handle}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-neutral-700">{formatMoney(p.price)}</td>
                  <td className="px-4 py-3">
                    <span className={status === "Custom" ? "text-black" : "text-neutral-500"}>{status}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/products/${encodeURIComponent(p.handle)}`} className="text-sm underline underline-offset-4 hover:text-black">
                      Edit story
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {products.length === 0 && <p className="p-6 text-sm text-neutral-600">No products found. Check the Shopify connection on the dashboard.</p>}
      </div>
    </>
  );
}
