export function Card({ title, children, actions }: { title?: string; children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <section className="border border-neutral-200 bg-white p-6">
      {(title || actions) && (
        <div className="mb-5 flex items-center justify-between gap-4">
          {title && <h2 className="text-sm font-semibold uppercase tracking-wider text-black">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function PageTitle({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-8">
      <h1 className="text-2xl font-semibold tracking-tight text-black">{title}</h1>
      {description && <p className="mt-1 text-sm text-neutral-600">{description}</p>}
    </div>
  );
}

export function SavedNotice({ show, children = "Saved." }: { show: boolean; children?: React.ReactNode }) {
  if (!show) return null;
  return <p className="mb-6 border border-neutral-300 bg-neutral-100 px-4 py-3 text-sm text-neutral-800">{children}</p>;
}
