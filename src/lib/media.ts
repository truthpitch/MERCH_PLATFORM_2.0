// Media library: images uploaded in admin → Media (or from the blog editor), sorted into folders.
//
// Files are stored by name inside their folder: uploads/blog/summer-tee.jpg → /media/blog/summer-tee.jpg.
// A duplicate name in the same folder gets a number: "Summer tee (1)" → summer-tee-1.jpg.
// Moving an image to another folder only changes its label, so its URL (used in posts and
// pages) never breaks.
import { mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "./db";
import { MAX_UPLOAD_BYTES, detectFaviconType, getUploadDir } from "./uploads";

export type MediaItem = { id: number; name: string; folder: string; url: string; size: number; createdAt: Date };
export type MediaFolderInfo = { slug: string; name: string; count: number };

const IMAGE_MIME: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif" };

export const mediaUrl = (filename: string) => `/media/${filename.split("/").map(encodeURIComponent).join("/")}`;

/** "Summer Tee (final).JPG" → display "Summer Tee (final)", file part "summer-tee-final". */
function splitName(originalName: string) {
  const base = originalName.replace(/\.[^.]*$/, "").replace(/\s+/g, " ").trim().slice(0, 100) || "image";
  const slug =
    base
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "image";
  return { base, slug };
}

export function folderSlug(name: string): string {
  return (
    name
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || ""
  );
}

export async function listFolders(): Promise<MediaFolderInfo[]> {
  const [folders, counts] = await Promise.all([
    prisma.mediaFolder.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.media.groupBy({ by: ["folder"], _count: { _all: true } }),
  ]);
  const byFolder = new Map(counts.map((c) => [c.folder, c._count._all]));
  // "General" first, then the rest alphabetically.
  return folders
    .map((f) => ({ slug: f.slug, name: f.name, count: byFolder.get(f.slug) ?? 0 }))
    .sort((a, b) => (a.slug === "general" ? -1 : b.slug === "general" ? 1 : a.name.localeCompare(b.name)));
}

export async function listMedia({ folder, q }: { folder?: string; q?: string } = {}): Promise<MediaItem[]> {
  const rows = await prisma.media.findMany({
    where: { ...(folder ? { folder } : {}), ...(q ? { OR: [{ name: { contains: q } }, { originalName: { contains: q } }] } : {}) },
    orderBy: { createdAt: "desc" },
    take: 500,
  });
  return rows.map((m) => ({ id: m.id, name: m.name || m.originalName, folder: m.folder, url: mediaUrl(m.filename), size: m.size, createdAt: m.createdAt }));
}

export type UploadResult = { ok: true; item: MediaItem } | { ok: false; name: string; error: string };

/** Saves one uploaded image into a folder under its own name ("(1)", "(2)" … for duplicates). */
export async function saveUpload(file: File, folderInput: string): Promise<UploadResult> {
  const original = file.name || "image";
  if (file.size === 0) return { ok: false, name: original, error: "The file is empty." };
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, name: original, error: "Larger than 5 MB." };

  const bytes = new Uint8Array(await file.arrayBuffer());
  // Check what the file really is, not what its name or the browser claims.
  const ext = detectFaviconType(bytes);
  if (!ext || ext === "ico") return { ok: false, name: original, error: "Not a JPG, PNG, WebP or GIF image." };

  const folder = (await prisma.mediaFolder.findUnique({ where: { slug: folderInput } }))?.slug ?? "general";
  const { base, slug } = splitName(original);
  const dir = path.join(getUploadDir(), folder);
  await mkdir(dir, { recursive: true });

  // Find the first free number: summer-tee.jpg, summer-tee-1.jpg, summer-tee-2.jpg …
  for (let n = 0; n < 1000; n++) {
    const filename = `${folder}/${slug}${n ? `-${n}` : ""}.${ext}`;
    const name = n ? `${base} (${n})` : base;
    const taken =
      (await prisma.media.findFirst({ where: { OR: [{ filename }, { folder, name }] }, select: { id: true } })) ||
      (await stat(path.join(getUploadDir(), filename)).then(
        () => true,
        () => false,
      ));
    if (taken) continue;
    await writeFile(path.join(getUploadDir(), filename), bytes, { flag: "wx" });
    const m = await prisma.media.create({ data: { filename, name, folder, originalName: original.slice(0, 200), mimeType: IMAGE_MIME[ext], size: file.size } });
    return { ok: true, item: { id: m.id, name: m.name, folder: m.folder, url: mediaUrl(m.filename), size: m.size, createdAt: m.createdAt } };
  }
  return { ok: false, name: original, error: "Too many files with this name." };
}

/** Everything the blog editor's image picker needs: all images and the folders. */
export async function pickerData() {
  const [items, folders] = await Promise.all([listMedia(), listFolders()]);
  return {
    media: items.map(({ id, name, folder, url }) => ({ id, name, folder, url })),
    folders: folders.map(({ slug, name }) => ({ slug, name })),
  };
}
