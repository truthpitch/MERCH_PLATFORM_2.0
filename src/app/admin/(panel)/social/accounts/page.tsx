import { Card, PageTitle, SavedNotice } from "@/components/admin/Card";
import { smallButtonClass } from "@/components/admin/styles";
import { ConfirmButton } from "@/components/admin/ui";
import { prisma } from "@/lib/db";
import { isTokenKeyConfigured } from "@/lib/social/crypto";
import { accountState, type AccountState } from "@/lib/social/engine";
import { isSocialMock } from "@/lib/social/mock";
import { formatAmsterdam } from "@/lib/social/time";
import { PLATFORMS, PLATFORM_LABEL, type Platform } from "@/lib/social/types";
import { connectMockAccountAction, disconnectSocialAccountAction } from "../../../social-actions";

const STATE: Record<AccountState, { label: string; style: string }> = {
  connected: { label: "Connected", style: "bg-black text-white" },
  expiring: { label: "Expiring soon", style: "border border-black text-black" },
  expired: { label: "Expired", style: "bg-red-700 text-white" },
};

const DONE: Record<string, string> = {
  connected: "Account connected.",
  disconnected: "Account disconnected. Its token has been deleted.",
};

const ABOUT: Record<Platform, string> = {
  INSTAGRAM: "Needs an Instagram Business or Creator account. No Facebook Page required.",
  THREADS: "Your Threads profile. Text posts and posts with one image.",
};

export default async function SocialAccounts({ searchParams }: { searchParams: Promise<{ done?: string; error?: string }> }) {
  const sp = await searchParams;
  const accounts = await prisma.socialAccount.findMany({ orderBy: { createdAt: "asc" } });
  const mock = isSocialMock();
  const keyOk = isTokenKeyConfigured();

  return (
    <>
      <PageTitle
        title="Social accounts"
        description="Connect the Instagram and Threads accounts you want to post to. Access is renewed automatically every ~60 days by the cron job."
      />
      <SavedNotice show={Boolean(sp.done && DONE[sp.done])}>{sp.done ? DONE[sp.done] : ""}</SavedNotice>
      {(!keyOk || sp.error === "key") && (
        <p className="mb-6 border border-black bg-white px-4 py-3 text-sm text-black">
          <strong>SOCIAL_TOKEN_KEY is not set.</strong> Add it to the server&apos;s environment variables before connecting accounts (see SETUP.md).
        </p>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {PLATFORMS.map((platform) => {
          const list = accounts.filter((a) => a.platform === platform);
          return (
            <Card key={platform} title={PLATFORM_LABEL[platform]}>
              <p className="mb-4 text-sm text-neutral-600">{ABOUT[platform]}</p>
              {list.length === 0 && <p className="mb-4 text-sm text-neutral-500">Not connected.</p>}
              <ul className="mb-4 divide-y divide-neutral-200">
                {list.map((a) => {
                  const s = STATE[accountState(a.expiresAt)];
                  return (
                    <li key={a.id} className="py-3 first:pt-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-black">@{a.username || a.externalUserId}</span>
                        <span className={`px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${s.style}`}>{s.label}</span>
                      </div>
                      <p className="mt-1 text-xs text-neutral-500">
                        {a.expiresAt ? `Access valid until ${formatAmsterdam(a.expiresAt)}` : "No expiry date known"} · connected {formatAmsterdam(a.createdAt)}
                      </p>
                      {a.lastRefreshError && <p className="mt-1 text-xs text-red-700">Last renewal failed: {a.lastRefreshError}</p>}
                      <div className="mt-2 flex flex-wrap gap-2">
                        {mock && (
                          <form action={connectMockAccountAction}>
                            <input type="hidden" name="platform" value={platform} />
                            <button className={smallButtonClass}>Reconnect</button>
                          </form>
                        )}
                        <form action={disconnectSocialAccountAction}>
                          <input type="hidden" name="id" value={a.id} />
                          <ConfirmButton
                            className={smallButtonClass}
                            message={`Disconnect @${a.username}? Scheduled posts for this account won't be posted (they'll show as failed).`}
                          >
                            Disconnect
                          </ConfirmButton>
                        </form>
                      </div>
                    </li>
                  );
                })}
              </ul>
              {mock ? (
                list.length === 0 && (
                  <form action={connectMockAccountAction}>
                    <input type="hidden" name="platform" value={platform} />
                    <button className="bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800">Connect test account</button>
                  </form>
                )
              ) : (
                <p className="text-xs text-neutral-500">Connecting a real {PLATFORM_LABEL[platform]} account comes in the next step.</p>
              )}
            </Card>
          );
        })}
      </div>
    </>
  );
}
