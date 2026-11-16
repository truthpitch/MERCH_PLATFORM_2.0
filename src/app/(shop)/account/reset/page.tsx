import type { Metadata } from "next";
import Link from "next/link";
import { findValidReset } from "@/lib/password-reset";
import { ResetForm } from "../PasswordForms";

// The token is in the URL: keep it out of search engines and out of the Referer header.
export const metadata: Metadata = { title: "Choose a new password", robots: { index: false }, referrer: "no-referrer" };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const valid = await findValidReset(token);

  return (
    <section className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight text-black">Choose a new password</h1>
      {valid && token ? (
        <>
          <p className="mt-3 text-sm text-neutral-600">After saving you&apos;re signed in, and signed out on every other device.</p>
          <div className="mt-10">
            <ResetForm token={token} />
          </div>
        </>
      ) : (
        <div className="mt-8 border border-neutral-200 bg-neutral-50 p-6">
          <p className="font-semibold text-black">This link has expired or was already used</p>
          <p className="mt-2 text-sm text-neutral-600">Reset links work once and for 1 hour. You can request a new one.</p>
          <Link href="/account/forgot" className="mt-5 inline-block bg-black px-6 py-3 text-sm font-medium text-white hover:bg-neutral-800">
            Request a new link
          </Link>
        </div>
      )}
    </section>
  );
}
