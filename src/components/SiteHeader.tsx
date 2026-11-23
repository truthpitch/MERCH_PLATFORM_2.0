import Link from "next/link";
import { Suspense } from "react";
import { DesktopNav } from "./header/DesktopNav";
import { HeaderIcons } from "./header/HeaderIcons";
import { LanguageSelect } from "./header/LanguageSelect";
import { MenuDrawer } from "./header/MenuDrawer";
import { SearchForm } from "./header/SearchForm";
import { ThemeToggle } from "./header/ThemeToggle";

/**
 * Menu bar, built mobile first.
 *
 * Phone / tablet (< 1024px):
 *   [☰ TRUTHPITCH]   [🌐 EN ⌄ ☾]   [👤 ♡ 🛒]      ← sticks to the top
 *   [ Search products               🔍 ]
 *
 * Desktop (≥ 1024px), one row:
 *   [TRUTHPITCH  SHOP ⌄  ABOUT  BLOG  CONTACT]  [ Search 🔍 ]  [🌐 EN ⌄ ☾]  [👤 ♡ 🛒]
 */
export function SiteHeader({ cartCount, signedIn }: { cartCount: number; signedIn: boolean }) {
  return (
    <>
      {/* No backdrop blur here: it would trap the slide-out menu inside the bar. */}
      <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-3 sm:px-6 lg:gap-8">
          <div className="flex min-w-0 items-center gap-1 sm:gap-2 lg:gap-10">
            <MenuDrawer signedIn={signedIn} />
            <Link
              href="/"
              className="notranslate shrink-0 text-[13px] font-bold tracking-[0.18em] text-black max-[359px]:text-xs max-[359px]:tracking-[0.1em] sm:text-sm sm:tracking-[0.3em]"
            >
              TRUTHPITCH
            </Link>
            <DesktopNav />
          </div>

          <div className="hidden min-w-0 flex-1 justify-end lg:flex">
            <Suspense fallback={<div className="h-10 w-full max-w-sm" />}>
              <SearchForm id="site-search-desktop" className="h-10 w-full max-w-sm" />
            </Suspense>
          </div>

          <div className="flex items-center self-stretch px-0.5 sm:px-1">
            <LanguageSelect />
            <ThemeToggle />
          </div>

          <HeaderIcons cartCount={cartCount} signedIn={signedIn} />
        </div>
      </header>

      <div className="border-b border-neutral-200 bg-neutral-50 px-3 py-2 sm:px-6 lg:hidden">
        <Suspense fallback={<div className="h-11" />}>
          <SearchForm id="site-search" className="mx-auto h-11 w-full max-w-6xl" />
        </Suspense>
      </div>
    </>
  );
}

const FOOTER_LINKS = [
  { href: "/about", label: "About" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact us" },
  { href: "/refund-policy", label: "Refund policy" },
  { href: "/legal-notice", label: "Legal notice" },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-neutral-200">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 text-xs text-neutral-500 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p>© {new Date().getFullYear()} TruthPitch. All rights reserved.</p>
          <p>Printed on demand. Secure checkout by Shopify.</p>
        </div>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-4 gap-y-2">
            {FOOTER_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="underline underline-offset-2 hover:text-black">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
