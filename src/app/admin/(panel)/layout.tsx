import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { AdminShell } from "@/components/admin/AdminShell";
import { SIDEBAR_COOKIE } from "@/components/admin/sidebar-cookie";
import { requireAdmin } from "@/lib/auth";
import { countPendingComments } from "@/lib/blog-comments";
import { countPendingReviews } from "@/lib/reviews";
import { getSettings } from "@/lib/settings";
import { logoutAction } from "../actions";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const [settings, jar, reviews, replies] = await Promise.all([getSettings(), cookies(), countPendingReviews(), countPendingComments()]);

  return (
    <AdminShell
      initialCollapsed={jar.get(SIDEBAR_COOKIE)?.value === "collapsed"}
      counts={{ reviews, replies }}
      headerRight={
        <div className="flex items-center gap-3 whitespace-nowrap text-sm sm:gap-4">
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
      }
    >
      {children}
    </AdminShell>
  );
}
