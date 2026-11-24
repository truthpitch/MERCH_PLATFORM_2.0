"use client";

import { useRef, useState } from "react";
import { deleteMediaAction, moveMediaAction, renameMediaAction } from "@/app/admin/actions";
import { inputClass, labelClass, smallButtonClass } from "./styles";
import { ConfirmButton, SubmitButton } from "./ui";

type Item = { id: number; name: string; folder: string; url: string; sizeLabel: string };

/**
 * "Edit" window for one image on the Media tab: a large preview, the full name and URL,
 * and roomy fields to rename, move or delete it (the card itself is too narrow for that).
 */
export function MediaEditDialog({
  item,
  folders,
  returnFolder,
  returnQ,
}: {
  item: Item;
  folders: { slug: string; name: string }[];
  returnFolder: string;
  returnQ: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [copied, setCopied] = useState(false);
  const folderName = folders.find((f) => f.slug === item.folder)?.name ?? item.folder;
  const back = (
    <>
      <input type="hidden" name="id" value={item.id} />
      <input type="hidden" name="returnFolder" value={returnFolder} />
      <input type="hidden" name="returnQ" value={returnQ} />
    </>
  );

  return (
    <>
      <button type="button" onClick={() => dialog.current?.showModal()} className={smallButtonClass}>
        Edit
      </button>
      <dialog
        ref={dialog}
        aria-label={`Edit image ${item.name}`}
        className="m-auto w-[min(44rem,calc(100vw-2rem))] max-w-none border border-neutral-300 bg-white p-0 text-black backdrop:bg-black/40"
        onClick={(e) => {
          if (e.target === dialog.current) dialog.current?.close();
        }}
      >
        <div className="flex max-h-[90vh] flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-neutral-200 px-6 py-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Edit image</p>
              <p className="mt-1 break-words text-lg font-semibold">{item.name}</p>
              <p className="mt-0.5 text-xs text-neutral-500">
                {folderName} · {item.sizeLabel}
              </p>
            </div>
            <button type="button" onClick={() => dialog.current?.close()} aria-label="Close" className="text-2xl leading-none text-neutral-600 hover:text-black">
              ×
            </button>
          </div>

          <div className="grid min-h-0 gap-6 overflow-y-auto px-6 py-5 sm:grid-cols-[14rem_1fr]">
            <a href={item.url} target="_blank" rel="noreferrer" className="block self-start border border-neutral-200 bg-neutral-100" title="Open full size">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.url} alt={item.name} className="max-h-72 w-full object-contain" />
            </a>

            <div className="min-w-0 space-y-5">
              <div>
                <p className={labelClass}>URL</p>
                <div className="flex gap-2">
                  <input readOnly value={item.url} aria-label="Image URL" onFocus={(e) => e.currentTarget.select()} className={`${inputClass} text-xs`} />
                  <button
                    type="button"
                    className={`${smallButtonClass} shrink-0`}
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(item.url);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1500);
                      } catch {
                        window.prompt("Copy this URL:", item.url);
                      }
                    }}
                  >
                    {copied ? "Copied ✓" : "Copy"}
                  </button>
                </div>
              </div>

              <form action={renameMediaAction} className="space-y-2">
                {back}
                <label htmlFor={`rename-${item.id}`} className={labelClass}>
                  Name
                </label>
                <input id={`rename-${item.id}`} name="name" defaultValue={item.name} maxLength={100} required className={inputClass} />
                <p className="text-xs text-neutral-500">The name you search for. The image&apos;s URL stays the same, so pages that use it keep working.</p>
                <SubmitButton variant="secondary">Save name</SubmitButton>
              </form>

              <form action={moveMediaAction} className="space-y-2 border-t border-neutral-200 pt-5">
                {back}
                <label htmlFor={`move-${item.id}`} className={labelClass}>
                  Folder
                </label>
                <select id={`move-${item.id}`} name="folder" defaultValue={item.folder} className={inputClass}>
                  {folders.map((f) => (
                    <option key={f.slug} value={f.slug}>
                      {f.name}
                    </option>
                  ))}
                </select>
                <SubmitButton variant="secondary">Move to folder</SubmitButton>
              </form>

              <form action={deleteMediaAction} className="border-t border-neutral-200 pt-5">
                {back}
                <ConfirmButton
                  className="border border-black px-4 py-2 text-sm font-medium text-black hover:bg-black hover:text-white"
                  message={`Delete “${item.name}”? Pages or posts that use this image will show nothing in its place. This can't be undone.`}
                >
                  Delete image
                </ConfirmButton>
              </form>
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
}
