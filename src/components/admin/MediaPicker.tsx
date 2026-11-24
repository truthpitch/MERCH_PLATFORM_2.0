"use client";

import { useMemo, useRef, useState } from "react";
import { inputClass, smallButtonClass } from "./styles";

export type PickerImage = { id: number; name: string; folder: string; url: string };
export type PickerFolder = { slug: string; name: string };

/**
 * "Choose image" window for the blog editor: search the Media library by name, filter by folder,
 * upload new images (they go straight into the library), then insert one into the text or use it
 * as the cover. Uses the same upload endpoint as the Media tab, asking for JSON so the post stays open.
 */
export function MediaPicker({
  images: initialImages,
  folders,
  defaultFolder = "blog",
  onInsert,
  onCover,
  label = "Choose image",
}: {
  images: PickerImage[];
  folders: PickerFolder[];
  defaultFolder?: string;
  onInsert?: (image: PickerImage) => void;
  onCover?: (image: PickerImage) => void;
  label?: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState(initialImages);
  const [q, setQ] = useState("");
  const [folder, setFolder] = useState("");
  const [uploadFolder, setUploadFolder] = useState(folders.some((f) => f.slug === defaultFolder) ? defaultFolder : "general");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const folderName = useMemo(() => new Map(folders.map((f) => [f.slug, f.name])), [folders]);

  const shown = images.filter((i) => (!folder || i.folder === folder) && (!q.trim() || i.name.toLowerCase().includes(q.trim().toLowerCase())));

  async function upload() {
    const files = fileInput.current?.files;
    if (!files || files.length === 0) return setMessage("Choose one or more images first.");
    const body = new FormData();
    body.set("folder", uploadFolder);
    for (const f of Array.from(files)) body.append("file", f);
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/admin/upload", { method: "POST", body, headers: { Accept: "application/json" } });
      const json = (await res.json()) as { uploaded?: PickerImage[]; failed?: { name: string; error: string }[]; error?: string };
      if (!res.ok) throw new Error(json.error || "Upload failed.");
      const added = json.uploaded ?? [];
      setImages((prev) => [...added, ...prev]);
      setFolder(uploadFolder);
      setQ("");
      const failed = (json.failed ?? []).map((f) => `${f.name}: ${f.error}`).join(" · ");
      setMessage(`${added.length} uploaded to ${folderName.get(uploadFolder) ?? uploadFolder}.${failed ? ` Not uploaded: ${failed}` : ""}`);
      if (fileInput.current) fileInput.current.value = "";
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  // Close first: while the window is open, the page behind it can't receive the image.
  const choose = (fn: ((i: PickerImage) => void) | undefined, image: PickerImage) => {
    dialog.current?.close();
    fn?.(image);
  };

  return (
    <>
      <button type="button" onClick={() => dialog.current?.showModal()} className={smallButtonClass}>
        {label}
      </button>
      <dialog
        ref={dialog}
        aria-label="Choose an image"
        className="m-auto w-[min(56rem,calc(100vw-2rem))] max-w-none border border-neutral-300 bg-white p-0 text-black backdrop:bg-black/40"
        onClick={(e) => {
          if (e.target === dialog.current) dialog.current?.close(); // click on the dark background closes it
        }}
      >
        <div className="flex max-h-[85vh] flex-col">
          <div className="flex items-center justify-between gap-4 border-b border-neutral-200 px-5 py-4">
            <p className="text-sm font-semibold uppercase tracking-wider">Choose an image</p>
            <button type="button" onClick={() => dialog.current?.close()} aria-label="Close" className="text-2xl leading-none text-neutral-600 hover:text-black">
              ×
            </button>
          </div>

          <div className="grid gap-2 border-b border-neutral-200 px-5 py-3 sm:grid-cols-[1fr_12rem]">
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name" aria-label="Search images by name" className={inputClass} />
            <select value={folder} onChange={(e) => setFolder(e.target.value)} aria-label="Folder" className={inputClass}>
              <option value="">All folders</option>
              {folders.map((f) => (
                <option key={f.slug} value={f.slug}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            {shown.length === 0 ? (
              <p className="text-sm text-neutral-600">No images found. Upload one below.</p>
            ) : (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {shown.map((img) => (
                  <li key={img.id} className="border border-neutral-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt={img.name} loading="lazy" className="aspect-square w-full bg-neutral-100 object-cover" />
                    <div className="space-y-1.5 p-2">
                      <p className="truncate text-xs font-medium" title={img.name}>
                        {img.name}
                      </p>
                      <p className="text-[11px] text-neutral-500">{folderName.get(img.folder) ?? img.folder}</p>
                      <div className="flex flex-wrap gap-1">
                        {onInsert && (
                          <button type="button" onClick={() => choose(onInsert, img)} className="bg-black px-2 py-1 text-[11px] font-medium text-white hover:bg-neutral-800">
                            Insert in text
                          </button>
                        )}
                        {onCover && (
                          <button type="button" onClick={() => choose(onCover, img)} className={`${smallButtonClass} text-[11px]`}>
                            Use as cover
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-neutral-200 bg-neutral-50 px-5 py-3">
            <p className="text-xs font-medium uppercase tracking-wider text-neutral-600">Upload new images</p>
            <p className="mb-2 mt-1 text-xs text-neutral-500">
              Best sizes: <strong className="font-medium text-black">cover 1600 × 900 px</strong> (16:9) · <strong className="font-medium text-black">image in the text 1600 px wide</strong>{" "}
              · JPG or WebP for photos, under about 500 KB.
            </p>
            <div className="grid gap-2 sm:grid-cols-[1fr_10rem_auto] sm:items-center">
              <input
                ref={fileInput}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/gif"
                aria-label="Images to upload"
                className="text-sm file:mr-3 file:border-0 file:bg-neutral-200 file:px-3 file:py-1 file:text-sm"
              />
              <select value={uploadFolder} onChange={(e) => setUploadFolder(e.target.value)} aria-label="Upload into folder" className={inputClass}>
                {folders.map((f) => (
                  <option key={f.slug} value={f.slug}>
                    {f.name}
                  </option>
                ))}
              </select>
              <button type="button" onClick={upload} disabled={busy} className="bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:bg-neutral-400">
                {busy ? "Uploading…" : "Upload"}
              </button>
            </div>
            {message && (
              <p role="status" className="mt-2 text-xs text-neutral-700">
                {message}
              </p>
            )}
          </div>
        </div>
      </dialog>
    </>
  );
}
