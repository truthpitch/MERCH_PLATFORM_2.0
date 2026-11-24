"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addToCart, getCart, removeCartLine, updateCartLine } from "@/lib/cart";
import { getCurrentCustomer } from "@/lib/customers";
import { getOrderingState } from "@/lib/ordering";
import { isShopifyConfigured, shopifySetBuyerEmail } from "@/lib/shopify/storefront";

export async function addToCartAction(variantId: string, quantity = 1): Promise<{ ok: boolean; paused?: boolean }> {
  if (typeof variantId !== "string" || !variantId) return { ok: false };
  // Ordering pause (admin → Dashboard): checked here too, not only in the page.
  if ((await getOrderingState()).paused) return { ok: false, paused: true };
  const qty = Math.min(Math.max(Math.floor(quantity) || 1, 1), 20);
  try {
    await addToCart(variantId, qty);
    revalidatePath("/", "layout"); // refresh the cart count in the header
    return { ok: true };
  } catch (err) {
    console.error("addToCart failed", err);
    return { ok: false };
  }
}

export async function updateLineAction(formData: FormData) {
  const lineId = String(formData.get("lineId") ?? "");
  const quantity = Math.min(Math.max(Number(formData.get("quantity")) || 0, 0), 20);
  if (lineId) await updateCartLine(lineId, quantity);
  revalidatePath("/", "layout");
}

export async function removeLineAction(formData: FormData) {
  const lineId = String(formData.get("lineId") ?? "");
  if (lineId) await removeCartLine(lineId);
  revalidatePath("/", "layout");
}

/**
 * Sends the customer to Shopify's hosted checkout (Printful fulfils the order from there).
 * Guests fill in their details at checkout. For signed-in customers the account email is
 * passed along, so it's pre-filled and the order is linked to it.
 */
export async function checkoutAction() {
  if ((await getOrderingState()).paused) redirect("/cart?paused=1");
  const cart = await getCart();
  if (!cart.checkoutUrl) redirect("/cart?demo=1");
  let checkoutUrl = cart.checkoutUrl;
  const customer = await getCurrentCustomer();
  if (customer && cart.id && isShopifyConfigured()) {
    try {
      checkoutUrl = (await shopifySetBuyerEmail(cart.id, customer.email)).checkoutUrl ?? checkoutUrl;
    } catch (err) {
      console.error("Could not attach the customer email to the cart", err); // checkout still works as guest
    }
  }
  redirect(checkoutUrl);
}
