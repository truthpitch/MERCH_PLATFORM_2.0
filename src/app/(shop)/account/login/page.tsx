import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCustomerId, safeNext } from "@/lib/customers";
import { AuthForm } from "../AuthForm";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

/** Shown when someone arrives from an activation link that can't be used. */
const ACTIVATION_NOTICES: Record<string, { title: string; text: string }> = {
  used: { title: "Your account is already activated", text: "Sign in with your email and password." },
  expired: { title: "This activation link has expired", text: "Sign in with your email and password and we'll send you a new link." },
  invalid: { title: "This activation link doesn't work", text: "Make sure you used the whole link from the email. Signing in sends a new one." },
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; activation?: string }> }) {
  const sp = await searchParams;
  const next = safeNext(sp.next);
  if (await getCustomerId()) redirect(next);
  const notice = sp.activation ? ACTIVATION_NOTICES[sp.activation] : undefined;

  return (
    <section className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight text-black">Sign in</h1>
      <p className="mt-3 text-sm text-neutral-600">Sign in to see your favorites on every device and check out faster.</p>
      {notice && (
        <div role="status" className="mt-8 border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm">
          <p className="font-semibold text-black">{notice.title}</p>
          <p className="mt-1 text-neutral-600">{notice.text}</p>
        </div>
      )}
      <div className="mt-10">
        <AuthForm mode="login" next={next} />
      </div>
    </section>
  );
}
