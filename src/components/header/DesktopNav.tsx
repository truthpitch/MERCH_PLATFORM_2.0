"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CATEGORIES } from "@/lib/categories";

/** Desktop (1024px and up): SHOP opens a panel with every category, next to ABOUT and CONTACT. */
export function DesktopNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);

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

  const linkClass =
    "text-xs font-semibold uppercase tracking-[0.2em] text-neutral-700 hover:text-black aria-[current=page]:text-black aria-[current=page]:underline aria-[current=page]:underline-offset-8";

  return (
    <nav aria-label="Main" className="hidden items-center gap-7 lg:flex">
      <div ref={wrapper} className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="shop-menu"
          aria-current={pathname.startsWith("/products") ? "page" : undefined}
          className={`${linkClass} flex items-center gap-1`}
        >
          Shop
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden className={`transition-transform ${open ? "rotate-180" : ""}`}>
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
        {open && (
          <div id="shop-menu" className="absolute left-0 top-full z-30 mt-5 w-[30rem] border border-neutral-200 bg-white p-6 shadow-lg">
            <Link href="/products" onClick={() => setOpen(false)} className="mb-4 inline-block text-sm font-semibold text-black hover:underline">
              All products →
            </Link>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-1">
              {CATEGORIES.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/products?category=${c.slug}`}
                    onClick={() => setOpen(false)}
                    className="block py-1.5 text-sm text-neutral-600 hover:text-black hover:underline"
                  >
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <Link href="/about" aria-current={pathname === "/about" ? "page" : undefined} className={linkClass}>
        About
      </Link>
      <Link href="/contact" aria-current={pathname === "/contact" ? "page" : undefined} className={linkClass}>
        Contact
      </Link>
    </nav>
  );
}
