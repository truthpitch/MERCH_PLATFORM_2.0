import type { Metadata } from "next";
import Link from "next/link";
import { AdminNav } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { logoutAction } from "../actions";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const [settings, unreadMessages] = await Promise.all([getSettings(), prisma.contactMessage.count({ where: { read: false } })]);

  return (
    <div className="flex-1 bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/admin" className="text-sm font-bold tracking-[0.3em] text-black">
            TRUTHPITCH <span className="ml-1 font-normal tracking-normal text-neutral-500">Admin</span>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span
              className={`hidden px-2 py-0.5 text-xs font-medium sm:inline ${settings.maintenanceMode ? "bg-black text-white" : "bg-neutral-200 text-neutral-700"}`}
            >
              {settings.maintenanceMode ? "Maintenance ON" : "Live"}
            </span>
            <Link href="/" target="_blank" className="text-neutral-600 hover:text-black">
              View store
            </Link>
            <form action={logoutAction}>
              <button className="text-neutral-600 hover:text-black">Log out</button>
            </form>
          </div>
        </div>
        <AdminNav unreadMessages={unreadMessages} />
      </header>
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">{children}</div>
    </div>
  );
}
