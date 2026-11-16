import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCustomerId, safeNext } from "@/lib/customers";
import { AuthForm } from "../AuthForm";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);
  if (await getCustomerId()) redirect(next);

  return (
    <section className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight text-black">Sign in</h1>
      <p className="mt-3 text-sm text-neutral-600">Sign in to see your favorites on every device and check out faster.</p>
      <div className="mt-10">
        <AuthForm mode="login" next={next} />
      </div>
    </section>
  );
}
