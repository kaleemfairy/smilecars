// Small shared pieces for admin pages.

export function PageTitle({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl font-extrabold">{title}</h1>
      {children}
    </div>
  );
}

/** Shows ?ok= / ?error= messages set by server actions after a redirect. */
export function Flash({ sp }: { sp: Record<string, string | string[] | undefined> }) {
  const ok = typeof sp.ok === "string" ? sp.ok : null;
  const error = typeof sp.error === "string" ? sp.error : null;
  if (!ok && !error) return null;
  return (
    <p
      role={error ? "alert" : "status"}
      className={`mb-4 rounded-xl px-4 py-3 text-sm ${error ? "bg-red-50 text-red-800" : "bg-brand-50 text-brand-800"}`}
    >
      {error ?? ok}
    </p>
  );
}
