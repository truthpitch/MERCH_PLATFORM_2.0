// Serves admin-uploaded images from UPLOAD_DIR at /media/<filename> or /media/<folder>/<filename>.
// (Files added to /public after a build aren't served by Next.js, so uploads live outside it.)
import { readFile } from "node:fs/promises";
import path from "node:path";
import { MIME_BY_EXT, getUploadDir, isSafeFilename } from "@/lib/uploads";

export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const parts = (await params).path ?? [];
  const file = parts.map((p) => decodeURIComponent(p)).join("/");
  // Only names the site generated itself: at most one folder, no "..", no other characters.
  if (!isSafeFilename(file)) return new Response("Not found", { status: 404 });
  try {
    const data = await readFile(path.join(getUploadDir(), ...file.split("/")));
    const ext = file.split(".").pop()!;
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": MIME_BY_EXT[ext] ?? "application/octet-stream",
        // A file at a given address never changes (new uploads get a new name), so browsers may cache it for long.
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
