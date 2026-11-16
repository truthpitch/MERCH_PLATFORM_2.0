import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentCustomer } from "@/lib/customers";
import { getFavoriteHandles } from "@/lib/favorites";
import { deleteAccountAction, logoutAction } from "./actions";

export const metadata: Metadata = { title: "My account", robots: { index: false } };

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ delete?: string; reset?: string }> }) {
  const [customer, sp] = await Promise.all([getCurrentCustomer(), searchParams]);
  if (!customer) redirect("/account/login");
  const favorites = await getFavoriteHandles();

  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">My account</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-black">Hi {customer.name || "there"}</h1>
        </div>
        <form action={logoutAction}>
          <button className="border border-neutral-300 px-4 py-2 text-sm font-medium text-black hover:border-black">Sign out</button>
        </form>
      </div>

      {sp.reset === "1" && (
        <p role="status" className="mt-8 border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-black">
          Your password has been changed. You&apos;re signed out on all other devices.
        </p>
      )}

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <div className="border border-neutral-200 p-6">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-black">Details</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div>
              <dt className="text-neutral-500">Name</dt>
              <dd className="text-black">{customer.name}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Email</dt>
              <dd className="break-all text-black">{customer.email}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Member since</dt>
              <dd className="text-black">{customer.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</dd>
            </div>
          </dl>
        </div>
        <Link href="/favorites" className="group border border-neutral-200 p-6 hover:border-black">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-black">Favorites</h2>
          <p className="mt-4 text-3xl font-semibold text-black">{favorites.length}</p>
          <p className="mt-1 text-sm text-neutral-600 group-hover:underline">View your saved products →</p>
        </Link>
      </div>

      <div className="mt-4 border border-neutral-200 p-6 text-sm text-neutral-600">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-black">Orders</h2>
        <p className="mt-4">
          When you check out while signed in, your email is filled in for you. Order confirmations and tracking links are sent to that address.
        </p>
      </div>

      <details className="mt-12 border-t border-neutral-200 pt-6" open={sp.delete === "confirm"}>
        <summary className="cursor-pointer text-sm text-neutral-500 hover:text-black">Delete my account</summary>
        <form action={deleteAccountAction} className="mt-4 space-y-4">
          <p className="text-sm text-neutral-600">This permanently removes your account and favorites. Orders you placed are kept by Shopify.</p>
          <label className="flex items-center gap-2 text-sm text-black">
            <input type="checkbox" name="confirm" className="h-4 w-4 accent-black" />
            Yes, delete my account
          </label>
          {sp.delete === "confirm" && <p className="text-sm font-medium text-black">Tick the box to confirm.</p>}
          <button className="border border-black px-4 py-2 text-sm font-medium text-black hover:bg-black hover:text-white">Delete account</button>
        </form>
      </details>
    </section>
  );
}
