import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getRememberedEmail, isAdmin } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Admin login", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await isAdmin()) redirect("/admin");
  const rememberedEmail = await getRememberedEmail();
  return (
    <main className="flex flex-1 items-center justify-center bg-neutral-50 px-4 py-24">
      <div className="w-full max-w-sm border border-neutral-200 bg-white p-8">
        <p className="text-sm font-bold tracking-[0.3em] text-black">TRUTHPITCH</p>
        <h1 className="mt-6 text-lg font-semibold text-black">Store admin</h1>
        <p className="mt-1 text-sm text-neutral-600">Sign in to manage the shop.</p>
        <LoginForm rememberedEmail={rememberedEmail} />
      </div>
    </main>
  );
}
