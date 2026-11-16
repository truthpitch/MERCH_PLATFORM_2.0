import type { Metadata } from "next";
import { ForgotForm } from "../PasswordForms";

export const metadata: Metadata = { title: "Forgot password", robots: { index: false } };

export default function ForgotPasswordPage() {
  return (
    <section className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight text-black">Forgot your password?</h1>
      <p className="mt-3 text-sm text-neutral-600">Enter the email of your account and we&apos;ll send you a link to choose a new one.</p>
      <div className="mt-10">
        <ForgotForm />
      </div>
    </section>
  );
}
