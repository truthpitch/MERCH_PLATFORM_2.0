// Image upload for admin → Media and the blog editor's image picker (multipart form POST).
// Several images at once; each is stored by name in the chosen folder (see src/lib/media.ts).
// The blog editor asks for JSON (Accept: application/json) so it can stay on the page;
// the Media tab gets a redirect back with a summary.
import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/auth";
import { saveUpload, type UploadResult } from "@/lib/media";

const MAX_FILES = 20;

export async function POST(request: Request) {
  const wantsJson = (request.headers.get("accept") ?? "").includes("application/json");
  if (!(await isAdmin())) {
    return wantsJson ? Response.json({ error: "Please log in again." }, { status: 401 }) : new Response(null, { status: 303, headers: { Location: "/admin/login" } });
  }

  const form = await request.formData();
  const folder = String(form.get("folder") ?? "general");
  const files = form.getAll("file").filter((f): f is File => f instanceof File && f.size > 0).slice(0, MAX_FILES);

  const results: UploadResult[] = [];
  for (const file of files) results.push(await saveUpload(file, folder));
  revalidatePath("/admin/media");

  const uploaded = results.flatMap((r) => (r.ok ? [r.item] : []));
  const failed = results.flatMap((r) => (r.ok ? [] : [{ name: r.name, error: r.error }]));

  if (wantsJson) return Response.json({ uploaded, failed });

  // Relative Location header works behind Hostinger's reverse proxy.
  const qs = new URLSearchParams({ folder: uploaded[0]?.folder ?? folder, uploaded: String(uploaded.length) });
  if (files.length === 0) qs.set("error", "missing");
  if (failed.length) qs.set("failed", failed.map((f) => `${f.name}: ${f.error}`).join(" | ").slice(0, 600));
  return new Response(null, { status: 303, headers: { Location: `/admin/media?${qs}` } });
}
