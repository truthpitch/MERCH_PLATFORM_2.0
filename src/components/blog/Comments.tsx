import { CommentForm } from "./CommentForm";

type Comment = { id: number; name: string; body: string; createdAt: Date };

const date = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Amsterdam" });

/** Approved replies under a blog post, plus the form to write one. */
export function Comments({ slug, comments, signedInAs, canReply }: { slug: string; comments: Comment[]; signedInAs: string | null; canReply: boolean }) {
  return (
    <section id="replies" aria-labelledby="replies-title" className="mt-14 border-t border-neutral-200 pt-10">
      <h2 id="replies-title" className="text-xs font-semibold uppercase tracking-[0.2em] text-black">
        Replies{comments.length > 0 && ` (${comments.length})`}
      </h2>
      {comments.length === 0 ? (
        <p className="mt-4 text-sm text-neutral-600">No replies yet. Be the first to share your thoughts.</p>
      ) : (
        <ol className="mt-6 divide-y divide-neutral-200 border-y border-neutral-200">
          {comments.map((c) => (
            <li key={c.id} id={`reply-${c.id}`} className="py-5">
              <p className="text-sm">
                <span className="font-semibold text-black">{c.name}</span>
                <span className="text-neutral-500">
                  {" · "}
                  <time dateTime={c.createdAt.toISOString()}>{date(c.createdAt)}</time>
                </span>
              </p>
              <p className="mt-2 whitespace-pre-line break-words leading-relaxed text-neutral-700">{c.body}</p>
            </li>
          ))}
        </ol>
      )}
      <div className="mt-8">
        {canReply ? (
          <CommentForm slug={slug} signedInAs={signedInAs} />
        ) : (
          <p className="text-sm text-neutral-500">Replies open once this post is published.</p>
        )}
      </div>
    </section>
  );
}
