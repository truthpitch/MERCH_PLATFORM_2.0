import Link from "next/link";
import { Card, PageTitle, SavedNotice } from "@/components/admin/Card";
import { inputClass } from "@/components/admin/styles";
import { SubmitButton } from "@/components/admin/ui";
import { SizeTable } from "@/components/SizeTable";
import { CATEGORIES } from "@/lib/categories";
import { prisma } from "@/lib/db";
import { parseSizeTable } from "@/lib/size-guides";
import { saveSizeGuideAction } from "../../actions";

const EXAMPLE = `Size | Chest (cm) | Length (cm) | Sleeve (cm)
S | 96 | 71 | 20
M | 102 | 74 | 21
Measurements are of the garment laid flat.`;

// Clothing categories come first: they're the ones that usually need a size guide.
const APPAREL = new Set(["t-shirts", "hoodies-sweatshirts", "hats-caps", "beanies", "socks"]);

export default async function SizeGuidesAdmin({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const [rows, sp] = await Promise.all([prisma.sizeGuide.findMany(), searchParams]);
  const byCategory = new Map(rows.map((r) => [r.category, r.content]));
  const ordered = [...CATEGORIES].sort((a, b) => Number(APPAREL.has(b.slug)) - Number(APPAREL.has(a.slug)));
  const saved = CATEGORIES.find((c) => c.slug === sp.saved);

  return (
    <>
      <p className="mb-2 text-sm">
        <Link href="/admin/products" className="text-neutral-600 underline underline-offset-4 hover:text-black">
          ← Products
        </Link>
      </p>
      <PageTitle
        title="Size guides"
        description="One size table per category. It appears as a “Size guide” section on the product pages of that category, with a link next to the sizes."
      />
      <SavedNotice show={Boolean(saved)}>Size guide for {saved?.label} saved.</SavedNotice>

      <Card title="How to fill it in">
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-neutral-700">
          <li>
            The easiest way: open the product in <strong>Printful</strong>, copy its size table (or type it in a spreadsheet) and paste it here.
          </li>
          <li>
            Or type it yourself: one row per line, columns separated by <code>|</code>. The first row holds the column headings.
          </li>
          <li>Lines without a separator are shown as a note under the table. Leave the box empty to hide the size guide.</li>
        </ul>
        <pre className="mt-4 overflow-x-auto bg-neutral-50 p-3 text-xs text-neutral-700">{EXAMPLE}</pre>
        <p className="mt-2 text-xs text-neutral-500">These example numbers are only to show the format. Use the real measurements of your products.</p>
      </Card>

      <div className="mt-6 grid gap-4">
        {ordered.map((c) => {
          const content = byCategory.get(c.slug) ?? "";
          const table = content ? parseSizeTable(content) : null;
          return (
            <details key={c.slug} id={c.slug} open={sp.saved === c.slug} className="group scroll-mt-6 border border-neutral-200 bg-white">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-4 [&::-webkit-details-marker]:hidden">
                <span className="text-sm font-semibold uppercase tracking-wider text-black">{c.label}</span>
                <span className="flex items-center gap-3 text-xs text-neutral-500">
                  {table ? (
                    <span className="flex items-center gap-1.5 text-black">
                      <span className="inline-block h-2 w-2 rounded-full bg-black" aria-hidden />
                      Filled in
                    </span>
                  ) : (
                    "No size guide"
                  )}
                  <span className="text-lg font-light leading-none text-black transition-transform group-open:rotate-45" aria-hidden>
                    +
                  </span>
                </span>
              </summary>
              <div className="grid gap-6 border-t border-neutral-200 p-6 lg:grid-cols-2">
                <form action={saveSizeGuideAction} className="space-y-3">
                  <input type="hidden" name="category" value={c.slug} />
                  <label htmlFor={`guide-${c.slug}`} className="sr-only">
                    Size guide for {c.label}
                  </label>
                  <textarea
                    id={`guide-${c.slug}`}
                    name="content"
                    rows={8}
                    defaultValue={content}
                    placeholder={EXAMPLE}
                    spellCheck={false}
                    className={`${inputClass} font-mono text-xs leading-relaxed`}
                  />
                  <SubmitButton>Save {c.label.toLowerCase()} size guide</SubmitButton>
                </form>
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wider text-neutral-500">Preview (after saving)</p>
                  {table ? <SizeTable table={table} /> : <p className="text-sm text-neutral-500">Nothing to show yet.</p>}
                </div>
              </div>
            </details>
          );
        })}
      </div>
    </>
  );
}
