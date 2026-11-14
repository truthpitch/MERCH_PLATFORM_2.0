"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFormStatus } from "react-dom";

export function SubmitButton({ children, variant = "primary" }: { children: React.ReactNode; variant?: "primary" | "secondary" }) {
  const { pending } = useFormStatus();
  const styles =
    variant === "primary"
      ? "bg-black text-white hover:bg-neutral-800 disabled:bg-neutral-400"
      : "border border-neutral-300 bg-white text-black hover:border-black disabled:text-neutral-400";
  return (
    <button type="submit" disabled={pending} className={`px-4 py-2 text-sm font-medium ${styles}`}>
      {pending ? "Saving…" : children}
    </button>
  );
}

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/homepage", label: "Homepage" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/media", label: "Media" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/messages", label: "Messages" },
];

export function AdminNav({ unreadMessages = 0 }: { unreadMessages?: number }) {
  const pathname = usePathname();
  return (
    <nav className="mx-auto flex max-w-5xl gap-6 overflow-x-auto px-4 text-sm sm:px-6">
      {NAV.map((item) => {
        const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`border-b-2 py-3 whitespace-nowrap ${active ? "border-black text-black" : "border-transparent text-neutral-500 hover:text-black"}`}
          >
            {item.label}
            {item.href === "/admin/messages" && unreadMessages > 0 && (
              <span className="ml-1.5 bg-black px-1.5 py-0.5 text-[10px] font-semibold text-white">{unreadMessages}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
