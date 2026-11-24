import Link from "next/link";
import { Card, PageTitle, SavedNotice } from "@/components/admin/Card";
import { inputClass, smallButtonClass } from "@/components/admin/styles";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { SubmitButton } from "@/components/admin/ui";
import { getProducts, isDemoMode } from "@/lib/catalog";
import { CATEGORIES, explainCategory } from "@/lib/categories";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { getSettings } from "@/lib/settings";
import { saveProductCategoryAction, saveShippingReturnsAction } from "../../actions";

export default async function ProductsAdmin({ searchParams }: { searchParams: Promise<{ saved?: string; shipping?: string }> }) {
  const [products, stories, sp, settings, guideCount] = await Promise.all([
    getProducts().catch(() => []),
    prisma.productStory.findMany(),
    searchParams,
    getSettings(),
    prisma.sizeGuide.count(),
  ]);
  const storyByHandle = new Map(stories.map((s) => [s.handle, s]));
  const overrides = new Map(stories.filter((s) => s.category).map((s) => [s.handle, s.category]));
  const savedTitle = sp.saved ? products.find((p) => p.handle === sp.saved)?.title : undefined;

  return (
    <>
      <PageTitle
        title="Products"
        description={
          isDemoMode()
            ? "Showing sample products (demo mode). Once Shopify is connected, your real products appear here."
            : "Products, prices and stock are managed in Shopify / Printful. Here you set each product's shop category and edit its “MORE INFO” story."
        }
      />
      <SavedNotice show={Boolean(savedTitle)}>Category saved for {savedTitle}.</SavedNotice>
      <SavedNotice show={sp.shipping === "saved"}>Shipping &amp; returns text saved.</SavedNotice>

      <div className="mb-6 grid gap-6 md:grid-cols-[2fr_1fr]">
        <div id="shipping" className="scroll-mt-6">
          <Card title="Shipping & returns">
            <form action={saveShippingReturnsAction} className="space-y-3">
              <RichTextEditor name="shippingReturnsText" label="Shipping and returns text" defaultValue={settings.shippingReturnsText} minHeight={200} />
              <p className="text-xs text-neutral-500">Shown in a fold-out section on every product page. Empty = hidden.</p>
              <SubmitButton>Save</SubmitButton>
            </form>
          </Card>
        </div>
        <Card title="Size guides">
          <p className="text-sm text-neutral-600">
            One size table per category (T-shirts, Hoodies …). Products in that category get a <strong>Size guide</strong> link next to the sizes.
          </p>
          <Link href="/admin/size-guides" className="mt-4 inline-block bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800">
            Edit size guides
          </Link>
          <p className="mt-3 text-xs text-neutral-500">
            {guideCount === 0 ? "No size guides yet." : `${guideCount} ${guideCount === 1 ? "category has" : "categories have"} a size guide.`}
          </p>
        </Card>
      </div>

      <div className="overflow-x-auto border border-neutral-200 bg-white">
        <table className="w-full min-w-[48rem] text-left text-sm">
          <thead className="border-b border-neutral-200 text-xs uppercase tracking-wider text-neutral-500">
            <tr>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Story</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {products.map((p) => {
              const custom = storyByHandle.get(p.handle);
              const status = custom?.story.trim() ? "Custom" : p.defaultStory ? "Sample text" : "Empty";
              const chosen = overrides.get(p.handle) ?? "";
              const auto = explainCategory(p); // what it would be without a hand-picked category
              return (
                <tr key={p.id} className="align-top">
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
                    <form action={saveProductCategoryAction} className="flex items-center gap-2">
                      <input type="hidden" name="handle" value={p.handle} />
                      <select
                        name="category"
                        defaultValue={chosen}
                        aria-label={`Category for ${p.title}`}
                        className="max-w-[13rem] border border-neutral-300 bg-white px-2 py-1.5 text-sm text-black outline-none focus:border-black"
                      >
                        <option value="">Automatic{auto.category ? ` (${auto.category.label})` : " (none)"}</option>
                        {CATEGORIES.map((c) => (
                          <option key={c.slug} value={c.slug}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                      <button className={smallButtonClass}>Save</button>
                    </form>
                    <p className="mt-1.5 max-w-[17rem] text-xs text-neutral-500">
                      {chosen ? "Chosen by hand." : `Automatic, from ${auto.reason.charAt(0).toLowerCase()}${auto.reason.slice(1)}`}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={status === "Custom" ? "text-black" : "text-neutral-500"}>{status}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/products/${encodeURIComponent(p.handle)}`} className="whitespace-nowrap text-sm underline underline-offset-4 hover:text-black">
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
