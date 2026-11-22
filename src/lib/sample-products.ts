// Sample catalog used in DEMO MODE (when Shopify credentials are not set).
// Once Shopify is connected these are ignored and real products load instead.
// Images live in /public/samples.
import type { Product, ProductVariant } from "./types";

const usd = (amount: number) => ({ amount: amount.toFixed(2), currencyCode: "USD" });

function sizes(handle: string, price: number, compareAt?: number, list = ["S", "M", "L", "XL"]): ProductVariant[] {
  return list.map((size) => ({
    compareAtPrice: compareAt ? usd(compareAt) : null,
    selectedOptions: [{ name: "Size", value: size }],
    id: `demo-${handle}-${size.toLowerCase().replace(/\s+/g, "-")}`,
    title: size,
    availableForSale: true,
    price: usd(price),
  }));
}

function product(p: {
  handle: string;
  title: string;
  description: string;
  price: number;
  /** Optional "was" price, to show a sale in demo mode. */
  compareAt?: number;
  image: string;
  variants?: ProductVariant[];
  story: string;
  productType: string;
}): Product {
  const image = { url: `/samples/${p.image}`, altText: p.title };
  return {
    id: `demo-${p.handle}`,
    handle: p.handle,
    title: p.title,
    description: p.description,
    availableForSale: true,
    featuredImage: image,
    images: [image],
    price: usd(p.price),
    compareAtPrice: p.compareAt ? usd(p.compareAt) : null,
    variants: p.variants ?? [{ id: `demo-${p.handle}-default`, title: "Default Title", availableForSale: true, price: usd(p.price) }],
    defaultStory: p.story,
    productType: p.productType,
    tags: [],
  };
}

export const SAMPLE_PRODUCTS: Product[] = [
  product({
    handle: "truth-tee-black",
    productType: "T-Shirt",
    title: "Truth Tee — Black",
    description: "Heavyweight cotton tee with a small TRUTH mark on the chest. Relaxed fit.",
    price: 32,
    image: "tee-black.svg",
    variants: sizes("truth-tee-black", 32),
    story:
      "The first piece we ever made. One word, printed small, because the loudest things don't need to shout.\n\nWe picked a heavy cotton so it keeps its shape wash after wash — a tee you reach for without thinking.",
  }),
  product({
    handle: "truth-tee-white",
    productType: "T-Shirt",
    title: "Truth Tee — White",
    description: "The same heavyweight tee in white with a black chest print.",
    price: 26,
    compareAt: 32,
    image: "tee-white.svg",
    variants: sizes("truth-tee-white", 26, 32),
    story: "The white version of the original. Same cut, same weight, same quiet message.",
  }),
  product({
    handle: "pitch-hoodie",
    productType: "Hoodie",
    title: "Pitch Hoodie",
    description: "Midweight brushed-fleece hoodie. PITCH printed across the back.",
    price: 64,
    image: "hoodie.svg",
    variants: sizes("pitch-hoodie", 64),
    story:
      "Made for long nights of writing, editing and getting the pitch right.\n\nThe print sits on the back so the front stays clean — you'll know it's there.",
  }),
  product({
    handle: "signal-cap",
    productType: "Cap",
    title: "Signal Cap",
    description: "Unstructured six-panel cap with an embroidered TP monogram. One size.",
    price: 28,
    image: "cap.svg",
    story: "A simple cap with a small embroidered monogram. Adjustable strap, washed cotton.",
  }),
  product({
    handle: "statement-tote",
    productType: "Tote Bag",
    title: "Statement Tote",
    description: "Sturdy cotton canvas tote with a long-strap carry.",
    price: 24,
    image: "tote.svg",
    story: "Big enough for a laptop and notebooks. Built for carrying ideas from one place to the next.",
  }),
  product({
    handle: "morning-mug",
    productType: "Mug",
    title: "Morning Mug",
    description: "11 oz ceramic mug, matte black. Dishwasher and microwave safe.",
    price: 18,
    image: "mug.svg",
    story: "For the first draft of the day. Matte black outside, glossy inside.",
  }),
];
