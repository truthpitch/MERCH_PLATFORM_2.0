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
  { href: "/admin/homepage", label: "Home" },
  { href: "/admin/about", label: "About" },
  { href: "/admin/contact", label: "Contact" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/blog", label: "Blog" },
  { href: "/admin/media", label: "Media" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/accounts", label: "User accounts" },
  { href: "/admin/orders", label: "Orders" },
];

export function AdminNav() {
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
          </Link>
        );
      })}
    </nav>
  );
}

/** Submit button that asks "are you sure?" first, for actions that can't be undone. */
export function ConfirmButton({ children, message, className }: { children: React.ReactNode; message: string; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
      className={className}
    >
      {pending ? "Working…" : children}
    </button>
  );
}
