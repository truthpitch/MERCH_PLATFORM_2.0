import Link from "next/link";
import { Card, PageTitle, SavedNotice } from "@/components/admin/Card";
import { CopyButton } from "@/components/admin/CopyButton";
import { inputClass, smallButtonClass } from "@/components/admin/styles";
import { ConfirmButton, SubmitButton } from "@/components/admin/ui";
import { IMAGE_FILE_TIPS, IMAGE_SIZES } from "@/lib/image-sizes";
import { listFolders, listMedia } from "@/lib/media";
import { createMediaFolderAction, deleteMediaAction, deleteMediaFolderAction, moveMediaAction, renameMediaAction } from "../../actions";

const DONE: Record<string, string> = {
  deleted: "Image deleted.",
  moved: "Image moved. Its URL stays the same, so pages that use it keep working.",
  renamed: "Image renamed.",
  "folder-created": "Folder created.",
  "folder-deleted": "Folder deleted.",
  "folder-exists": "A folder with that name already exists.",
  "folder-invalid": "Use letters or numbers in the folder name.",
  "folder-not-empty": "Only empty folders can be deleted. Move or delete its images first.",
  "folder-keep": "The General folder can't be deleted.",
};

const kb = (bytes: number) => (bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

export default async function MediaAdmin({
  searchParams,
}: {
  searchParams: Promise<{ folder?: string; q?: string; uploaded?: string; failed?: string; error?: string; done?: string }>;
}) {
  const sp = await searchParams;
  const folders = await listFolders();
  const folder = folders.some((f) => f.slug === sp.folder) ? sp.folder : undefined;
  const q = (sp.q ?? "").trim().slice(0, 100);
  const media = await listMedia({ folder, q: q || undefined });
  const total = folders.reduce((n, f) => n + f.count, 0);
  const current = folders.find((f) => f.slug === folder);
  const folderName = new Map(folders.map((f) => [f.slug, f.name]));
  const uploaded = Number(sp.uploaded) || 0;
  const href = (f?: string) => {
    const p = new URLSearchParams();
    if (f) p.set("folder", f);
    if (q) p.set("q", q);
    const s = p.toString();
    return `/admin/media${s ? `?${s}` : ""}`;
  };
  // Hidden fields so actions come back to the same folder and search.
  const back = (
    <>
      <input type="hidden" name="returnFolder" value={folder ?? ""} />
      <input type="hidden" name="returnQ" value={q} />
    </>
  );

  return (
    <>
      <PageTitle
        title="Media"
        description="Upload images into folders, find them by name, and use them on your pages and in blog posts. In the blog editor, use “Choose image” to insert one."
      />
      <SavedNotice show={uploaded > 0}>
        {uploaded} {uploaded === 1 ? "image" : "images"} uploaded{current ? ` to ${current.name}` : ""}.
      </SavedNotice>
      {sp.failed && <SavedNotice show>Not uploaded: {sp.failed}</SavedNotice>}
      {sp.error === "missing" && <SavedNotice show>Choose one or more images to upload.</SavedNotice>}
      <SavedNotice show={Boolean(sp.done && DONE[sp.done])}>{sp.done ? DONE[sp.done] : ""}</SavedNotice>

      <div className="grid gap-6 lg:grid-cols-[14rem_1fr]">
        {/* Folders */}
        <aside className="space-y-4">
          <nav aria-label="Folders" className="border border-neutral-200 bg-white">
            <p className="border-b border-neutral-200 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-black">Folders</p>
            <ul className="py-1 text-sm">
              <li>
                <Link
                  href={href()}
                  aria-current={!folder ? "page" : undefined}
                  className={`flex items-center justify-between px-4 py-2 ${!folder ? "bg-black text-white" : "text-black hover:bg-neutral-100"}`}
                >
                  All images <span className="text-xs opacity-70">{total}</span>
                </Link>
              </li>
              {folders.map((f) => (
                <li key={f.slug}>
                  <Link
                    href={href(f.slug)}
                    aria-current={folder === f.slug ? "page" : undefined}
                    className={`flex items-center justify-between px-4 py-2 ${folder === f.slug ? "bg-black text-white" : "text-black hover:bg-neutral-100"}`}
                  >
                    <span className="flex items-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                        <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
                      </svg>
                      {f.name}
                    </span>
                    <span className="text-xs opacity-70">{f.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <form action={createMediaFolderAction} className="flex gap-2">
            {back}
            <input name="name" required maxLength={40} placeholder="New folder name" aria-label="New folder name" className={inputClass} />
            <button className="shrink-0 border border-black bg-white px-3 text-sm font-medium text-black hover:bg-black hover:text-white">Add</button>
          </form>
          {current && current.slug !== "general" && current.count === 0 && (
            <form action={deleteMediaFolderAction}>
              {back}
              <input type="hidden" name="slug" value={current.slug} />
              <ConfirmButton className={smallButtonClass} message={`Delete the empty folder “${current.name}”?`}>
                Delete this folder
              </ConfirmButton>
            </form>
          )}
        </aside>

        <div className="min-w-0 space-y-6">
          {/* Upload */}
          <Card title="Upload images">
            {/* Posts to a route handler (src/app/admin/upload/route.ts) so large files aren't limited by server-action body size. */}
            <form action="/admin/upload" method="post" encType="multipart/form-data" className="grid gap-3 md:grid-cols-[1fr_12rem_auto] md:items-center">
              <input
                type="file"
                name="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/gif"
                required
                aria-label="Images to upload"
                className={`${inputClass} file:mr-3 file:border-0 file:bg-neutral-200 file:px-3 file:py-1 file:text-sm`}
              />
              <select name="folder" defaultValue={folder ?? "general"} aria-label="Folder to upload into" className={inputClass}>
                {folders.map((f) => (
                  <option key={f.slug} value={f.slug}>
                    {f.name}
                  </option>
                ))}
              </select>
              <SubmitButton>Upload</SubmitButton>
            </form>
            <p className="mt-2 text-xs text-neutral-500">
              JPG, PNG, WebP or GIF · max 5 MB each · up to 20 at once. See “Recommended image sizes” below for the best size per spot. Images keep their own name, so give files a clear name before uploading (good for Google
              Images too). A name that already exists in the folder gets a number: “Summer tee (1)”.
            </p>
          </Card>

          {/* Recommended sizes */}
          <details className="group border border-neutral-200 bg-white" open={total === 0}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-4 [&::-webkit-details-marker]:hidden">
              <span className="text-sm font-semibold uppercase tracking-wider text-black">Recommended image sizes</span>
              <span className="text-lg font-light leading-none text-black transition-transform group-open:rotate-45" aria-hidden>
                +
              </span>
            </summary>
            <div className="border-t border-neutral-200 px-6 py-5">
              <div className="-mx-6 overflow-x-auto px-6">
                <table className="w-full min-w-[36rem] text-left text-sm">
                  <thead className="border-b border-neutral-200 text-xs uppercase tracking-wider text-neutral-500">
                    <tr>
                      <th className="py-2 pr-4 font-medium">Used for</th>
                      <th className="py-2 pr-4 font-medium">Best size</th>
                      <th className="py-2 pr-4 font-medium">Shape</th>
                      <th className="py-2 font-medium">Good to know</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {IMAGE_SIZES.map((s) => (
                      <tr key={s.key} className="align-top">
                        <td className="py-2.5 pr-4 font-medium text-black">{s.where}</td>
                        <td className="whitespace-nowrap py-2.5 pr-4 text-black">{s.size}</td>
                        <td className="py-2.5 pr-4 text-neutral-700">{s.shape}</td>
                        <td className="py-2.5 text-xs text-neutral-600">{s.tip}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ul className="mt-4 list-disc space-y-1 pl-5 text-xs text-neutral-600">
                {IMAGE_FILE_TIPS.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          </details>

          {/* Search + list */}
          <Card title={`${current ? current.name : "All images"} (${media.length})`}>
            <form action="/admin/media" className="mb-5 flex gap-2">
              {folder && <input type="hidden" name="folder" value={folder} />}
              <input type="search" name="q" defaultValue={q} placeholder="Search images by name" aria-label="Search images by name" className={inputClass} />
              <button className="shrink-0 border border-neutral-300 bg-white px-4 text-sm font-medium text-black hover:border-black">Search</button>
              {q && (
                <Link href={href(folder)} className="shrink-0 self-center text-sm text-neutral-600 underline underline-offset-4">
                  Clear
                </Link>
              )}
            </form>

            {media.length === 0 ? (
              <p className="text-sm text-neutral-600">{q ? `No images match “${q}”.` : "No images in this folder yet."}</p>
            ) : (
              <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                {media.map((m) => (
                  <li key={m.id} className="flex flex-col border border-neutral-200">
                    <a href={m.url} target="_blank" rel="noreferrer" className="block bg-neutral-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={m.url} alt={m.name} loading="lazy" className="aspect-square w-full object-cover" />
                    </a>
                    <div className="flex flex-1 flex-col gap-2 p-3">
                      <p className="truncate text-sm font-medium text-black" title={m.name}>
                        {m.name}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {folderName.get(m.folder) ?? m.folder} · {kb(m.size)}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        <CopyButton text={m.url} />
                        <details className="group relative">
                          <summary className={`${smallButtonClass} cursor-pointer list-none`}>More</summary>
                          <div className="mt-2 space-y-2 border border-neutral-200 bg-white p-2">
                            <form action={renameMediaAction} className="flex gap-1">
                              {back}
                              <input type="hidden" name="id" value={m.id} />
                              <input name="name" defaultValue={m.name} maxLength={100} aria-label={`New name for ${m.name}`} className={`${inputClass} py-1 text-xs`} />
                              <button className={smallButtonClass}>Rename</button>
                            </form>
                            <form action={moveMediaAction} className="flex gap-1">
                              {back}
                              <input type="hidden" name="id" value={m.id} />
                              <select name="folder" defaultValue={m.folder} aria-label={`Move ${m.name} to folder`} className={`${inputClass} py-1 text-xs`}>
                                {folders.map((f) => (
                                  <option key={f.slug} value={f.slug}>
                                    {f.name}
                                  </option>
                                ))}
                              </select>
                              <button className={smallButtonClass}>Move</button>
                            </form>
                            <form action={deleteMediaAction}>
                              {back}
                              <input type="hidden" name="id" value={m.id} />
                              <ConfirmButton
                                className={smallButtonClass}
                                message={`Delete “${m.name}”? Pages or posts that use this image will show nothing in its place. This can't be undone.`}
                              >
                                Delete
                              </ConfirmButton>
                            </form>
                          </div>
                        </details>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
