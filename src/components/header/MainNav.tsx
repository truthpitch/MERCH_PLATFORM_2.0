"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const ITEMS = [
  { href: "/products", label: "Shop" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/cart", label: "Cart" },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Main menu.
 * - Tablet and up (≥ 640px): links side by side.
 * - Phones: a hamburger button that folds out a full-width menu with every item.
 *   The cart stays visible next to the button so shoppers can always reach it.
 */
export function MainNav({ cartCount }: { cartCount: number }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);

  // Close when navigating, pressing Escape or tapping outside the menu.
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => {
      if (wrapper.current && !wrapper.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, [open]);

  const count = cartCount > 0 ? <span className="notranslate">{` (${cartCount})`}</span> : null;

  return (
    <div ref={wrapper}>
      {/* Tablet / desktop */}
      <nav aria-label="Main" className="hidden items-center gap-6 text-sm text-neutral-700 sm:flex">
        {ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive(pathname, item.href) ? "page" : undefined}
            className="hover:text-black aria-[current=page]:text-black aria-[current=page]:underline aria-[current=page]:underline-offset-8"
          >
            {item.label}
            {item.href === "/cart" ? count : null}
          </Link>
        ))}
      </nav>

      {/* Phones */}
      <div className="flex items-center gap-1 sm:hidden">
        <Link href="/cart" className="px-2 py-2 text-sm text-neutral-700 hover:text-black">
          Cart{count}
        </Link>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          className="-mr-2 flex h-10 w-10 items-center justify-center text-black"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
            {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      {open && (
        <nav
          id="mobile-menu"
          aria-label="Main"
          className="absolute inset-x-0 top-full border-b border-neutral-200 bg-white shadow-sm sm:hidden"
        >
          <ul className="divide-y divide-neutral-200 px-4">
            {ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={isActive(pathname, item.href) ? "page" : undefined}
                  className="flex items-center justify-between py-4 text-base text-neutral-800 aria-[current=page]:font-semibold aria-[current=page]:text-black"
                >
                  <span>
                    {item.label}
                    {item.href === "/cart" ? count : null}
                  </span>
                  <span aria-hidden className="text-neutral-400">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
