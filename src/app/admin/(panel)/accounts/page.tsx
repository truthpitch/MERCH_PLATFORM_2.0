import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Card, PageTitle, SavedNotice } from "@/components/admin/Card";
import { inputClass, smallButtonClass } from "@/components/admin/styles";
import { ConfirmButton } from "@/components/admin/ui";
import { prisma } from "@/lib/db";
import { deleteCustomerAction, sendActivationLinkAction } from "../../actions";

const PAGE_SIZE = 50;

const DONE_MESSAGES: Record<string, string> = {
  sent: "Activation link sent. The account shows as Not activated until the link is clicked.",
  deleted: "Account deleted.",
  failed: "The email couldn't be sent, so nothing was changed. Check the mail settings (/api/health?mail=1) and try again.",
  nomail: "Email isn't set up on this server, so no link can be sent. Nothing was changed.",
  missing: "That account no longer exists.",
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "activated", label: "Activated" },
  { key: "waiting", label: "Not activated" },
] as const;
type FilterKey = (typeof FILTERS)[number]["key"];

const dateTime = (d: Date) =>
  d.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Amsterdam" });

export default async function AccountsAdmin({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; page?: string; done?: string }> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 100);
  const status: FilterKey = FILTERS.some((f) => f.key === sp.status) ? (sp.status as FilterKey) : "all";
  const page = Math.max(1, Math.floor(Number(sp.page)) || 1);

  const where: Prisma.CustomerWhereInput = {
    ...(q && { OR: [{ email: { contains: q } }, { name: { contains: q } }] }),
    ...(status === "activated" && { activatedAt: { not: null } }),
    ...(status === "waiting" && { activatedAt: null }),
  };

  const [total, activated, matching, customers] = await Promise.all([
    prisma.customer.count(),
    prisma.customer.count({ where: { activatedAt: { not: null } } }),
    prisma.customer.count({ where }),
    prisma.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: { id: true, name: true, email: true, createdAt: true, activatedAt: true, _count: { select: { favorites: true } } },
    }),
  ]);
  const pages = Math.max(1, Math.ceil(matching / PAGE_SIZE));

  const href = (changes: { status?: FilterKey; page?: number }) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    const s = changes.status ?? status;
    if (s !== "all") p.set("status", s);
    const pg = changes.page ?? 1;
    if (pg > 1) p.set("page", String(pg));
    const qs = p.toString();
    return `/admin/accounts${qs ? `?${qs}` : ""}`;
  };

  const back = href({ page });
  const done = sp.done ? DONE_MESSAGES[sp.done] : undefined;

  return (
    <>
      <PageTitle title="User accounts" description="Customers who created an account in the shop. Times are Amsterdam time." />
      <SavedNotice show={Boolean(done)}>{done}</SavedNotice>

      <div className="mb-6 grid grid-cols-3 gap-4">
        {[
          { label: "Accounts", value: total },
          { label: "Activated", value: activated },
          { label: "Not activated", value: total - activated },
        ].map((s) => (
          <div key={s.label} className="border border-neutral-200 bg-white p-5">
            <p className="text-xs uppercase tracking-wider text-neutral-500">{s.label}</p>
            <p className="mt-2 text-2xl font-semibold text-black">{s.value}</p>
          </div>
        ))}
      </div>

      <Card>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <form action="/admin/accounts" className="flex flex-1 gap-2 sm:max-w-sm">
            {status !== "all" && <input type="hidden" name="status" value={status} />}
            <input type="search" name="q" defaultValue={q} placeholder="Search name or email" aria-label="Search accounts" className={inputClass} />
            <button className="border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-black hover:border-black">Search</button>
          </form>
          <nav aria-label="Filter accounts" className="flex gap-2">
            {FILTERS.map((f) => (
              <Link
                key={f.key}
                href={href({ status: f.key })}
                aria-current={status === f.key ? "page" : undefined}
                className={`border px-3 py-1.5 text-xs font-medium ${status === f.key ? "border-black bg-black text-white" : "border-neutral-300 text-neutral-700 hover:border-black"}`}
              >
                {f.label}
              </Link>
            ))}
          </nav>
        </div>

        {customers.length === 0 ? (
          <p className="text-sm text-neutral-600">{total === 0 ? "No accounts yet." : "No accounts match this search."}</p>
        ) : (
          <div className="relative -mx-6 overflow-x-auto px-6">
            <table className="w-full min-w-[52rem] text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-xs uppercase tracking-wider text-neutral-500">
                  <th className="py-2 pr-4 font-medium">Name</th>
                  <th className="py-2 pr-4 font-medium">Email</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 pr-4 font-medium">Created</th>
                  <th className="py-2 pr-4 text-right font-medium">Favorites</th>
                  <th className="py-2 text-right font-medium">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td className="py-3 pr-4 text-black">{c.name || "—"}</td>
                    <td className="py-3 pr-4 break-all text-black">{c.email}</td>
                    <td className="py-3 pr-4">
                      {c.activatedAt ? (
                        <span className="flex items-center gap-2 text-black" title={`Activated ${dateTime(c.activatedAt)}`}>
                          <span className="inline-block h-2 w-2 rounded-full bg-black" />
                          Activated
                        </span>
                      ) : (
                        <span className="flex items-center gap-2 text-neutral-500">
                          <span className="inline-block h-2 w-2 rounded-full border border-neutral-400" />
                          Not activated
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4 whitespace-nowrap text-neutral-600">{dateTime(c.createdAt)}</td>
                    <td className="py-3 pr-4 text-right text-neutral-600">{c._count.favorites}</td>
                    <td className="py-3">
                      <div className="flex justify-end gap-2">
                        <form action={sendActivationLinkAction}>
                          <input type="hidden" name="id" value={c.id} />
                          <input type="hidden" name="back" value={back} />
                          <ConfirmButton
                            className={`${smallButtonClass} whitespace-nowrap`}
                            message={
                              c.activatedAt
                                ? `Send a new activation link to ${c.email}?\n\nThe account becomes "Not activated" and is signed out until the link is clicked.`
                                : `Send a new activation link to ${c.email}?`
                            }
                          >
                            {c.activatedAt ? "Send activation link" : "Resend link"}
                          </ConfirmButton>
                        </form>
                        <form action={deleteCustomerAction}>
                          <input type="hidden" name="id" value={c.id} />
                          <input type="hidden" name="back" value={back} />
                          <ConfirmButton
                            className={`${smallButtonClass} whitespace-nowrap`}
                            message={`Permanently delete the account of ${c.email}?\n\nTheir favorites are deleted too. Orders stay in Shopify. This can't be undone.`}
                          >
                            Delete
                          </ConfirmButton>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pages > 1 && (
          <div className="mt-5 flex items-center justify-between text-sm">
            {page > 1 ? (
              <Link href={href({ page: page - 1 })} className="text-black underline underline-offset-4">
                ← Newer
              </Link>
            ) : (
              <span />
            )}
            <span className="text-neutral-500">
              Page {page} of {pages}
            </span>
            {page < pages ? (
              <Link href={href({ page: page + 1 })} className="text-black underline underline-offset-4">
                Older →
              </Link>
            ) : (
              <span />
            )}
          </div>
        )}
      </Card>
    </>
  );
}
