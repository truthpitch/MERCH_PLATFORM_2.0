// Recommended image sizes for every place an uploaded image appears on the website.
// Based on how large each spot is shown (and doubled, so images stay sharp on phones and
// Retina screens). Shown on the Media tab, in the image picker and next to each image field.

export type ImageUse = { key: string; where: string; size: string; shape: string; tip: string };

export const IMAGE_SIZES: ImageUse[] = [
  {
    key: "blog-cover",
    where: "Blog post cover",
    size: "1600 × 900 px",
    shape: "Landscape 16:9",
    tip: "Also used as the preview when the post is shared on WhatsApp, Facebook or X, and cropped a little on blog cards, so keep the subject in the middle.",
  },
  {
    key: "blog-inline",
    where: "Image inside a blog post",
    size: "1600 px wide",
    shape: "Any shape, e.g. 1600 × 1067 px (3:2)",
    tip: "Shown at full text width.",
  },
  {
    key: "hero",
    where: "Homepage main image",
    size: "1200 × 1500 px",
    shape: "Portrait 4:5",
    tip: "Shown next to the homepage title; cropped to 4:5.",
  },
  {
    key: "about",
    where: "About page image",
    size: "1200 × 1500 px",
    shape: "Portrait 4:5",
    tip: "Shown next to the About story; cropped to 4:5.",
  },
  {
    key: "story",
    where: "Product “More info” image",
    size: "1200 px wide",
    shape: "Any shape, e.g. 1200 × 800 px (3:2)",
    tip: "Shown at full width inside the More info section.",
  },
  {
    key: "favicon",
    where: "Favicon (Dashboard)",
    size: "512 × 512 px",
    shape: "Square",
    tip: "PNG, simple and bold: it's shown very small in browser tabs.",
  },
];

export const imageSize = (key: string) => IMAGE_SIZES.find((s) => s.key === key);

/** "Best: 1600 × 900 px (landscape 16:9). …" for under an image field. */
export function imageSizeHint(key: string): string {
  const s = imageSize(key);
  return s ? `Best size: ${s.size} (${s.shape.charAt(0).toLowerCase()}${s.shape.slice(1)}). ${s.tip}` : "";
}

export const IMAGE_FILE_TIPS = [
  "Photos: JPG or WebP. Logos and graphics with sharp edges or transparency: PNG.",
  "Keep files under about 500 KB where you can (max 5 MB): smaller files make the shop load faster, which also helps in Google.",
  "Bigger than recommended is fine (the browser scales it down); much smaller looks blurry.",
];
