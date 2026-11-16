// The link in the activation email lands here: activate once, sign in, continue.
// A route handler (not a page) because signing in sets a cookie.
import { revalidatePath } from "next/cache";
import { activateWithToken } from "@/lib/activation";
import { safeNext, startCustomerSession } from "@/lib/customers";
import { mergeGuestFavorites } from "@/lib/favorites";

// Relative Location header works behind Hostinger's reverse proxy.
const go = (location: string) =>
  new Response(null, { status: 303, headers: { Location: location, "Referrer-Policy": "no-referrer", "Cache-Control": "no-store" } });

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const result = await activateWithToken(params.get("token"));

  if (result.status !== "activated") return go(`/account/login?activation=${result.status}`);

  await startCustomerSession(result.customer.id, result.customer.sessionVersion);
  await mergeGuestFavorites(result.customer.id);
  revalidatePath("/", "layout");

  const next = safeNext(params.get("next"));
  return go(next === "/account" ? "/account?activated=1" : next);
}
