import Link from "next/link";
import { Card, PageTitle, SavedNotice } from "@/components/admin/Card";
import { inputClass, labelClass, smallButtonClass } from "@/components/admin/styles";
import { SubmitButton } from "@/components/admin/ui";
import { prisma } from "@/lib/db";
import { isMailConfigured, notificationAddress } from "@/lib/mail";
import { getSettings } from "@/lib/settings";
import { deleteMessageAction, markAllMessagesReadAction, saveContactPageAction, setMessageReadAction } from "../../actions";

const dateFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" });

export default async function MessagesAdmin({ searchParams }: { searchParams: Promise<{ saved?: string; show?: string }> }) {
  const sp = await searchParams;
  const unreadOnly = sp.show === "unread";
  const [messages, unread, total, settings] = await Promise.all([
    prisma.contactMessage.findMany({
      where: unreadOnly ? { read: false } : undefined,
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.contactMessage.count({ where: { read: false } }),
    prisma.contactMessage.count(),
    getSettings(),
  ]);
  const mailOn = isMailConfigured();

  return (
    <>
      <PageTitle title="Messages" description="Everything sent through the contact form on /contact." />
      <SavedNotice show={sp.saved === "1"} />

      <div className="grid gap-6">
        <Card
          title={`Inbox (${unread} unread)`}
          actions={
            <div className="flex items-center gap-2">
              <Link href={unreadOnly ? "/admin/messages" : "/admin/messages?show=unread"} className={smallButtonClass}>
                {unreadOnly ? `Show all (${total})` : "Unread only"}
              </Link>
              {unread > 0 && (
                <form action={markAllMessagesReadAction}>
                  <button className={smallButtonClass}>Mark all read</button>
                </form>
              )}
            </div>
          }
        >
          {messages.length === 0 ? (
            <p className="text-sm text-neutral-600">{unreadOnly ? "No unread messages." : "No messages yet."}</p>
          ) : (
            <ul className="divide-y divide-neutral-200 border-y border-neutral-200">
              {messages.map((m) => {
                const replySubject = encodeURIComponent(`Re: ${m.subject || "Your message to TruthPitch"}`);
                return (
                  <li key={m.id}>
                    <details className="group">
                      <summary className="flex cursor-pointer list-none items-start gap-3 py-4 [&::-webkit-details-marker]:hidden">
                        <span
                          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${m.read ? "border border-neutral-300" : "bg-black"}`}
                          aria-label={m.read ? "Read" : "Unread"}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-baseline justify-between gap-x-4">
                            <span className={`text-sm ${m.read ? "text-neutral-700" : "font-semibold text-black"}`}>{m.name}</span>
                            <span className="text-xs text-neutral-500">{dateFormat.format(m.createdAt)}</span>
                          </span>
                          <span className="mt-0.5 block truncate text-sm text-neutral-600">
                            {m.subject ? <span className="text-neutral-900">{m.subject} · </span> : null}
                            {m.message}
                          </span>
                        </span>
                      </summary>
                      <div className="mb-5 ml-5 border-l border-neutral-200 pl-4">
                        <dl className="grid gap-1 text-sm sm:grid-cols-[8rem_1fr]">
                          <dt className="text-neutral-500">From</dt>
                          <dd className="break-all text-black">
                            {m.name} &lt;{m.email}&gt;
                          </dd>
                          {m.subject && (
                            <>
                              <dt className="text-neutral-500">Subject</dt>
                              <dd className="text-black">{m.subject}</dd>
                            </>
                          )}
                          {m.orderNumber && (
                            <>
                              <dt className="text-neutral-500">Order number</dt>
                              <dd className="text-black">{m.orderNumber}</dd>
                            </>
                          )}
                        </dl>
                        <p className="mt-4 whitespace-pre-wrap text-sm text-black">{m.message}</p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <a href={`mailto:${m.email}?subject=${replySubject}`} className={smallButtonClass}>
                            Reply by email
                          </a>
                          <form action={setMessageReadAction}>
                            <input type="hidden" name="id" value={m.id} />
                            <input type="hidden" name="read" value={m.read ? "0" : "1"} />
                            <button className={smallButtonClass}>{m.read ? "Mark unread" : "Mark read"}</button>
                          </form>
                          <form action={deleteMessageAction}>
                            <input type="hidden" name="id" value={m.id} />
                            <button className={smallButtonClass}>Delete</button>
                          </form>
                        </div>
                      </div>
                    </details>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="mt-4 text-xs text-neutral-500">
            {mailOn
              ? `New messages are also emailed to ${notificationAddress() || "(no address set)"}.`
              : "Email notifications are off. Add SMTP_HOST, SMTP_USER and SMTP_PASS to the environment variables to get an email for each new message."}
          </p>
        </Card>

        <Card title="Contact page">
          <form action={saveContactPageAction} className="space-y-4">
            <div>
              <label htmlFor="contactTitle" className={labelClass}>
                Title
              </label>
              <input id="contactTitle" name="contactTitle" defaultValue={settings.contactTitle} className={inputClass} />
            </div>
            <div>
              <label htmlFor="contactIntro" className={labelClass}>
                Intro text
              </label>
              <textarea id="contactIntro" name="contactIntro" rows={4} defaultValue={settings.contactIntro} className={inputClass} />
              <p className="mt-1 text-xs text-neutral-500">Leave an empty line between paragraphs.</p>
            </div>
            <div>
              <label htmlFor="contactEmail" className={labelClass}>
                Public email address (optional)
              </label>
              <input id="contactEmail" name="contactEmail" type="email" defaultValue={settings.contactEmail} className={inputClass} />
              <p className="mt-1 text-xs text-neutral-500">Shown next to the form. Leave empty to show only the form.</p>
            </div>
            <div className="flex items-center gap-4">
              <SubmitButton>Save contact page</SubmitButton>
              <Link href="/contact" target="_blank" className="text-sm text-neutral-600 underline underline-offset-4 hover:text-black">
                View page
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </>
  );
}
