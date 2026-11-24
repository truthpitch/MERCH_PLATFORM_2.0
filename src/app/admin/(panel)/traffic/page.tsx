import Link from "next/link";
import { Card, PageTitle, SavedNotice } from "@/components/admin/Card";
import { inputClass, labelClass } from "@/components/admin/styles";
import { ConfirmButton, SubmitButton } from "@/components/admin/ui";
import { timeZoneLabel } from "@/lib/analytics";
import { prisma } from "@/lib/db";
import { missingLegalFields } from "@/lib/legal";
import { getSettings } from "@/lib/settings";
import { GOOGLE_SITE_VERIFICATION, absoluteUrl, publicSiteUrl } from "@/lib/site";
import { clearTrafficStatsAction, saveSeoVerificationAction } from "../../actions";

// Visitor statistics come from components/AnalyticsTracker → /api/track, and only exist for
// visitors who clicked "Accept" in the cookie banner. Times are Amsterdam time.

const TZ = "Europe/Amsterdam";
const PERIODS = [7, 30, 90] as const;
const DAY = 24 * 60 * 60 * 1000;

const dayKey = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: TZ }); // 2026-11-24
const dayLabel = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: TZ });
const dateTime = (d: Date) =>
  d.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: TZ });

/** 754000 → "12m 34s" */
function duration(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${String(s % 60).padStart(2, "0")}s`;
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m`;
}
const pct = (part: number, whole: number) => (whole ? `${Math.round((part / whole) * 100)}%` : "–");

let regionNames: Intl.DisplayNames | null = null;
function countryName(code: string): string {
  try {
    regionNames ??= new Intl.DisplayNames(["en"], { type: "region" });
    return regionNames.of(code) ?? code;
  } catch {
    return code;
  }
}

type Session = {
  id: string;
  visitorId: string;
  startedAt: Date;
  lastSeenAt: Date;
  landingPath: string;
  referrer: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  device: string;
  browser: string;
  os: string;
  country: string;
  timeZone: string;
  language: string;
  pageViews: { path: string; title: string; enteredAt: Date; durationMs: number }[];
};

/** Country when the host tells us, otherwise the place of the visitor's time zone. */
const location = (s: Session) => (s.country ? countryName(s.country) : s.timeZone ? `${timeZoneLabel(s.timeZone)} (time zone)` : "Unknown");
const source = (s: Session) =>
  s.utmSource ? `${s.utmSource}${s.utmMedium ? ` / ${s.utmMedium}` : ""} (campaign)` : s.referrer || "Direct / unknown";
const visitTime = (s: Session) => s.pageViews.reduce((sum, v) => sum + v.durationMs, 0);

function topList<T>(items: T[], key: (t: T) => string, limit = 10) {
  const counts = new Map<string, number>();
  for (const it of items) {
    const k = key(it) || "Unknown";
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
}

export default async function TrafficAdmin({
  searchParams,
}: {
  searchParams: Promise<{ days?: string; saved?: string; cleared?: string }>;
}) {
  const sp = await searchParams;
  const days = PERIODS.find((p) => String(p) === sp.days) ?? 30;
  const now = Date.now();
  const since = new Date(now - days * DAY);

  const [sessions, liveNow, consent, settings, posts] = await Promise.all([
    prisma.analyticsSession.findMany({
      where: { startedAt: { gte: since } },
      orderBy: { startedAt: "desc" },
      take: 20000,
      include: { pageViews: { select: { path: true, title: true, enteredAt: true, durationMs: true }, orderBy: { enteredAt: "asc" } } },
    }) as Promise<Session[]>,
    prisma.analyticsSession.count({ where: { lastSeenAt: { gte: new Date(now - 5 * 60 * 1000) } } }),
    prisma.consentEvent.groupBy({ by: ["choice"], where: { createdAt: { gte: since } }, _count: { _all: true } }),
    getSettings(),
    prisma.blogPost.findMany({ select: { title: true, slug: true, excerpt: true, metaDescription: true, coverImageUrl: true, coverImageAlt: true, published: true } }),
  ]);

  // ── Numbers ──
  const views = sessions.flatMap((s) => s.pageViews.map((v) => ({ ...v, session: s })));
  const visitors = new Set(sessions.map((s) => s.visitorId)).size;
  const returning = (() => {
    const perVisitor = new Map<string, number>();
    for (const s of sessions) perVisitor.set(s.visitorId, (perVisitor.get(s.visitorId) ?? 0) + 1);
    return [...perVisitor.values()].filter((n) => n > 1).length;
  })();
  const totalTime = sessions.reduce((sum, s) => sum + visitTime(s), 0);
  const bounces = sessions.filter((s) => s.pageViews.length <= 1).length;
  const accepted = consent.find((c) => c.choice === "accepted")?._count._all ?? 0;
  const rejected = consent.find((c) => c.choice === "rejected")?._count._all ?? 0;

  // ── Visitors per day ──
  const perDay = new Map<string, Set<string>>();
  for (const s of sessions) {
    const k = dayKey(s.startedAt);
    if (!perDay.has(k)) perDay.set(k, new Set());
    perDay.get(k)!.add(s.visitorId);
  }
  const chart = Array.from({ length: days }, (_, i) => {
    const d = new Date(now - (days - 1 - i) * DAY);
    return { key: dayKey(d), label: dayLabel(d), value: perDay.get(dayKey(d))?.size ?? 0 };
  });
  const chartMax = Math.max(1, ...chart.map((c) => c.value));

  // ── Pages: views and average time on page ──
  const pageStats = new Map<string, { views: number; timed: number; time: number; title: string }>();
  for (const v of views) {
    const p = pageStats.get(v.path) ?? { views: 0, timed: 0, time: 0, title: "" };
    p.views++;
    if (v.durationMs > 0) {
      p.timed++;
      p.time += v.durationMs;
    }
    if (v.title) p.title = v.title.replace(/ — TruthPitch$/, "");
    pageStats.set(v.path, p);
  }
  const topPages = [...pageStats.entries()].sort((a, b) => b[1].views - a[1].views).slice(0, 15);

  // ── SEO checks ──
  const published = posts.filter((p) => p.published);
  const siteUrl = publicSiteUrl();
  const checks: { ok: boolean; text: React.ReactNode }[] = [
    {
      ok: !/localhost|127\.0\.0\.1/.test(siteUrl),
      text: (
        <>
          Website address used in links and the sitemap: <span className="font-mono">{siteUrl}</span>
        </>
      ),
    },
    { ok: !settings.maintenanceMode, text: settings.maintenanceMode ? "Maintenance mode is ON: search engines are asked not to index the shop." : "Maintenance mode is off: search engines can index the shop." },
    { ok: true, text: settings.googleVerification ? "Google Search Console code is set." : "Google Search Console code is built into the website (you can replace it below)." },
    { ok: Boolean(settings.faviconUrl), text: settings.faviconUrl ? "Favicon is set." : <>No favicon yet. Upload one on the <Link href="/admin" className="underline">Dashboard</Link>.</> },
    {
      ok: missingLegalFields(settings).length === 0,
      text: missingLegalFields(settings).length ? (
        <>Legal notice still misses: {missingLegalFields(settings).join(", ")}. <Link href="/admin/legal" className="underline">Fill in</Link></>
      ) : (
        "Legal notice is complete."
      ),
    },
    { ok: published.length > 0, text: `${published.length} published blog post${published.length === 1 ? "" : "s"}, ${posts.length - published.length} draft${posts.length - published.length === 1 ? "" : "s"}. Regular posts help you get found in Google.` },
  ];
  const postIssues = published
    .map((p) => ({
      p,
      issues: [
        !(p.metaDescription.trim() || p.excerpt.trim()) && "no summary / meta description",
        !p.coverImageUrl && "no cover image",
        p.coverImageUrl && !p.coverImageAlt.trim() && "cover image has no description (alt text)",
      ].filter(Boolean) as string[],
    }))
    .filter((x) => x.issues.length);

  const periodLink = (d: number) => `/admin/traffic?days=${d}`;

  return (
    <>
      <PageTitle
        title="SEO & Traffic"
        description="Who visits your website, where they come from and how long they stay, plus tools to get found in Google. Only visitors who clicked Accept in the cookie banner are counted, and your own visits while signed in to the admin are skipped. Times are Amsterdam time."
      />
      <SavedNotice show={sp.saved === "1"}>Saved. Search engines can now verify your website.</SavedNotice>
      <SavedNotice show={sp.cleared === "1"}>All visitor statistics were deleted.</SavedNotice>

      <div className="mb-6 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-neutral-500">Period:</span>
        {PERIODS.map((d) => (
          <Link
            key={d}
            href={periodLink(d)}
            className={`border px-3 py-1.5 ${d === days ? "border-black bg-black text-white" : "border-neutral-300 bg-white text-black hover:border-black"}`}
          >
            Last {d} days
          </Link>
        ))}
      </div>

      {/* ── Key numbers ── */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Live now" value={String(liveNow)} hint="active in the last 5 minutes" strong={liveNow > 0} />
        <Stat label="Visitors" value={String(visitors)} hint={`${returning} came back more than once`} />
        <Stat label="Visits" value={String(sessions.length)} hint="a visit ends after 30 min without activity" />
        <Stat label="Page views" value={String(views.length)} hint={`${sessions.length ? (views.length / sessions.length).toFixed(1) : "0"} pages per visit`} />
        <Stat label="Avg. visit duration" value={sessions.length ? duration(totalTime / sessions.length) : "–"} hint="time the page was actually open and visible" />
        <Stat label="Bounce rate" value={pct(bounces, sessions.length)} hint="visits that only saw one page" />
        <Stat label="Cookies accepted" value={pct(accepted, accepted + rejected)} hint={`${accepted} accepted · ${rejected} rejected`} />
        <Stat label="Statistics kept" value="13 months" hint="older data is deleted automatically" />
      </div>

      <div className="grid gap-6">
        {/* ── Visitors per day ── */}
        <Card title="Visitors per day">
          {sessions.length === 0 ? (
            <Empty />
          ) : (
            <div>
              <div className="flex h-40 items-end gap-[2px]" role="img" aria-label="Bar chart of unique visitors per day">
                {chart.map((c) => (
                  <div key={c.key} className="group relative flex h-full flex-1 items-end" title={`${c.label}: ${c.value} visitor${c.value === 1 ? "" : "s"}`}>
                    <div className="w-full bg-black group-hover:bg-neutral-500" style={{ height: `${(c.value / chartMax) * 100}%`, minHeight: c.value ? 2 : 0 }} />
                  </div>
                ))}
              </div>
              <div className="mt-2 flex justify-between border-t border-neutral-200 pt-1 text-[11px] text-neutral-500">
                <span>{chart[0].label}</span>
                <span>Most in one day: {chartMax}</span>
                <span>{chart[chart.length - 1].label}</span>
              </div>
            </div>
          )}
        </Card>

        {/* ── Pages ── */}
        <Card title="Most viewed pages">
          {topPages.length === 0 ? (
            <Empty />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wider text-neutral-500">
                  <tr>
                    <th className="pb-2 font-medium">Page</th>
                    <th className="pb-2 text-right font-medium">Views</th>
                    <th className="pb-2 pl-4 text-right font-medium whitespace-nowrap">Avg. time on page</th>
                  </tr>
                </thead>
                <tbody>
                  {topPages.map(([path, p]) => (
                    <tr key={path} className="border-t border-neutral-100">
                      <td className="py-2 pr-4">
                        <a href={path} target="_blank" rel="noreferrer" className="text-black hover:underline">
                          {p.title || path}
                        </a>
                        <div className="font-mono text-[11px] break-all text-neutral-500">{path}</div>
                      </td>
                      <td className="py-2 text-right tabular-nums">{p.views}</td>
                      <td className="py-2 pl-4 text-right tabular-nums">{p.timed ? duration(p.time / p.timed) : "–"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <BarList title="Where visitors come from" rows={topList(sessions, source)} total={sessions.length} note="Search engines, social media and other websites that link to you. Add ?utm_source=instagram to links you share to see them here as a campaign." />
          <BarList title="Locations" rows={topList(sessions, location)} total={sessions.length} note="Country when the hosting provides it, otherwise the visitor's time zone (approximate). No IP addresses are stored." />
          <BarList title="Landing pages" rows={topList(sessions, (s) => s.landingPath)} total={sessions.length} note="The first page of a visit." mono />
          <BarList title="Devices" rows={topList(sessions, (s) => s.device)} total={sessions.length} />
          <BarList title="Browsers" rows={topList(sessions, (s) => s.browser)} total={sessions.length} />
          <BarList title="Operating systems" rows={topList(sessions, (s) => s.os)} total={sessions.length} />
          <BarList title="Browser languages" rows={topList(sessions, (s) => s.language)} total={sessions.length} />
        </div>

        {/* ── Recent visits ── */}
        <Card title="Recent visits">
          {sessions.length === 0 ? (
            <Empty />
          ) : (
            <ul className="divide-y divide-neutral-100 text-sm">
              {sessions.slice(0, 50).map((s) => (
                <li key={s.id}>
                  <details className="group">
                    <summary className="grid cursor-pointer list-none gap-1 py-3 sm:grid-cols-[8rem_1fr_auto] sm:gap-4 [&::-webkit-details-marker]:hidden">
                      <span className="text-neutral-500 tabular-nums">{dateTime(s.startedAt)}</span>
                      <span className="min-w-0">
                        <span className="text-black">{location(s)}</span>
                        <span className="text-neutral-500">
                          {" "}
                          · {s.device}, {s.browser} on {s.os} · from {source(s)}
                        </span>
                      </span>
                      <span className="whitespace-nowrap text-neutral-700 tabular-nums">
                        {s.pageViews.length} page{s.pageViews.length === 1 ? "" : "s"} · {duration(visitTime(s))}
                        <span className="ml-2 inline-block text-neutral-400 transition-transform group-open:rotate-90" aria-hidden>
                          ›
                        </span>
                      </span>
                    </summary>
                    <ol className="mb-3 ml-0 space-y-1 border-l border-neutral-200 pl-4 text-xs sm:ml-[9rem]">
                      {s.pageViews.map((v, i) => (
                        <li key={i} className="flex justify-between gap-4">
                          <span className="min-w-0 break-all font-mono text-neutral-700">{v.path}</span>
                          <span className="shrink-0 text-neutral-500 tabular-nums">{v.durationMs ? duration(v.durationMs) : "–"}</span>
                        </li>
                      ))}
                    </ol>
                  </details>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-xs text-neutral-500">Click a visit to see the pages in the order they were viewed. Each visitor is only a random number: you can see what was looked at, not who it was.</p>
        </Card>

        {/* ── SEO ── */}
        <div id="seo" className="scroll-mt-6">
          <Card title="SEO: get found in Google">
            <ul className="mb-6 space-y-2 text-sm">
              {checks.map((c, i) => (
                <li key={i} className="flex gap-3">
                  <span className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center text-xs ${c.ok ? "bg-black text-white" : "border border-black text-black"}`} aria-label={c.ok ? "OK" : "To do"}>
                    {c.ok ? "✓" : "!"}
                  </span>
                  <span className="text-neutral-800">{c.text}</span>
                </li>
              ))}
            </ul>

            {postIssues.length > 0 && (
              <div className="mb-6 border border-neutral-200 p-4 text-sm">
                <p className="mb-2 font-medium text-black">Blog posts to improve</p>
                <ul className="space-y-1">
                  {postIssues.map(({ p, issues }) => (
                    <li key={p.slug}>
                      <Link href="/admin/blog" className="underline underline-offset-2">
                        {p.title}
                      </Link>
                      <span className="text-neutral-500">: {issues.join(", ")}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mb-6 grid gap-2 text-sm sm:grid-cols-3">
              <a href="/sitemap.xml" target="_blank" className="border border-neutral-300 px-3 py-2 hover:border-black">
                Sitemap ↗<span className="block text-xs text-neutral-500">All pages for search engines</span>
              </a>
              <a href="/robots.txt" target="_blank" className="border border-neutral-300 px-3 py-2 hover:border-black">
                robots.txt ↗<span className="block text-xs text-neutral-500">What search engines may visit</span>
              </a>
              <a href="/blog/rss.xml" target="_blank" className="border border-neutral-300 px-3 py-2 hover:border-black">
                Blog RSS feed ↗<span className="block text-xs text-neutral-500">For feed readers</span>
              </a>
            </div>

            <form action={saveSeoVerificationAction} className="grid gap-4 border-t border-neutral-200 pt-6">
              <p className="text-sm text-neutral-700">
                <strong>Connect Google Search Console</strong> (free) to see which search words people use to find you and how high you rank:
              </p>
              <ol className="ml-5 list-decimal space-y-1 text-sm text-neutral-700">
                <li>
                  Go to{" "}
                  <a href="https://search.google.com/search-console" target="_blank" rel="noreferrer" className="underline underline-offset-2">
                    search.google.com/search-console
                  </a>{" "}
                  and click <em>Add property</em> → <em>URL prefix</em> → <span className="font-mono">{siteUrl}</span>.
                </li>
                <li>
                  Choose the <em>HTML tag</em> method, copy the tag and paste it below. Save, then click <em>Verify</em> in Google (after your next deploy).
                </li>
                <li>
                  In Search Console, open <em>Sitemaps</em> and submit <span className="font-mono">{absoluteUrl("/sitemap.xml")}</span>.
                </li>
              </ol>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="googleVerification" className={labelClass}>
                    Google verification code
                  </label>
                  <input id="googleVerification" name="googleVerification" defaultValue={settings.googleVerification} placeholder={`Built in: ${GOOGLE_SITE_VERIFICATION}`} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="bingVerification" className={labelClass}>
                    Bing verification code <span className="normal-case tracking-normal text-neutral-400">(optional)</span>
                  </label>
                  <input id="bingVerification" name="bingVerification" defaultValue={settings.bingVerification} placeholder='<meta name="msvalidate.01" content="…" />' className={inputClass} />
                </div>
              </div>
              <p className="text-xs text-neutral-500">You can paste the whole &lt;meta&gt; tag or just the code. Bing Webmaster Tools can also import your site straight from Google Search Console.</p>
              <div>
                <SubmitButton>Save codes</SubmitButton>
              </div>
            </form>
          </Card>
        </div>

        <Card title="Privacy">
          <ul className="ml-5 list-disc space-y-1 text-sm text-neutral-700">
            <li>Visitors are only counted after they click <strong>Accept</strong> in the cookie banner. Visitors who reject are not counted at all, so the real number of visitors is higher.</li>
            <li>No IP addresses, names or email addresses are stored: each visitor is a random number kept in their own browser.</li>
            <li>The data stays on your own server and is deleted automatically after 13 months.</li>
            <li>
              Visitors can change their choice at any time with <em>Cookie settings</em> at the bottom of every page. The texts are in{" "}
              <Link href="/admin/legal#cookiePolicyText" className="underline underline-offset-2">
                Legal → Cookie policy
              </Link>
              .
            </li>
          </ul>
          <form action={clearTrafficStatsAction} className="mt-5">
            <ConfirmButton
              message="Delete ALL visitor statistics and cookie-banner counts? This can't be undone."
              className="border border-neutral-300 bg-white px-3 py-1.5 text-xs text-neutral-700 hover:border-black hover:text-black"
            >
              Delete all statistics
            </ConfirmButton>
          </form>
        </Card>
      </div>
    </>
  );
}

function Stat({ label, value, hint, strong }: { label: string; value: string; hint?: string; strong?: boolean }) {
  return (
    <div className={`border bg-white p-4 ${strong ? "border-black" : "border-neutral-200"}`}>
      <p className="text-xs uppercase tracking-wider text-neutral-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-black tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-[11px] leading-snug text-neutral-500">{hint}</p>}
    </div>
  );
}

function BarList({ title, rows, total, note, mono }: { title: string; rows: [string, number][]; total: number; note?: string; mono?: boolean }) {
  const max = Math.max(1, ...rows.map((r) => r[1]));
  return (
    <Card title={title}>
      {rows.length === 0 ? (
        <Empty />
      ) : (
        <ul className="space-y-1.5 text-sm">
          {rows.map(([label, n]) => (
            <li key={label} className="relative">
              <div className="absolute inset-y-0 left-0 bg-neutral-100" style={{ width: `${(n / max) * 100}%` }} aria-hidden />
              <div className="relative flex justify-between gap-3 px-2 py-1">
                <span className={`min-w-0 truncate text-black ${mono ? "font-mono text-xs leading-5" : ""}`} title={label}>
                  {label}
                </span>
                <span className="shrink-0 text-neutral-600 tabular-nums">
                  {n} <span className="text-neutral-400">· {pct(n, total)}</span>
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
      {note && <p className="mt-4 text-xs text-neutral-500">{note}</p>}
    </Card>
  );
}

function Empty() {
  return <p className="text-sm text-neutral-500">No visits in this period yet. Visitors are counted once they accept cookies.</p>;
}
