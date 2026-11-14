export function MaintenancePage({ message }: { message: string }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
      <p className="notranslate text-sm font-bold tracking-[0.3em] text-black">TRUTHPITCH</p>
      <h1 className="mt-10 text-3xl font-semibold tracking-tight text-black sm:text-4xl">We&apos;ll be back soon.</h1>
      <p className="mt-4 max-w-md text-neutral-600">{message}</p>
    </main>
  );
}
