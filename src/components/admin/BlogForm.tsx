"use client";

import { useActionState, useRef, useState } from "react";
import { saveBlogPostAction, type BlogFormState } from "@/app/admin/blog-actions";
import { DateTimeField } from "./DateTimeField";
import { MediaPicker, type PickerFolder, type PickerImage } from "./MediaPicker";
import { RichTextEditor } from "./RichTextEditor";
import { inputClass, labelClass } from "./styles";

export type BlogFormPost = {
  id: number | null;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImageUrl: string;
  coverImageAlt: string;
  author: string;
  tags: string;
  metaTitle: string;
  metaDescription: string;
  published: boolean;
  publishedAt: string | null;
};

const toSlug = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

/** "52 / 60" that turns bold when over the recommended length. */
function Counter({ value, max }: { value: string; max: number }) {
  const over = value.length > max;
  return (
    <span className={`text-xs ${over ? "font-semibold text-black" : "text-neutral-500"}`}>
      {value.length} / {max}
      {over && " (gets cut off in Google)"}
    </span>
  );
}

export function BlogForm({
  post,
  siteUrl,
  media,
  folders,
}: {
  post: BlogFormPost;
  siteUrl: string;
  /** Images from the Media library, for the image picker. */
  media: PickerImage[];
  folders: PickerFolder[];
}) {
  const altRef = useRef<HTMLInputElement>(null);

  /** Sets the cover image, and its description if that's still empty. */
  function useAsCover(image: PickerImage) {
    setCover(image.url);
    if (altRef.current && !altRef.current.value.trim()) altRef.current.value = image.name;
  }

  const [state, action, pending] = useActionState<BlogFormState, FormData>(saveBlogPostAction, {});
  const [title, setTitle] = useState(post.title);
  const [slug, setSlug] = useState(post.slug);
  const [slugTouched, setSlugTouched] = useState(Boolean(post.id));
  const [excerpt, setExcerpt] = useState(post.excerpt);
  const [metaTitle, setMetaTitle] = useState(post.metaTitle);
  const [metaDescription, setMetaDescription] = useState(post.metaDescription);
  const [cover, setCover] = useState(post.coverImageUrl);

  const effectiveSlug = slugTouched ? toSlug(slug) : toSlug(title);
  const previewTitle = `${metaTitle || title || "Post title"} — TruthPitch`;
  const previewDesc = metaDescription || excerpt || "The summary appears here. Write one so Google shows something useful.";
  const errorProps = (field: string) => (state.field === field ? { "aria-invalid": true as const } : {});

  return (
    <form action={action} className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <input type="hidden" name="id" value={post.id ?? ""} />

      {/* Main column */}
      <div className="min-w-0 space-y-6">
        <section className="space-y-5 border border-neutral-200 bg-white p-6">
          <div>
            <label htmlFor="title" className={labelClass}>
              Title
            </label>
            <input
              id="title"
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              required
              className={`${inputClass} text-base font-medium`}
              {...errorProps("title")}
            />
          </div>
          <div>
            <label htmlFor="slug" className={labelClass}>
              Web address
            </label>
            <div className="flex items-center border border-neutral-300 bg-white focus-within:border-black">
              <span className="shrink-0 pl-3 text-sm text-neutral-500">/blog/</span>
              <input
                id="slug"
                name="slug"
                value={slugTouched ? slug : effectiveSlug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value);
                }}
                maxLength={100}
                className="w-full min-w-0 bg-transparent px-1 py-2 text-sm text-black outline-none"
                {...errorProps("slug")}
              />
            </div>
            <p className="mt-1 text-xs text-neutral-500">
              Made from the title. Short, with your main keywords, e.g. <code>how-to-care-for-organic-cotton</code>. Avoid changing it after publishing: old links would break.
            </p>
          </div>
          <div>
            <div className="flex items-baseline justify-between gap-4">
              <label htmlFor="excerpt" className={labelClass}>
                Summary
              </label>
              <Counter value={excerpt} max={160} />
            </div>
            <textarea id="excerpt" name="excerpt" rows={3} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} maxLength={400} className={inputClass} />
            <p className="mt-1 text-xs text-neutral-500">Shown under the title, in the blog list and (unless you fill in an SEO description) in Google.</p>
          </div>
        </section>

        <section className="border border-neutral-200 bg-white p-6">
          <p className={labelClass}>Text</p>
          <RichTextEditor name="content" label="Post text" defaultValue={post.content} minHeight={420} media={media} folders={folders} />
          <p className="mt-2 text-xs text-neutral-500">
            Use <strong>Large</strong> and <strong>Extra large</strong> for section titles: Google likes clear structure, and with 3 or more Extra large titles the post
            gets an “In this article” list automatically. Click where an image should go, then use <strong>Image</strong>. To remove or swap an image in the text, click it and use{" "}
            <strong>Remove image</strong> (or press Delete), then insert another.
          </p>
        </section>

        <section className="space-y-5 border border-neutral-200 bg-white p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-black">Search engines (SEO)</h2>
          <div>
            <div className="flex items-baseline justify-between gap-4">
              <label htmlFor="metaTitle" className={labelClass}>
                SEO title <span className="normal-case tracking-normal text-neutral-400">(optional)</span>
              </label>
              <Counter value={metaTitle} max={60} />
            </div>
            <input id="metaTitle" name="metaTitle" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} maxLength={100} placeholder={title} className={inputClass} />
          </div>
          <div>
            <div className="flex items-baseline justify-between gap-4">
              <label htmlFor="metaDescription" className={labelClass}>
                SEO description <span className="normal-case tracking-normal text-neutral-400">(optional)</span>
              </label>
              <Counter value={metaDescription} max={160} />
            </div>
            <textarea
              id="metaDescription"
              name="metaDescription"
              rows={2}
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              maxLength={300}
              placeholder={excerpt}
              className={inputClass}
            />
          </div>
          <div>
            <p className={labelClass}>Google preview</p>
            <div className="border border-neutral-200 p-4">
              <p className="truncate text-xs text-neutral-600">
                {siteUrl.replace(/^https?:\/\//, "")} › blog › {effectiveSlug || "…"}
              </p>
              <p className="mt-1 truncate text-lg leading-snug text-[#1a0dab]">{previewTitle}</p>
              <p className="mt-1 line-clamp-2 text-sm text-neutral-700">{previewDesc}</p>
            </div>
          </div>
        </section>
      </div>

      {/* Side column */}
      <div className="min-w-0 space-y-6">
        <section className="space-y-4 border border-neutral-200 bg-white p-6 lg:sticky lg:top-6">
          <label className="flex cursor-pointer items-start gap-3">
            <input type="checkbox" name="published" defaultChecked={post.published} className="mt-0.5 h-4 w-4 accent-black" />
            <span className="text-sm">
              <span className="font-medium text-black">Published</span>
              <span className="block text-xs text-neutral-500">Unticked = draft: only you can see it (with a preview link).</span>
            </span>
          </label>
          <div>
            <label htmlFor="publishedAt" className={labelClass}>
              Publish date
            </label>
            <DateTimeField id="publishedAt" name="publishedAt" defaultIso={post.publishedAt} help="Empty = now when published. A future date schedules the post." />
          </div>
          {state.error && (
            <p role="alert" className="border border-neutral-300 bg-neutral-100 px-3 py-2 text-sm text-black">
              {state.error}
            </p>
          )}
          <button type="submit" disabled={pending} className="w-full bg-black px-4 py-3 text-sm font-medium text-white hover:bg-neutral-800 disabled:bg-neutral-400">
            {pending ? "Saving…" : "Save post"}
          </button>
        </section>

        <section className="space-y-4 border border-neutral-200 bg-white p-6">
          <div>
            <div className="mb-1 flex flex-wrap items-end justify-between gap-2">
              <label htmlFor="coverImageUrl" className={labelClass}>
                Cover image
              </label>
              <span className="flex gap-1.5">
                <MediaPicker images={media} folders={folders} onCover={useAsCover} label={cover ? "Change image" : "Choose image"} />
                {cover && (
                  <button
                    type="button"
                    onClick={() => {
                      setCover("");
                      if (altRef.current) altRef.current.value = "";
                    }}
                    className="border border-neutral-300 bg-white px-2.5 py-1 text-xs text-neutral-700 hover:border-black hover:text-black"
                  >
                    Remove
                  </button>
                )}
              </span>
            </div>
            <input id="coverImageUrl" name="coverImageUrl" value={cover} onChange={(e) => setCover(e.target.value)} placeholder="/media/… or https://…" className={inputClass} />
            <p className="mt-1 text-xs text-neutral-500">Choose from your Media library (or upload there), or paste a URL. Wide images (16:9) look best; also used when the post is shared.</p>
          </div>
          {cover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt="" className="aspect-[16/9] w-full bg-neutral-100 object-cover" />
          )}
          <div>
            <label htmlFor="coverImageAlt" className={labelClass}>
              Image description
            </label>
            <input
              ref={altRef}
              id="coverImageAlt"
              name="coverImageAlt"
              defaultValue={post.coverImageAlt}
              maxLength={200}
              placeholder="What's in the picture?"
              className={inputClass}
            />
            <p className="mt-1 text-xs text-neutral-500">For blind visitors and Google Images.</p>
          </div>
        </section>

        <section className="space-y-4 border border-neutral-200 bg-white p-6">
          <div>
            <label htmlFor="tags" className={labelClass}>
              Tags
            </label>
            <input id="tags" name="tags" defaultValue={post.tags} placeholder="sustainability, care guide" className={inputClass} />
            <p className="mt-1 text-xs text-neutral-500">Separate with commas. Used for “Keep reading” suggestions and tag pages.</p>
          </div>
          <div>
            <label htmlFor="author" className={labelClass}>
              Author
            </label>
            <input id="author" name="author" defaultValue={post.author} maxLength={100} className={inputClass} />
          </div>
        </section>
      </div>
    </form>
  );
}
