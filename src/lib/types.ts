// Shared shapes used by both the Shopify integration and the sample (demo) catalog.

export type Money = { amount: string; currencyCode: string };

export type ProductImage = { url: string; altText: string | null };

export type ProductVariant = {
  id: string;
  title: string;
  availableForSale: boolean;
  price: Money;
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
