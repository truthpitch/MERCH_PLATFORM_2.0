// Shared shapes used by both the Shopify integration and the sample (demo) catalog.

export type Money = { amount: string; currencyCode: string };

export type ProductImage = { url: string; altText: string | null };

export type ProductVariant = {
  id: string;
  title: string;
  availableForSale: boolean;
  price: Money;
  /** Shopify "Compare-at price": when it's higher than price, the item is on sale. */
  compareAtPrice?: Money | null;
  /** e.g. [{ name: "Color", value: "Black" }, { name: "Size", value: "M" }] */
  selectedOptions?: { name: string; value: string }[];
};

export type Product = {
  id: string;
  handle: string;
  title: string;
  description: string;
  availableForSale: boolean;
  images: ProductImage[];
  featuredImage: ProductImage | null;
  price: Money; // lowest variant price
  /** The "was" price that goes with `price`, when that variant is on sale. */
  compareAtPrice?: Money | null;
  variants: ProductVariant[];
  /** Shopify "Product type" and tags, used to sort products into menu categories. */
  productType?: string;
  tags?: string[];
  /** Fallback "MORE INFO" story (sample products only). Admin-edited stories override it. */
  defaultStory?: string;
};

export type CartLine = {
  id: string;
  quantity: number;
  variantId: string;
  variantTitle: string;
  productTitle: string;
  handle: string;
  price: Money;
  image: ProductImage | null;
};

export type Cart = {
  id: string | null;
  checkoutUrl: string | null;
  totalQuantity: number;
  subtotal: Money;
  lines: CartLine[];
};
