import type { Metadata } from "next";
import Link from "next/link";
import { getCart } from "@/lib/cart";
import { isDemoMode } from "@/lib/catalog";
import { getCurrentCustomer } from "@/lib/customers";
import { formatMoney } from "@/lib/format";
import { checkoutAction, removeLineAction, updateLineAction } from "./actions";

export const metadata: Metadata = { title: "Cart" };

export default async function CartPage({ searchParams }: { searchParams: Promise<{ demo?: string }> }) {
  const [cart, sp, customer] = await Promise.all([getCart(), searchParams, getCurrentCustomer()]);
  const demo = isDemoMode();

  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight text-black">Cart</h1>

      {cart.lines.length === 0 ? (
        <div className="mt-10">
          <p className="text-neutral-600">Your cart is empty.</p>
          <Link href="/products" className="mt-6 inline-block text-sm underline underline-offset-4">
            Continue shopping
          </Link>
        </div>
      ) : (
        <>
          <ul className="mt-10 divide-y divide-neutral-200 border-y border-neutral-200">
            {cart.lines.map((line) => (
              <li key={line.id} className="flex gap-4 py-6">
                <Link href={`/products/${line.handle}`} className="w-20 shrink-0 sm:w-24">
                  {line.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={line.image.url} alt={line.image.altText ?? line.productTitle} className="aspect-[4/5] w-full bg-neutral-100 object-cover" />
                  )}
                </Link>
                <div className="flex flex-1 flex-col justify-between gap-3 sm:flex-row">
                  <div>
                    <Link href={`/products/${line.handle}`} className="font-medium text-black hover:underline">
                      {line.productTitle}
                    </Link>
                    {line.variantTitle !== "Default Title" && <p className="mt-1 text-sm text-neutral-500">{line.variantTitle}</p>}
                    <p className="notranslate mt-1 text-sm text-neutral-600">{formatMoney(line.price)}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center border border-neutral-300">
                      <form action={updateLineAction}>
                        <input type="hidden" name="lineId" value={line.id} />
                        <input type="hidden" name="quantity" value={line.quantity - 1} />
                        <button className="px-3 py-1 text-neutral-700 hover:text-black" aria-label="Decrease quantity">
                          −
                        </button>
                      </form>
                      <span className="w-8 text-center text-sm">{line.quantity}</span>
                      <form action={updateLineAction}>
                        <input type="hidden" name="lineId" value={line.id} />
                        <input type="hidden" name="quantity" value={line.quantity + 1} />
                        <button className="px-3 py-1 text-neutral-700 hover:text-black" aria-label="Increase quantity">
                          +
                        </button>
                      </form>
                    </div>
                    <form action={removeLineAction}>
                      <input type="hidden" name="lineId" value={line.id} />
                      <button className="text-xs uppercase tracking-wider text-neutral-500 hover:text-black">Remove</button>
                    </form>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex items-center justify-between text-lg">
            <span className="text-neutral-700">Subtotal</span>
            <span className="notranslate font-medium text-black">{formatMoney(cart.subtotal)}</span>
          </div>
          <p className="mt-1 text-sm text-neutral-500">
            Shipping and taxes are calculated at checkout. See our{" "}
            <Link href="/shipping-policy" className="underline underline-offset-2 hover:text-black">
              shipping policy
            </Link>
            .
          </p>

          {customer ? (
            <form action={checkoutAction} className="mt-8">
              <button className="w-full bg-black px-6 py-4 text-sm font-medium uppercase tracking-wider text-white hover:bg-neutral-800">
                Checkout
              </button>
              <p className="mt-3 text-center text-sm text-neutral-600">
                Signed in as <span className="font-medium text-black">{customer.email}</span>
              </p>
            </form>
          ) : (
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <form action={checkoutAction}>
                <button className="w-full bg-black px-6 py-4 text-sm font-medium uppercase tracking-wider text-white hover:bg-neutral-800">
                  Checkout as guest
                </button>
              </form>
              <Link
                href="/account/login?next=/cart"
                className="flex items-center justify-center border border-black px-6 py-4 text-sm font-medium uppercase tracking-wider text-black hover:bg-black hover:text-white"
              >
                Sign in to check out
              </Link>
              <p className="text-center text-xs text-neutral-500 sm:col-span-2">
                No account needed.{" "}
                <Link href="/account/register?next=/cart" className="underline underline-offset-2 hover:text-black">
                  Create one
                </Link>{" "}
                to save favorites and check out faster.
              </p>
            </div>
          )}

          <p className="mt-4 text-center text-xs text-neutral-500">
            By checking out you agree to our{" "}
            <Link href="/terms-of-service" className="underline underline-offset-2 hover:text-black">
              terms of service
            </Link>
            . You can cancel within 14 days, see our{" "}
            <Link href="/refund-policy" className="underline underline-offset-2 hover:text-black">
              refund policy
            </Link>
            .
          </p>

          {(demo || sp.demo) && (
            <p className="mt-4 border border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-700">
              Demo mode: checkout is disabled until Shopify credentials are added to <code>.env</code>. Once connected, this
              button goes straight to Shopify&apos;s secure checkout.
            </p>
          )}
        </>
      )}
    </section>
  );
}
