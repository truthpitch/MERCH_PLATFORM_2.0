"use server";

import { revalidatePath } from "next/cache";
import { isValidHandle, setFavorite } from "@/lib/favorites";

/** Hearts a product (on = true) or removes it. Returns the visitor's new list of favorites. */
export async function toggleFavoriteAction(handle: string, on: boolean): Promise<string[] | null> {
  if (!isValidHandle(handle)) return null;
  const list = await setFavorite(handle, Boolean(on));
  revalidatePath("/favorites");
  return list;
}
