"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addToCart, getCart, removeCartLine, updateCartLine } from "@/lib/cart";

export async function addToCartAction(variantId: string, quantity = 1): Promise<{ ok: boolean }> {
  if (typeof variantId !== "string" || !variantId) return { ok: false };
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

/** Sends the customer to Shopify's hosted checkout (Printful fulfils the order from there). */
export async function checkoutAction() {
  const cart = await getCart();
  if (!cart.checkoutUrl) redirect("/cart?demo=1");
  redirect(cart.checkoutUrl);
}
