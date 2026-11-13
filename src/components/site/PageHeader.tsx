/** Tinted heading band at the top of inner pages: eyebrow, title, optional lead text. */
export function PageHeader({
  eyebrow,
  title,
  lead,
  narrow = false,
  children,
}: {
  eyebrow: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
  narrow?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="page-head">
      <div className={`container-page ${narrow ? "max-w-3xl" : ""}`}>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {lead && <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[#5d6974] sm:text-[17px]">{lead}</p>}
        {children}
      </div>
    </div>
  );
}
