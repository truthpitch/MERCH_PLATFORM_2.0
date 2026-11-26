"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { saveSocialPostAction, type ComposeState } from "@/app/admin/social-actions";
import { CAPTION_LIMIT, NEEDS_IMAGE, PLATFORM_LABEL, type Platform } from "@/lib/social/types";
import { MediaPicker, type PickerFolder, type PickerImage } from "./MediaPicker";
import { inputClass, labelClass, smallButtonClass } from "./styles";

export type ComposerAccount = { id: number; platform: Platform; username: string; state: "connected" | "expiring" | "expired" };
export type ComposerProduct = { handle: string; title: string; image: string | null; url: string };
export type ComposerInitial = {
  id: number;
  caption: string;
  imageUrl: string | null;
  productHandle: string | null;
  accountIds: number[];
  scheduledLocal: string;
};

// A .jpg file, or a Shopify image that is converted to JPEG (?format=jpg).
const isJpeg = (url: string) => /\.jpe?g$/i.test(url.split("?")[0]) || /[?&]format=p?jpg\b/i.test(url);

/** Write a post for Instagram and/or Threads, then post it now or schedule it. */
export function SocialComposer({
  accounts,
  products,
  media,
  folders,
  initial,
}: {
  accounts: ComposerAccount[];
  products: ComposerProduct[];
  media: PickerImage[];
  folders: PickerFolder[];
  initial?: ComposerInitial;
}) {
  const [state, action, pending] = useActionState<ComposeState, FormData>(saveSocialPostAction, {});
  const [caption, setCaption] = useState(initial?.caption ?? "");
  const [image, setImage] = useState(initial?.imageUrl ?? "");
  const [product, setProduct] = useState(initial?.productHandle ?? "");
  const [checked, setChecked] = useState<Set<number>>(
    () => new Set(initial?.accountIds ?? accounts.filter((a) => a.state !== "expired" && (!NEEDS_IMAGE[a.platform] || initial?.imageUrl)).map((a) => a.id)),
  );
  const [when, setWhen] = useState<"now" | "schedule">(initial ? "schedule" : "now");

  const platformsUsed = new Set(accounts.filter((a) => checked.has(a.id)).map((a) => a.platform));
  const blocked = (a: ComposerAccount) => a.state === "expired" || (NEEDS_IMAGE[a.platform] && !image);
  const toggle = (id: number, on: boolean) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  function pickProduct(handle: string) {
    setProduct(handle);
    const p = products.find((x) => x.handle === handle);
    if (!p) return;
    const text = `${p.title}\n\nShop it: ${p.url}`;
    if (!caption.trim() || window.confirm("Replace the caption with this product's title and link?")) setCaption(text);
    if (p.image) setImage(p.image);
  }

  function removeImage() {
    setImage("");
    // Instagram can't post without an image: untick it.
    setChecked((prev) => new Set([...prev].filter((id) => !NEEDS_IMAGE[accounts.find((a) => a.id === id)?.platform ?? "THREADS"])));
  }

  if (accounts.length === 0) {
    return (
      <p className="text-sm text-neutral-600">
        No accounts connected yet.{" "}
        <Link href="/admin/social/accounts" className="font-medium text-black underline underline-offset-4">
          Connect Instagram or Threads
        </Link>{" "}
        first.
      </p>
    );
  }

  const sendable = [...checked].some((id) => {
    const a = accounts.find((x) => x.id === id);
    return a && !blocked(a);
  });

  return (
    <form action={action} className="grid gap-6">
      {initial && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="imageUrl" value={image} />

      {/* Product */}
      <div>
        <label htmlFor="social-product" className={labelClass}>
          Start from a product <span className="normal-case tracking-normal text-neutral-400">(optional)</span>
        </label>
        <select id="social-product" name="productHandle" value={product} onChange={(e) => pickProduct(e.target.value)} className={inputClass}>
          <option value="">No product</option>
          {products.map((p) => (
            <option key={p.handle} value={p.handle}>
              {p.title}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-neutral-500">Fills in the caption with the product name and link, and uses the product photo.</p>
      </div>

      {/* Caption */}
      <div>
        <label htmlFor="social-caption" className={labelClass}>
          Caption
        </label>
        <textarea id="social-caption" name="caption" rows={7} value={caption} onChange={(e) => setCaption(e.target.value)} className={inputClass} />
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs">
          {(["INSTAGRAM", "THREADS"] as Platform[]).map((p) => {
            const over = caption.length > CAPTION_LIMIT[p];
            return (
              <span key={p} className={over ? "font-semibold text-red-700" : platformsUsed.has(p) ? "text-neutral-700" : "text-neutral-400"}>
                {PLATFORM_LABEL[p]}: {caption.length} / {CAPTION_LIMIT[p]}
                {over && " (too long)"}
              </span>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-neutral-500">
          Note: links in Instagram captions are <strong className="font-medium text-neutral-700">not clickable</strong>. On Threads they are.
        </p>
      </div>

      {/* Image */}
      <div>
        <span className={labelClass}>
          Image <span className="normal-case tracking-normal text-neutral-400">(required for Instagram)</span>
        </span>
        <div className="flex flex-wrap items-start gap-4">
          {image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="" className="h-32 w-32 border border-neutral-200 bg-neutral-100 object-cover" />
          )}
          <div className="flex flex-wrap gap-1.5">
            <MediaPicker
              images={media}
              folders={folders}
              defaultFolder="social"
              onCover={(i) => setImage(i.url)}
              label={image ? "Change image" : "Choose image"}
            />
            {image && (
              <button type="button" onClick={removeImage} className={smallButtonClass}>
                Remove
              </button>
            )}
          </div>
        </div>
        <p className="mt-2 text-xs text-neutral-500">
          One image. Use a <strong className="font-medium text-neutral-700">JPEG</strong> (Instagram only accepts JPEG). Meta downloads it from your live
          website, so scheduled posts only work from truthpitch.com.
        </p>
        {image && !isJpeg(image) && (
          <p className="mt-1 text-xs font-medium text-black">This image doesn&apos;t look like a JPEG. Instagram may refuse it.</p>
        )}
      </div>

      {/* Accounts */}
      <fieldset>
        <legend className={labelClass}>Post to</legend>
        <div className="flex flex-wrap gap-3">
          {accounts.map((a) => {
            const off = blocked(a);
            return (
              <label
                key={a.id}
                className={`flex items-center gap-2 border px-3 py-2 text-sm ${off ? "cursor-not-allowed border-neutral-200 text-neutral-400" : "cursor-pointer border-neutral-300 text-black hover:border-black"}`}
              >
                <input
                  type="checkbox"
                  name="account"
                  value={a.id}
                  checked={checked.has(a.id) && !off}
                  disabled={off}
                  onChange={(e) => toggle(a.id, e.target.checked)}
                  className="accent-black"
                />
                <span className="font-medium">{PLATFORM_LABEL[a.platform]}</span>
                <span className="text-neutral-500">@{a.username}</span>
                {a.state === "expired" && <span className="text-xs">(reconnect first)</span>}
                {a.state !== "expired" && NEEDS_IMAGE[a.platform] && !image && <span className="text-xs">(add an image first)</span>}
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* When */}
      <fieldset>
        <legend className={labelClass}>When</legend>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input type="radio" name="when" value="now" checked={when === "now"} onChange={() => setWhen("now")} className="accent-black" />
            Post now
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="when" value="schedule" checked={when === "schedule"} onChange={() => setWhen("schedule")} className="accent-black" />
            Schedule
          </label>
          {when === "schedule" && (
            <span className="flex items-center gap-2">
              <input
                type="datetime-local"
                name="scheduledLocal"
                defaultValue={initial?.scheduledLocal}
                required
                aria-label="Date and time (Amsterdam time)"
                className={`${inputClass} w-auto`}
              />
              <span className="text-xs text-neutral-500">Amsterdam time</span>
            </span>
          )}
        </div>
      </fieldset>

      {state.error && (
        <p role="alert" className="border border-black bg-neutral-100 px-4 py-3 text-sm text-black">
          {state.error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={pending || !sendable} className="bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:bg-neutral-400">
          {pending ? (when === "now" ? "Posting…" : "Saving…") : when === "now" ? "Post now" : initial ? "Save changes" : "Schedule"}
        </button>
        {initial && (
          <Link href="/admin/social" className="text-sm text-neutral-600 underline underline-offset-4 hover:text-black">
            Cancel
          </Link>
        )}
        {!sendable && <span className="text-xs text-neutral-500">Tick at least one account.</span>}
      </div>
    </form>
  );
}
