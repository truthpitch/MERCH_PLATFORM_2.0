import Link from "next/link";
import { Card, PageTitle, SavedNotice } from "@/components/admin/Card";
import { SubmitButton } from "@/components/admin/ui";
import { getSettings } from "@/lib/settings";
import { THEMES, isThemeSetting, themeById, type Theme } from "@/lib/themes";
import { saveThemeAction } from "../../actions";

/** A tiny shop mock-up drawn with the theme's real colours, fonts and buttons (CSS from lib/themes). */
function Preview({ theme }: { theme: Theme }) {
  return (
    <div className="theme-preview border border-neutral-200 bg-white p-4 text-black" data-theme-preview={theme.id}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">New drop</p>
      <h3 className="mt-1 text-xl font-semibold leading-tight">Truth exists.</h3>
      <p className="mt-1 text-xs text-neutral-600">Honest words on things you wear.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {/* <a> without href: looks like the shop's buttons but isn't clickable inside the label. */}
        <a aria-hidden className="bg-black px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-white">
          Shop now
        </a>
        <a aria-hidden className="border border-black px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-black">
          About
        </a>
      </div>
      <div className="mt-3 flex gap-1.5" aria-hidden>
        {[100, 200, 400].map((n) => (
          <span key={n} className={`h-6 flex-1 ${n === 100 ? "bg-neutral-100" : n === 200 ? "bg-neutral-200" : "bg-neutral-400"}`} />
        ))}
      </div>
    </div>
  );
}

const card =
  "flex cursor-pointer flex-col gap-3 border border-neutral-200 bg-white p-3 hover:border-neutral-400 has-[:checked]:border-black has-[:checked]:ring-2 has-[:checked]:ring-black has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-neutral-400";

export default async function ThemeAdmin({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const [s, sp] = await Promise.all([getSettings(), searchParams]);
  const current = isThemeSetting(s.themeDefault) ? s.themeDefault : "auto";
  const currentName = current === "auto" ? "Automatic" : (themeById(current)?.name ?? current);

  return (
    <>
      <PageTitle
        title="Theme"
        description="The look of your shop: colours, fonts and buttons. Choose the theme everyone sees first, and whether visitors may switch to another one with the palette button in the menu bar. The admin panel always keeps its own look."
      />
      <SavedNotice show={sp.saved === "1"}>Saved. The shop now uses the new theme settings.</SavedNotice>

      <form action={saveThemeAction} className="grid gap-6">
        <Card title="Who chooses the theme?">
          <div className="grid gap-3 md:grid-cols-2">
            <label className={card}>
              <span className="flex items-start gap-3">
                <input type="radio" name="themeMode" value="free" defaultChecked={!s.themeLocked} className="mt-1 accent-black" />
                <span>
                  <span className="block text-sm font-semibold text-black">Visitors can choose</span>
                  <span className="mt-1 block text-sm text-neutral-600">
                    New visitors see your default theme. With the palette button in the menu bar they can switch to any other theme; their choice is remembered on their device.
                  </span>
                </span>
              </span>
            </label>
            <label className={card}>
              <span className="flex items-start gap-3">
                <input type="radio" name="themeMode" value="locked" defaultChecked={s.themeLocked} className="mt-1 accent-black" />
                <span>
                  <span className="block text-sm font-semibold text-black">Fixed theme</span>
                  <span className="mt-1 block text-sm text-neutral-600">
                    Everyone sees the default theme below. The palette button is hidden and earlier choices made by visitors are ignored.
                  </span>
                </span>
              </span>
            </label>
          </div>
        </Card>

        <Card title="Default theme">
          <p className="mb-4 text-sm text-neutral-600">
            Now: <strong className="text-black">{currentName}</strong>. Click a theme to select it, then save.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className={card}>
              <span className="grid grid-cols-2 border border-neutral-200" aria-hidden>
                <span className="flex h-[150px] items-center justify-center bg-white text-2xl font-semibold text-black">Aa</span>
                <span className="flex h-[150px] items-center justify-center bg-neutral-950 text-2xl font-semibold text-white">Aa</span>
              </span>
              <span className="flex items-start gap-3">
                <input type="radio" name="themeDefault" value="auto" defaultChecked={current === "auto"} className="mt-1 accent-black" />
                <span>
                  <span className="block text-sm font-semibold text-black">Automatic</span>
                  <span className="mt-0.5 block text-xs text-neutral-600">Classic light or Classic dark, following each visitor&rsquo;s device setting.</span>
                </span>
              </span>
            </label>
            {THEMES.map((t) => (
              <label key={t.id} className={card}>
                <Preview theme={t} />
                <span className="flex items-start gap-3">
                  <input type="radio" name="themeDefault" value={t.id} defaultChecked={current === t.id} className="mt-1 accent-black" />
                  <span>
                    <span className="block text-sm font-semibold text-black">{t.name}</span>
                    <span className="mt-0.5 block text-xs text-neutral-600">{t.description}</span>
                  </span>
                </span>
              </label>
            ))}
          </div>
        </Card>

        <div className="flex flex-wrap items-center gap-4">
          <SubmitButton>Save theme</SubmitButton>
          <Link href="/" target="_blank" className="text-sm text-neutral-600 underline underline-offset-4 hover:text-black">
            View shop
          </Link>
          <p className="text-xs text-neutral-500">
            Tip: with &ldquo;Visitors can choose&rdquo; on, you can try every theme on the real shop with the palette button. Your own choice on this device wins over the default, so choose &ldquo;Shop default&rdquo; there to see what new visitors see.
          </p>
        </div>
      </form>
    </>
  );
}
