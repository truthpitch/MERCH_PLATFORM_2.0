import { Card, PageTitle, SavedNotice } from "@/components/admin/Card";
import { inputClass, labelClass, smallButtonClass } from "@/components/admin/styles";
import { SubmitButton } from "@/components/admin/ui";
import { getProducts } from "@/lib/catalog";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { addFeaturedAction, moveFeaturedAction, removeFeaturedAction, saveHomepageAction } from "../../actions";

export default async function HomepageAdmin({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const [settings, products, featured, sp] = await Promise.all([
    getSettings(),
    getProducts().catch(() => []),
    prisma.featuredProduct.findMany({ orderBy: { position: "asc" } }),
    searchParams,
  ]);
  const byHandle = new Map(products.map((p) => [p.handle, p]));
  const featuredHandles = new Set(featured.map((f) => f.handle));
  const available = products.filter((p) => !featuredHandles.has(p.handle));

  return (
    <>
      <PageTitle title="Homepage" description="Hero, announcement bar, about text and featured products." />
      <SavedNotice show={sp.saved === "1"}>Homepage saved.</SavedNotice>

      <div className="grid gap-6">
        <form action={saveHomepageAction} className="grid gap-6">
          <Card title="Announcement bar">
            <label className="mb-4 flex items-center gap-2 text-sm text-black">
              <input type="checkbox" name="announcementEnabled" defaultChecked={settings.announcementEnabled} className="h-4 w-4 accent-black" />
              Show announcement bar at the top of the site
            </label>
            <label className={labelClass} htmlFor="announcementText">
              Text
            </label>
            <input id="announcementText" name="announcementText" defaultValue={settings.announcementText} placeholder="Free shipping on orders over $75" className={inputClass} />
          </Card>

          <Card title="Hero">
            <div className="grid gap-4">
              <div>
                <label className={labelClass} htmlFor="heroTitle">
                  Headline
                </label>
                <input id="heroTitle" name="heroTitle" defaultValue={settings.heroTitle} required className={inputClass} />
              </div>
              <div>
                <label className={labelClass} htmlFor="heroSubtitle">
                  Subtext
                </label>
                <textarea id="heroSubtitle" name="heroSubtitle" defaultValue={settings.heroSubtitle} rows={2} className={inputClass} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass} htmlFor="heroCtaLabel">
                    Button label
                  </label>
                  <input id="heroCtaLabel" name="heroCtaLabel" defaultValue={settings.heroCtaLabel} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass} htmlFor="heroImageUrl">
                    Image URL (optional)
                  </label>
                  <input id="heroImageUrl" name="heroImageUrl" defaultValue={settings.heroImageUrl} placeholder="/media/… or https://…" className={inputClass} />
                </div>
              </div>
              <p className="text-xs text-neutral-500">Tip: upload an image under Media, then paste its URL here.</p>
            </div>
          </Card>

          <Card title="About section">
            <div className="grid gap-4">
              <div>
                <label className={labelClass} htmlFor="aboutTitle">
                  Heading
                </label>
                <input id="aboutTitle" name="aboutTitle" defaultValue={settings.aboutTitle} className={inputClass} />
              </div>
              <div>
                <label className={labelClass} htmlFor="aboutText">
                  Text
                </label>
                <textarea id="aboutText" name="aboutText" defaultValue={settings.aboutText} rows={6} className={inputClass} />
                <p className="mt-1 text-xs text-neutral-500">Leave a blank line between paragraphs.</p>
              </div>
            </div>
          </Card>

          <div>
            <SubmitButton>Save homepage</SubmitButton>
          </div>
        </form>

        {/* Featured products — separate small forms so each click saves instantly */}
        <div id="featured" className="scroll-mt-6">
          <Card title="Featured products">
            {featured.length === 0 ? (
              <p className="mb-5 text-sm text-neutral-600">
                None selected — the homepage automatically shows the 4 newest products. Add products below to choose and order them yourself.
              </p>
            ) : (
              <ol className="mb-6 divide-y divide-neutral-200 border-y border-neutral-200">
                {featured.map((f, i) => {
                  const p = byHandle.get(f.handle);
                  return (
                    <li key={f.id} className="flex items-center gap-3 py-3">
                      <span className="w-6 text-sm text-neutral-400">{i + 1}</span>
                      {p?.featuredImage && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.featuredImage.url} alt="" className="h-12 w-10 bg-neutral-100 object-cover" />
                      )}
                      <span className="flex-1 text-sm text-black">
                        {p?.title ?? f.handle}
                        {!p && <span className="ml-2 text-xs text-neutral-500">(not found in store)</span>}
                      </span>
                      <form action={moveFeaturedAction}>
                        <input type="hidden" name="handle" value={f.handle} />
                        <input type="hidden" name="direction" value="up" />
                        <button className={smallButtonClass} disabled={i === 0} aria-label="Move up">
                          ↑
                        </button>
                      </form>
                      <form action={moveFeaturedAction}>
                        <input type="hidden" name="handle" value={f.handle} />
                        <input type="hidden" name="direction" value="down" />
                        <button className={smallButtonClass} disabled={i === featured.length - 1} aria-label="Move down">
                          ↓
                        </button>
                      </form>
                      <form action={removeFeaturedAction}>
                        <input type="hidden" name="handle" value={f.handle} />
                        <button className={smallButtonClass}>Remove</button>
                      </form>
                    </li>
                  );
                })}
              </ol>
            )}

            {available.length > 0 && (
              <form action={addFeaturedAction} className="flex flex-col gap-3 sm:flex-row">
                <select name="handle" className={inputClass} defaultValue={available[0].handle}>
                  {available.map((p) => (
                    <option key={p.handle} value={p.handle}>
                      {p.title}
                    </option>
                  ))}
                </select>
                <SubmitButton variant="secondary">Add to featured</SubmitButton>
              </form>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
