"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CATEGORIES } from "@/lib/categories";

/**
 * Phones and tablets (below 1024px): the hamburger button opens a menu that slides in
 * from the left. SHOP folds open to show every product category.
 * From 1024px up the desktop menu (DesktopNav) is used instead.
 */
export function MenuDrawer({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(pathname.startsWith("/products"));
  const openButton = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    closeButton.current?.focus();
    // Keep the page behind the menu from scrolling.
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        openButton.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => setOpen(false);
  const itemClass =
    "flex w-full items-center justify-between py-4 text-left text-sm font-semibold uppercase tracking-[0.2em] text-black aria-[current=page]:underline aria-[current=page]:underline-offset-8";

  return (
    <div className="lg:hidden">
      <button
        ref={openButton}
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="menu-drawer"
        aria-label="Open menu"
        className="-ml-2 flex h-10 w-9 items-center justify-center text-black"
      >
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>

      {/* Dimmed background; tapping it closes the menu. */}
      <div
        aria-hidden
        onClick={close}
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
      />

      <div
        id="menu-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        inert={!open}
        className={`fixed inset-y-0 left-0 z-50 flex w-[85vw] max-w-sm flex-col bg-white shadow-xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-neutral-200 px-5">
          <Link href="/" onClick={close} className="notranslate text-sm font-bold tracking-[0.25em] text-black">
            TRUTHPITCH
          </Link>
          <button
            ref={closeButton}
            type="button"
            onClick={() => {
              close();
              openButton.current?.focus();
            }}
            aria-label="Close menu"
            className="-mr-2 flex h-10 w-10 items-center justify-center text-black"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <nav aria-label="Main" className="flex-1 overflow-y-auto px-5">
          <ul className="divide-y divide-neutral-200">
            <li>
              <button
                type="button"
                onClick={() => setShopOpen((v) => !v)}
                aria-expanded={shopOpen}
                aria-controls="drawer-categories"
                className={itemClass}
              >
                Shop
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden
                  className={`transition-transform duration-200 ${shopOpen ? "rotate-180" : ""}`}
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              <ul id="drawer-categories" hidden={!shopOpen} className="pb-4">
                <li>
                  <Link href="/products" onClick={close} className="block py-2 pl-3 text-sm font-medium text-black hover:underline">
                    Shop all
                  </Link>
                </li>
                {CATEGORIES.map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`/products?category=${c.slug}`}
                      onClick={close}
                      className="block py-2 pl-3 text-sm text-neutral-600 hover:text-black hover:underline"
                    >
                      {c.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
            <li>
              <Link href="/about" onClick={close} aria-current={pathname === "/about" ? "page" : undefined} className={itemClass}>
                About
              </Link>
            </li>
            <li>
              <Link href="/contact" onClick={close} aria-current={pathname === "/contact" ? "page" : undefined} className={itemClass}>
                Contact
              </Link>
            </li>
          </ul>
        </nav>

        <div className="shrink-0 border-t border-neutral-200 px-5 py-4 text-sm">
          <Link href={signedIn ? "/account" : "/account/login"} onClick={close} className="text-neutral-700 underline underline-offset-4 hover:text-black">
            {signedIn ? "My account" : "Sign in or create an account"}
          </Link>
        </div>
      </div>
    </div>
  );
}
