import Link from "next/link";
import { Suspense } from "react";
import { LanguageSelect } from "./header/LanguageSelect";
import { MainNav } from "./header/MainNav";
import { SearchForm } from "./header/SearchForm";
import { ThemeToggle } from "./header/ThemeToggle";

/**
 * Two-bar header.
 * 1. Top bar (scrolls away): search on the left (full width on phones, fixed width from
 *    tablet up, right-aligned), language and light/dark switch on the right.
 * 2. Main bar (sticks to the top): logo and the shop menu (hamburger menu on phones).
 */
export function SiteHeader({ cartCount }: { cartCount: number }) {
  return (
    <>
      <div className="border-b border-neutral-200 bg-neutral-50">
        <div className="mx-auto flex h-12 max-w-6xl items-center gap-2 px-4 sm:px-6 md:justify-end md:gap-3">
          <Suspense fallback={<div className="h-9 flex-1 md:w-80 md:flex-none" />}>
            <SearchForm />
          </Suspense>
          <div className="flex shrink-0 items-center">
            <LanguageSelect />
            <ThemeToggle />
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/" className="notranslate shrink-0 text-sm font-bold tracking-[0.2em] text-black sm:tracking-[0.3em]">
            TRUTHPITCH
          </Link>
          <MainNav cartCount={cartCount} />
        </div>
      </header>
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-neutral-200">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-10 text-xs text-neutral-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>© {new Date().getFullYear()} TruthPitch. All rights reserved.</p>
        <p>
          Printed on demand. Secure checkout by Shopify.{" "}
          <Link href="/about" className="underline underline-offset-2 hover:text-black">
            About
          </Link>{" "}
          ·{" "}
          <Link href="/contact" className="underline underline-offset-2 hover:text-black">
            Contact us
          </Link>
        </p>
      </div>
    </footer>
  );
}
