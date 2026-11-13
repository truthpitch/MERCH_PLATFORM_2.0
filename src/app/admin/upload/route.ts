// Image upload endpoint for the admin Media page (plain multipart form POST).
import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ALLOWED_UPLOAD_TYPES, MAX_UPLOAD_BYTES, getUploadDir } from "@/lib/uploads";

// Relative Location header works behind Hostinger's reverse proxy.
const back = (query: string) => new Response(null, { status: 303, headers: { Location: `/admin/media?${query}` } });

export async function POST(request: Request) {
  if (!(await isAdmin())) return new Response(null, { status: 303, headers: { Location: "/admin/login" } });

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return back("error=missing");

  const ext = ALLOWED_UPLOAD_TYPES[file.type];
  if (!ext) return back("error=type");
  if (file.size > MAX_UPLOAD_BYTES) return back("error=size");

  const filename = `${Date.now()}-${randomBytes(4).toString("hex")}.${ext}`;
  const dir = getUploadDir();
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()));

  await prisma.media.create({
    data: { filename, originalName: file.name.slice(0, 200), mimeType: file.type, size: file.size },
  });

  return back("uploaded=1");
}
