"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SIDEBAR_COOKIE } from "./sidebar-cookie";

// Simple line icons (24×24, drawn with a stroke).
const ICONS = {
  dashboard: "M3 3h7v9H3z M14 3h7v5h-7z M14 12h7v9h-7z M3 16h7v5H3z",
  home: "M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z",
  about: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 16v-5 M12 8h.01",
  contact: "M3 5h18v14H3z M3 7l9 6 9-6",
  legal: "M6 3h8l5 5v13H6z M14 3v5h5 M9 13h7 M9 17h7",
  theme:
    "M12 3a9 9 0 0 0 0 18c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1.1.9-2 2-2h2.4A4.6 4.6 0 0 0 21 9.8C21 6 17 3 12 3z M7.5 11.5h.01 M10.5 7.5h.01 M15.5 7.5h.01",
  products: "M8 3 3 6l2 5 3-1v11h8V10l3 1 2-5-5-3a4 4 0 0 1-8 0z",
  orders: "M3 7l9-4 9 4v10l-9 4-9-4z M3 7l9 4 9-4 M12 11v10",
  reviews: "m12 2.5 2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8L12 2.5Z",
  accounts: "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M2 21a7 7 0 0 1 14 0 M16 3.5a4 4 0 0 1 0 7 M18 14a6 6 0 0 1 4 7",
  blog: "M4 20h4L19 9l-4-4L4 16z M14 6l4 4",
  replies: "M4 4h16v12H8l-4 4z M8 9h8 M8 12h5",
  media: "M3 4h18v16H3z M3 16l5-5 5 5 3-3 5 5 M15.5 8.5h.01",
  traffic: "M4 20V10 M10 20V4 M16 20v-7 M2 20h20",
  social: "M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M8.6 13.5l6.8 4 M15.4 6.5l-6.8 4",
  link: "M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1 M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1",
  collapse: "M3 4h18v16H3z M9 4v16 M16 9l-3 3 3 3",
  expand: "M3 4h18v16H3z M9 4v16 M13 9l3 3-3 3",
  menu: "M4 6h16 M4 12h16 M4 18h16",
  close: "M6 6l12 12 M18 6 6 18",
} as const;
type IconName = keyof typeof ICONS;

function Icon({ name, className = "h-5 w-5" }: { name: IconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 ${className}`} aria-hidden>
      <path d={ICONS[name]} />
    </svg>
  );
}

type Item = { href: string; label: string; icon: IconName; badge?: "reviews" | "replies" };
const GROUPS: { title: string; items: Item[] }[] = [
  { title: "", items: [{ href: "/admin", label: "Dashboard", icon: "dashboard" }] },
  {
    title: "Website",
    items: [
      { href: "/admin/homepage", label: "Home", icon: "home" },
      { href: "/admin/about", label: "About", icon: "about" },
      { href: "/admin/contact", label: "Contact", icon: "contact" },
      { href: "/admin/legal", label: "Legal", icon: "legal" },
      { href: "/admin/theme", label: "Theme", icon: "theme" },
      { href: "/admin/media", label: "Media", icon: "media" },
    ],
  },
  {
    title: "Shop",
    items: [
      { href: "/admin/products", label: "Products", icon: "products" },
      { href: "/admin/orders", label: "Orders", icon: "orders" },
      { href: "/admin/reviews", label: "Reviews", icon: "reviews", badge: "reviews" },
      { href: "/admin/accounts", label: "User accounts", icon: "accounts" },
    ],
  },
  {
    title: "Blog",
    items: [
      { href: "/admin/blog", label: "Posts", icon: "blog" },
      { href: "/admin/replies", label: "Replies", icon: "replies", badge: "replies" },
    ],
  },
  {
    title: "Social",
    items: [
      { href: "/admin/social", label: "Compose & queue", icon: "social" },
      { href: "/admin/social/accounts", label: "Accounts", icon: "link" },
    ],
  },
  { title: "Insights", items: [{ href: "/admin/traffic", label: "SEO & Traffic", icon: "traffic" }] },
];

/**
 * The admin frame: top bar, left sidebar with every section, and the page.
 * On wide screens the sidebar can be collapsed to icons (remembered in a cookie);
 * on phones it slides in from the left with the menu button.
 */
export function AdminShell({
  initialCollapsed,
  counts,
  headerRight,
  children,
}: {
  initialCollapsed: boolean;
  counts: { reviews: number; replies: number };
  headerRight: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close the phone menu after navigating, and with Escape.
  useEffect(() => setMobileOpen(false), [pathname]);
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMobileOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    document.cookie = `${SIDEBAR_COOKIE}=${next ? "collapsed" : "open"}; path=/admin; max-age=31536000; samesite=lax`;
  };

  // The most specific match wins, so /admin/social/accounts doesn't also light up /admin/social.
  const allHrefs = GROUPS.flatMap((g) => g.items.map((i) => i.href));
  const activeHref = allHrefs
    .filter((h) => (h === "/admin" ? pathname === "/admin" : pathname === h || pathname.startsWith(h + "/")))
    .sort((a, b) => b.length - a.length)[0];
  const isActive = (href: string) => href === activeHref;

  // `narrow` = icons only (collapsed desktop sidebar). The phone drawer always shows labels.
  const nav = (narrow: boolean) => (
    <nav aria-label="Admin" className="flex flex-col gap-4 px-3 py-3">
      {GROUPS.map((g, gi) => (
        <div key={gi}>
          {g.title &&
            (narrow ? (
              <div className="mx-2 mb-2 border-t border-neutral-200" aria-hidden />
            ) : (
              <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-neutral-400">{g.title}</p>
            ))}
          <ul className="flex flex-col gap-0.5">
            {g.items.map((item) => {
              const active = isActive(item.href);
              const n = item.badge ? counts[item.badge] : 0;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    title={narrow ? `${item.label}${n ? ` (${n} waiting)` : ""}` : undefined}
                    className={`relative flex items-center gap-3 px-3 py-1.5 text-sm ${narrow ? "justify-center" : ""} ${
                      active ? "bg-black text-white" : "text-neutral-600 hover:bg-neutral-100 hover:text-black"
                    }`}
                  >
                    <Icon name={item.icon} />
                    {narrow ? (
                      <>
                        <span className="sr-only">{item.label}</span>
                        {n > 0 && (
                          <span className={`absolute right-1.5 top-1.5 h-2 w-2 rounded-full ${active ? "bg-white" : "bg-black"}`}>
                            <span className="sr-only">, {n} waiting</span>
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        <span className="flex-1 truncate">{item.label}</span>
                        {n > 0 && (
                          <span
                            className={`min-w-5 px-1.5 text-center text-[11px] font-semibold leading-5 ${active ? "bg-white text-black" : "bg-black text-white"}`}
                            aria-label={`${n} waiting`}
                          >
                            {n}
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="flex flex-1 flex-col bg-neutral-50">
      <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white">
        <div className="flex h-14 items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="-ml-2 p-2 text-black md:hidden"
              aria-label="Open menu"
              aria-expanded={mobileOpen}
              aria-controls="admin-drawer"
            >
              <Icon name="menu" />
            </button>
            <Link href="/admin" className="text-sm font-bold tracking-[0.3em] text-black">
              TRUTHPITCH <span className="ml-1 font-normal tracking-normal text-neutral-500">Admin</span>
            </Link>
          </div>
          {headerRight}
        </div>
      </header>

      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <aside
          className={`sticky top-14 hidden h-[calc(100dvh-3.5rem)] shrink-0 flex-col border-r border-neutral-200 bg-white transition-[width] duration-200 md:flex ${
            collapsed ? "w-[68px]" : "w-60"
          }`}
        >
          <div className="flex-1 overflow-y-auto overflow-x-hidden">{nav(collapsed)}</div>
          <div className="border-t border-neutral-200 p-2">
            <button
              type="button"
              onClick={toggle}
              aria-expanded={!collapsed}
              title={collapsed ? "Expand sidebar" : undefined}
              className={`flex w-full items-center gap-3 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100 hover:text-black ${collapsed ? "justify-center" : ""}`}
            >
              <Icon name={collapsed ? "expand" : "collapse"} />
              {collapsed ? <span className="sr-only">Expand sidebar</span> : <span>Collapse sidebar</span>}
            </button>
          </div>
        </aside>

        {/* Phone drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <button type="button" className="absolute inset-0 bg-black/40" aria-label="Close menu" tabIndex={-1} onClick={() => setMobileOpen(false)} />
            <aside id="admin-drawer" className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-white shadow-xl">
              <div className="flex h-14 items-center justify-between border-b border-neutral-200 px-4">
                <span className="text-sm font-semibold text-black">Menu</span>
                <button type="button" onClick={() => setMobileOpen(false)} className="-mr-2 p-2 text-black" aria-label="Close menu" autoFocus>
                  <Icon name="close" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">{nav(false)}</div>
            </aside>
          </div>
        )}

        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
