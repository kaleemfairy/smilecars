import { LABELS } from "@/lib/format";
import type { BookingStatus } from "@/lib/types";

const STYLES: Record<BookingStatus, string> = {
  new: "bg-sky-100 text-sky-800",
  confirmed: "bg-brand-100 text-brand-800",
  delivered: "bg-violet-100 text-violet-800",
  returned: "bg-slate-200 text-slate-800",
  closed: "bg-slate-100 text-slate-600",
  cancelled: "bg-red-100 text-red-800",
};

export function StatusChip({ status }: { status: BookingStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${STYLES[status]}`}>
      {LABELS.status[status]}
    </span>
  );
}
