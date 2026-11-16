// Favicon upload for the admin Dashboard (plain multipart form POST, like /admin/upload).
import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { MAX_FAVICON_BYTES, detectFaviconType, getUploadDir, removeFaviconFile } from "@/lib/uploads";

// Relative Location header works behind Hostinger's reverse proxy.
const back = (query: string) => new Response(null, { status: 303, headers: { Location: `/admin?${query}#favicon` } });

export async function POST(request: Request) {
  if (!(await isAdmin())) return new Response(null, { status: 303, headers: { Location: "/admin/login" } });

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return back("favicon=missing");
  if (file.size > MAX_FAVICON_BYTES) return back("favicon=size");

  const bytes = new Uint8Array(await file.arrayBuffer());
  const ext = detectFaviconType(bytes);
  if (!ext) return back("favicon=type");

  const filename = `favicon-${Date.now()}-${randomBytes(4).toString("hex")}.${ext}`;
  const dir = getUploadDir();
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), bytes);

  const previous = (await getSettings()).faviconUrl;
  const faviconUrl = `/media/${filename}`;
  await prisma.siteSettings.update({ where: { id: 1 }, data: { faviconUrl } });
  await removeFaviconFile(previous);

  revalidatePath("/", "layout");
  return back("favicon=saved");
}
