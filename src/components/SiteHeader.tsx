import Link from "next/link";

export function SiteHeader({ cartCount }: { cartCount: number }) {
  return (
    <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="text-sm font-bold tracking-[0.3em] text-black">
          TRUTHPITCH
        </Link>
        <nav className="flex items-center gap-6 text-sm text-neutral-700">
          <Link href="/products" className="hover:text-black">
            Shop
          </Link>
          <Link href="/#about" className="hidden hover:text-black sm:inline">
            About
          </Link>
          <Link href="/cart" className="hover:text-black">
            Cart{cartCount > 0 ? ` (${cartCount})` : ""}
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-neutral-200">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-10 text-xs text-neutral-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>© {new Date().getFullYear()} TruthPitch. All rights reserved.</p>
        <p>Printed on demand. Secure checkout by Shopify.</p>
      </div>
    </footer>
  );
}
