import { Card, PageTitle, SavedNotice } from "@/components/admin/Card";
import { inputClass, smallButtonClass } from "@/components/admin/styles";
import { SubmitButton } from "@/components/admin/ui";
import { prisma } from "@/lib/db";
import { deleteMediaAction } from "../../actions";

const ERRORS: Record<string, string> = {
  missing: "Choose an image to upload.",
  type: "Only JPG, PNG, WebP or GIF images are allowed.",
  size: "Images must be 5 MB or smaller.",
};

export default async function MediaAdmin({ searchParams }: { searchParams: Promise<{ uploaded?: string; error?: string }> }) {
  const [media, sp] = await Promise.all([prisma.media.findMany({ orderBy: { createdAt: "desc" } }), searchParams]);

  return (
    <>
      <PageTitle title="Media" description="Upload images, then paste their URL into the homepage or a product story." />
      <SavedNotice show={sp.uploaded === "1"}>Image uploaded.</SavedNotice>
      {sp.error && ERRORS[sp.error] && <SavedNotice show>{ERRORS[sp.error]}</SavedNotice>}

      <div className="grid gap-6">
        <Card title="Upload">
          {/* Posts to a route handler (src/app/admin/upload/route.ts) so large files aren't limited by server-action body size. */}
          <form action="/admin/upload" method="post" encType="multipart/form-data" className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input type="file" name="file" accept="image/jpeg,image/png,image/webp,image/gif" required className={`${inputClass} file:mr-3 file:border-0 file:bg-neutral-200 file:px-3 file:py-1 file:text-sm`} />
            <SubmitButton>Upload</SubmitButton>
          </form>
          <p className="mt-2 text-xs text-neutral-500">JPG, PNG, WebP or GIF · max 5 MB.</p>
        </Card>

        <Card title={`Library (${media.length})`}>
          {media.length === 0 ? (
            <p className="text-sm text-neutral-600">No images yet.</p>
          ) : (
            <ul className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {media.map((m) => {
                const url = `/media/${m.filename}`;
                return (
                  <li key={m.id} className="border border-neutral-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={m.originalName} loading="lazy" className="aspect-square w-full bg-neutral-100 object-cover" />
                    <div className="space-y-2 p-3">
                      <p className="truncate text-xs text-neutral-600" title={m.originalName}>
                        {m.originalName}
                      </p>
                      <input readOnly value={url} className={`${inputClass} text-xs`} aria-label="Image URL" />
                      <form action={deleteMediaAction}>
                        <input type="hidden" name="id" value={m.id} />
                        <button className={smallButtonClass}>Delete</button>
                      </form>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
