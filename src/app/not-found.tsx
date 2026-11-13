import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-32 text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">404</p>
      <h1 className="mt-4 text-2xl font-semibold text-black">Page not found</h1>
      <Link href="/" className="mt-8 text-sm underline underline-offset-4">
        Back to the shop
      </Link>
    </main>
  );
}
