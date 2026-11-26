import Link from "next/link";
import { Card, PageTitle, SavedNotice } from "@/components/admin/Card";
import { SocialComposer } from "@/components/admin/SocialComposer";
import { smallButtonClass } from "@/components/admin/styles";
import { ConfirmButton, SubmitButton } from "@/components/admin/ui";
import { prisma } from "@/lib/db";
import { pickerData } from "@/lib/media";
import { composerAccounts, composerProducts } from "@/lib/social/admin-data";
import { isSocialMock } from "@/lib/social/mock";
import { formatAmsterdam } from "@/lib/social/time";
import { PLATFORM_LABEL, isPlatform } from "@/lib/social/types";
import { deleteSocialPostAction, retrySocialTargetAction } from "../../social-actions";

const STATUSES = [
  { key: "scheduled", label: "Scheduled" },
  { key: "published", label: "Published" },
  { key: "failed", label: "Failed" },
  { key: "all", label: "All" },
] as const;
type StatusKey = (typeof STATUSES)[number]["key"];
const PLATFORM_FILTERS = [
  { key: "all", label: "All platforms" },
  { key: "INSTAGRAM", label: "Instagram" },
  { key: "THREADS", label: "Threads" },
] as const;

const DONE: Record<string, string> = {
  posted: "Posted.",
  "post-failed": "Not everything could be posted. See the error in the list below; you can retry it.",
  scheduled: "Scheduled. It will be posted at the chosen time.",
  deleted: "Post deleted.",
};

const STATUS_STYLE: Record<string, string> = {
  scheduled: "border border-black text-black",
  publishing: "border border-neutral-400 text-neutral-600",
  published: "bg-black text-white",
  failed: "bg-red-700 text-white",
};

export default async function SocialAdmin({ searchParams }: { searchParams: Promise<{ status?: string; platform?: string; done?: string }> }) {
  const sp = await searchParams;
  const platform = isPlatform(sp.platform) ? sp.platform : null;
  const status: StatusKey = STATUSES.some((s) => s.key === sp.status) ? (sp.status as StatusKey) : "all";
  const targetWhere = (s: StatusKey) => ({ ...(s === "all" ? {} : { status: s }), ...(platform ? { platform } : {}) });

  const [accounts, products, { media, folders }, posts, ...counts] = await Promise.all([
    composerAccounts(),
    composerProducts(),
    pickerData(),
    prisma.socialPost.findMany({
      where: { targets: { some: targetWhere(status) } },
      orderBy: [{ scheduledAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
      take: 100,
      include: { targets: { orderBy: { platform: "asc" }, include: { account: { select: { username: true } } } } },
    }),
    ...STATUSES.map((s) => prisma.socialPost.count({ where: { targets: { some: targetWhere(s.key) } } })),
  ]);

  const qs = (patch: Record<string, string | null>) => {
    const p = new URLSearchParams();
    const merged = { status: status === "all" ? null : status, platform, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    const s = p.toString();
    return `/admin/social${s ? `?${s}` : ""}#queue`;
  };

  return (
    <>
      <PageTitle
        title="Social"
        description="Post to Instagram and Threads, now or at a set time. Scheduled posts are sent by a cron job every 5 minutes. Times are Amsterdam time."
      />
      <SavedNotice show={Boolean(sp.done && DONE[sp.done])}>{sp.done ? DONE[sp.done] : ""}</SavedNotice>
      {isSocialMock() && (
        <p className="mb-6 border border-dashed border-black bg-white px-4 py-3 text-sm text-black">
          <strong>Test mode (SOCIAL_MOCK=true).</strong> Nothing is really posted. Put <code>#fail</code> in a caption to see what an error looks like.
        </p>
      )}

      <div className="grid gap-6">
        <Card title="New post">
          <SocialComposer accounts={accounts} products={products} media={media} folders={folders} />
        </Card>

        <section id="queue" className="scroll-mt-20">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-black">Queue</h2>
          <nav aria-label="Filter by status" className="mb-2 flex flex-wrap gap-2">
            {STATUSES.map((s, i) => (
              <Link
                key={s.key}
                href={qs({ status: s.key === "all" ? null : s.key })}
                aria-current={status === s.key ? "page" : undefined}
                className={`border px-3 py-1.5 text-xs font-medium ${status === s.key ? "border-black bg-black text-white" : "border-neutral-300 bg-white text-neutral-700 hover:border-black"}`}
              >
                {s.label} ({counts[i]})
              </Link>
            ))}
          </nav>
          <nav aria-label="Filter by platform" className="mb-4 flex flex-wrap gap-2">
            {PLATFORM_FILTERS.map((f) => {
              const active = (platform ?? "all") === f.key;
              return (
                <Link
                  key={f.key}
                  href={qs({ platform: f.key === "all" ? null : f.key })}
                  aria-current={active ? "page" : undefined}
                  className={`px-2 py-1 text-xs ${active ? "font-semibold text-black underline underline-offset-4" : "text-neutral-600 hover:text-black"}`}
                >
                  {f.label}
                </Link>
              );
            })}
          </nav>

          <Card>
            {posts.length === 0 ? (
              <p className="text-sm text-neutral-600">Nothing here yet.</p>
            ) : (
              <ul className="divide-y divide-neutral-200">
                {posts.map((p) => {
                  const allScheduled = p.targets.every((t) => t.status === "scheduled");
                  const busy = p.targets.some((t) => t.status === "publishing");
                  return (
                    <li key={p.id} className="flex flex-col gap-4 py-5 first:pt-0 last:pb-0 sm:flex-row">
                      {p.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.imageUrl} alt="" className="h-20 w-20 shrink-0 border border-neutral-200 bg-neutral-100 object-cover" />
                      ) : (
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center border border-neutral-200 bg-neutral-50 text-[10px] uppercase tracking-wider text-neutral-400">
                          Text
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-neutral-500">
                          {p.scheduledAt ? `Scheduled for ${formatAmsterdam(p.scheduledAt)}` : `Posted right away · ${formatAmsterdam(p.createdAt)}`}
                        </p>
                        <p className="mt-1 line-clamp-3 whitespace-pre-line break-words text-sm text-black">{p.caption || <em className="text-neutral-500">No caption</em>}</p>
                        <ul className="mt-3 space-y-2">
                          {p.targets.map((t) => (
                            <li key={t.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                              <span className={`px-2 py-0.5 font-semibold uppercase tracking-wider ${STATUS_STYLE[t.status] ?? ""}`}>{t.status}</span>
                              <span className="font-medium text-black">
                                {isPlatform(t.platform) ? PLATFORM_LABEL[t.platform] : t.platform}
                                {t.account && <span className="font-normal text-neutral-500"> @{t.account.username}</span>}
                              </span>
                              {t.publishedAt && <span className="text-neutral-500">{formatAmsterdam(t.publishedAt)}</span>}
                              {t.permalink && (
                                <a href={t.permalink} target="_blank" rel="noopener noreferrer" className="text-black underline underline-offset-4">
                                  View post ↗
                                </a>
                              )}
                              {t.status === "failed" && (
                                <form action={retrySocialTargetAction}>
                                  <input type="hidden" name="id" value={t.id} />
                                  <SubmitButton variant="secondary">Retry</SubmitButton>
                                </form>
                              )}
                              {t.error && <span className="basis-full text-red-700">{t.error}</span>}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="flex shrink-0 items-start gap-2">
                        {allScheduled && (
                          <Link href={`/admin/social/${p.id}`} className={smallButtonClass}>
                            Edit
                          </Link>
                        )}
                        {!busy && (
                          <form action={deleteSocialPostAction}>
                            <input type="hidden" name="id" value={p.id} />
                            <ConfirmButton
                              className={smallButtonClass}
                              message={allScheduled ? "Delete this scheduled post? It won't be posted." : "Remove this post from the list? Posts that are already live stay on Instagram/Threads."}
                            >
                              Delete
                            </ConfirmButton>
                          </form>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </section>
      </div>
    </>
  );
}
