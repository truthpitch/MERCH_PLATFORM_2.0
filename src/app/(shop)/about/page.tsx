import type { Metadata } from "next";
import Link from "next/link";
import { toParagraphs } from "@/lib/format";
import { getSettings } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return { title: "About", description: settings.aboutIntro.slice(0, 160) || "The idea behind TruthPitch." };
}

/** The story behind TruthPitch. All text is edited in Admin → About. */
export default async function AboutPage() {
  const s = await getSettings();
  const values = [
    { title: s.aboutValue1Title, text: s.aboutValue1Text },
    { title: s.aboutValue2Title, text: s.aboutValue2Text },
    { title: s.aboutValue3Title, text: s.aboutValue3Text },
  ].filter((v) => v.title.trim() || v.text.trim());

  return (
    <>
      {/* Intro */}
      <section className="border-b border-neutral-200">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">{s.aboutTitle}</p>
          {s.aboutIntro && (
            <h1 className="mt-6 max-w-4xl text-3xl font-semibold leading-tight tracking-tight text-black sm:text-5xl">{s.aboutIntro}</h1>
          )}
        </div>
      </section>

      {/* The idea */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className={`grid gap-12 ${s.aboutImageUrl ? "md:grid-cols-2 md:items-start" : ""}`}>
          <div className={s.aboutImageUrl ? "" : "max-w-3xl"}>
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-black">The idea</h2>
            <div className="mt-6 space-y-5 text-lg leading-relaxed text-neutral-700">
              {toParagraphs(s.aboutText).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>
          {s.aboutImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={s.aboutImageUrl} alt="" className="aspect-[4/5] w-full bg-neutral-100 object-cover" />
          )}
        </div>
      </section>

      {/* What we stand for */}
      {values.length > 0 && (
        <section className="bg-neutral-100">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-black">What we stand for</h2>
            <div className={`mt-10 grid gap-10 ${values.length === 3 ? "md:grid-cols-3" : values.length === 2 ? "md:grid-cols-2" : ""}`}>
              {values.map((v, i) => (
                <div key={i} className="border-t border-black pt-6">
                  <p className="text-xs text-neutral-500">0{i + 1}</p>
                  {v.title && <h3 className="mt-2 text-xl font-semibold text-black">{v.title}</h3>}
                  {v.text && <p className="mt-3 leading-relaxed text-neutral-700">{v.text}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Next steps */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-2xl font-semibold tracking-tight text-black">Wear what you stand for.</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/products" className="bg-black px-8 py-4 text-sm font-medium uppercase tracking-wider text-white hover:bg-neutral-800">
              Shop the collection
            </Link>
            <Link
              href="/contact"
              className="border border-black px-8 py-4 text-sm font-medium uppercase tracking-wider text-black hover:bg-neutral-100"
            >
              Get in touch
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
