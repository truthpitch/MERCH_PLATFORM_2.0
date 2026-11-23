"use server";

import { revalidatePath } from "next/cache";
import { getProduct } from "@/lib/catalog";
import { getCustomerId } from "@/lib/customers";
import { prisma } from "@/lib/db";
import { isValidHandle } from "@/lib/favorites";
import { isRateLimited } from "@/lib/rate-limit";

export type ReviewState = { error?: string; saved?: boolean };

const MAX_BODY = 2000;

/** Saves the signed-in customer's review (one per product; posting again updates it). */
export async function saveReviewAction(_prev: ReviewState, formData: FormData): Promise<ReviewState> {
  const customerId = await getCustomerId();
  if (!customerId) return { error: "Please sign in to write a review." };

  const handle = String(formData.get("handle") ?? "");
  if (!isValidHandle(handle)) return { error: "Something went wrong. Please reload the page." };
  const rating = Number(formData.get("rating"));
  const title = String(formData.get("title") ?? "").trim().slice(0, 120);
  const body = String(formData.get("body") ?? "").trim();

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { error: "Choose 1 to 5 stars." };
  if (body.length < 10) return { error: "Please write a few words (at least 10 characters)." };
  if (body.length > MAX_BODY) return { error: `Please keep it under ${MAX_BODY} characters.` };
  if (await isRateLimited("review", 10, 60 * 60 * 1000)) return { error: "Too many reviews in a short time. Please try again later." };
  if (!(await getProduct(handle))) return { error: "This product no longer exists." };

  // New and edited reviews wait for approval in admin → Reviews before they're public.
  await prisma.review.upsert({
    where: { customerId_handle: { customerId, handle } },
    update: { rating, title, body, approved: false, approvedAt: null },
    create: { customerId, handle, rating, title, body },
  });
  revalidatePath("/", "layout");
  return { saved: true };
}

/** Removes the signed-in customer's own review of a product. */
export async function deleteOwnReviewAction(formData: FormData) {
  const customerId = await getCustomerId();
  const handle = String(formData.get("handle") ?? "");
  if (!customerId || !isValidHandle(handle)) return;
  await prisma.review.deleteMany({ where: { customerId, handle } });
  revalidatePath("/", "layout");
}
