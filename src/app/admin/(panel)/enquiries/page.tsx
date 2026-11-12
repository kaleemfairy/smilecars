import { requireStaff } from "@/lib/auth";
import { adminDb } from "@/lib/firebase/admin";
import { fmtDateTime, phoneDigits } from "@/lib/format";
import type { Enquiry } from "@/lib/types";
import { setEnquiryStatus } from "../../actions";
import { Flash, PageTitle } from "../ui";

export const metadata = { title: "Enquiries" };

const STATUS_STYLE = { new: "bg-sky-100 text-sky-800", contacted: "bg-brand-100 text-brand-800", closed: "bg-slate-100 text-slate-600" };

export default async function EnquiriesAdmin(props: PageProps<"/admin/enquiries">) {
  await requireStaff(["owner"]);
  const sp = await props.searchParams;
  const snap = await adminDb().collection("enquiries").orderBy("createdAt", "desc").limit(200).get();
  const enquiries = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Enquiry);

  return (
    <div className="max-w-4xl">
      <PageTitle title="Vehicle owner enquiries" />
      <Flash sp={sp} />
      {enquiries.length === 0 ? (
        <p className="card p-6 text-center text-muted">No enquiries yet. They arrive from the &quot;Attach your vehicle&quot; page.</p>
      ) : (
        <ul className="space-y-3">
          {enquiries.map((e) => (
            <li key={e.id} className="card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-bold">{e.ownerName} · {e.carModel}{e.year ? ` (${e.year})` : ""}</p>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${STATUS_STYLE[e.status] ?? ""}`}>{e.status}</span>
              </div>
              <p className="mt-1 text-sm text-muted">
                {[e.fuel, e.transmission, e.kmDriven && `${e.kmDriven} km`, e.area].filter(Boolean).join(" · ")} · {fmtDateTime(e.createdAt)}
              </p>
              {e.notes && <p className="mt-2 whitespace-pre-wrap text-sm">{e.notes}</p>}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <a href={`tel:+${phoneDigits(e.phone)}`} className="btn btn-sm btn-teal">Call {e.phone}</a>
                {(["new", "contacted", "closed"] as const).filter((s) => s !== e.status).map((s) => (
                  <form key={s} action={setEnquiryStatus}>
                    <input type="hidden" name="id" value={e.id} />
                    <input type="hidden" name="status" value={s} />
                    <button type="submit" className="btn btn-sm btn-secondary capitalize">Mark {s}</button>
                  </form>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
