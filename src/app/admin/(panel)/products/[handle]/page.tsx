import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, SavedNotice } from "@/components/admin/Card";
import { inputClass, labelClass } from "@/components/admin/styles";
import { SubmitButton } from "@/components/admin/ui";
import { getProduct } from "@/lib/catalog";
import { prisma } from "@/lib/db";
import { saveStoryAction } from "../../../actions";

type Props = { params: Promise<{ handle: string }>; searchParams: Promise<{ saved?: string }> };

export default async function EditStoryPage({ params, searchParams }: Props) {
  const { handle } = await params;
  const [product, row, sp] = await Promise.all([
    getProduct(decodeURIComponent(handle)),
    prisma.productStory.findUnique({ where: { handle: decodeURIComponent(handle) } }),
    searchParams,
  ]);
  if (!product) notFound();

  const story = row?.story ?? product.defaultStory ?? "";
  const imageUrl = row?.imageUrl ?? "";

  return (
    <>
      <Link href="/admin/products" className="text-sm text-neutral-600 hover:text-black">
        ← All products
      </Link>
      <div className="mt-4 mb-8 flex items-center gap-4">
        {product.featuredImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.featuredImage.url} alt="" className="h-20 w-16 bg-neutral-100 object-cover" />
        )}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-black">{product.title}</h1>
          <Link href={`/products/${product.handle}`} target="_blank" className="text-sm text-neutral-600 underline underline-offset-4 hover:text-black">
            View product page
          </Link>
        </div>
      </div>
      <SavedNotice show={sp.saved === "1"}>Story saved — it&apos;s live on the product page.</SavedNotice>

      <form action={saveStoryAction}>
        <input type="hidden" name="handle" value={product.handle} />
        <Card title="“More info” story">
          <div className="grid gap-4">
            <div>
              <label className={labelClass} htmlFor="story">
                Story
              </label>
              <textarea id="story" name="story" defaultValue={story} rows={12} className={inputClass} placeholder="The story behind this product…" />
              <p className="mt-1 text-xs text-neutral-500">Leave a blank line between paragraphs. Leave empty to hide the section.</p>
            </div>
            <div>
              <label className={labelClass} htmlFor="imageUrl">
                Story image URL (optional)
              </label>
              <input id="imageUrl" name="imageUrl" defaultValue={imageUrl} placeholder="/media/… or https://…" className={inputClass} />
            </div>
            <div>
              <SubmitButton>Save story</SubmitButton>
            </div>
          </div>
        </Card>
      </form>
    </>
  );
}
