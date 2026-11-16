import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCustomerId, safeNext } from "@/lib/customers";
import { AuthForm } from "../AuthForm";

export const metadata: Metadata = { title: "Create account", robots: { index: false } };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);
  if (await getCustomerId()) redirect(next);

  return (
    <section className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight text-black">Create an account</h1>
      <p className="mt-3 text-sm text-neutral-600">
        Save your favorites and check out faster. An account is optional: you can always check out as a guest.
      </p>
      <div className="mt-10">
        <AuthForm mode="register" next={next} />
      </div>
    </section>
  );
}
