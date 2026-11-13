// Serves admin-uploaded images from UPLOAD_DIR at /media/<filename>.
// (Files added to /public after a build aren't served by Next.js, so uploads live outside it.)
import { readFile } from "node:fs/promises";
import path from "node:path";
import { MIME_BY_EXT, getUploadDir, isSafeFilename } from "@/lib/uploads";

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  if (!isSafeFilename(file)) return new Response("Not found", { status: 404 });
  try {
    const data = await readFile(path.join(getUploadDir(), file));
    const ext = file.split(".").pop()!;
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": MIME_BY_EXT[ext] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable", // filenames are unique
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
