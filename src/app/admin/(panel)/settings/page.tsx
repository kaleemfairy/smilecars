import { requireStaff } from "@/lib/auth";
import { adminDb } from "@/lib/firebase/admin";
import { getSettings, toDiscount } from "@/lib/data";
import { inr } from "@/lib/format";
import type { Discount, StaffMember } from "@/lib/types";
import { addStaffMember, deleteDiscount, saveDiscount, saveSettings, setStaffActive } from "../../actions";
import { Flash, PageTitle } from "../ui";

export const metadata = { title: "Settings" };

export default async function SettingsAdmin(props: PageProps<"/admin/settings">) {
  const me = await requireStaff(["owner"]);
  const sp = await props.searchParams;
  const [s, discSnap, staffSnap] = await Promise.all([
    getSettings(),
    adminDb().collection("discounts").get(),
    adminDb().collection("staff").get(),
  ]);
  const discounts = discSnap.docs.map(toDiscount).filter((d): d is Discount => !!d);
  const staff = staffSnap.docs.map((d) => ({ uid: d.id, ...d.data() }) as StaffMember);

  const input = (name: string, label: string, value: string | number, opts: { type?: string; help?: string; step?: string } = {}) => (
    <div>
      <label htmlFor={name} className="field-label">{label}</label>
      <input id={name} name={name} type={opts.type ?? "text"} step={opts.step} min={opts.type === "number" ? 0 : undefined} defaultValue={value} className="field" />
      {opts.help && <p className="mt-1 text-xs text-muted">{opts.help}</p>}
    </div>
  );

  return (
    <div className="max-w-4xl space-y-6">
      <PageTitle title="Settings" />
      <Flash sp={sp} />

      <form action={saveSettings} className="card grid gap-4 p-5 sm:grid-cols-2">
        <h2 className="text-lg font-bold sm:col-span-2">Prices and booking rules</h2>
        {input("depositAmount", "Refundable deposit ₹", s.depositAmount, { type: "number", help: "Shown as a separate line, not part of the total. 0 = no deposit." })}
        {input("fastagCharge", "FASTag charge ₹", s.fastagCharge, { type: "number", help: "Added to every booking. 0 = none." })}
        {input("includedKmPerDay", "Default included km per day", s.includedKmPerDay, { type: "number" })}
        {input("holdHours", "Hold duration (hours)", s.holdHours, { type: "number", step: "0.5", help: "How long a new booking holds the car before staff confirm." })}
        {input("turnaroundHours", "Gap between bookings (hours)", s.turnaroundHours, { type: "number", step: "0.5", help: "Time kept free for cleaning between two bookings of the same car." })}
        {input("ticketPrefix", "Ticket prefix", s.ticketPrefix, { help: "Letters only, e.g. SC gives SC-0001." })}

        <h2 className="mt-2 text-lg font-bold sm:col-span-2">Business details</h2>
        {input("businessName", "Business name", s.businessName)}
        {input("email", "Email", s.email, { type: "email" })}
        <div className="sm:col-span-2">{input("address", "Address", s.address)}</div>
        <div>
          <label htmlFor="phones" className="field-label">Phone numbers (one per line)</label>
          <textarea id="phones" name="phones" defaultValue={s.phones.join("\n")} className="field" />
          <p className="mt-1 text-xs text-muted">The first number is used for the Call buttons.</p>
        </div>
        <div>
          <label htmlFor="staffAlertNumbers" className="field-label">New-booking WhatsApp alerts to</label>
          <textarea id="staffAlertNumbers" name="staffAlertNumbers" defaultValue={s.staffAlertNumbers.join("\n")} className="field" placeholder="919962097400" />
          <p className="mt-1 text-xs text-muted">With country code, one per line.</p>
        </div>
        {input("whatsappNumber", "WhatsApp click-to-chat number", s.whatsappNumber, { help: "With country code, e.g. 919962097400." })}
        <div>
          <label htmlFor="notificationEmails" className="field-label">New-booking email alerts to</label>
          <textarea id="notificationEmails" name="notificationEmails" defaultValue={s.notificationEmails.join("\n")} className="field" />
          <p className="mt-1 text-xs text-muted">One per line. Also receives vehicle-owner enquiries.</p>
        </div>
        <button type="submit" className="btn btn-primary sm:col-span-2">Save settings</button>
      </form>

      <section id="discounts" className="card scroll-mt-4 p-5">
        <h2 className="text-lg font-bold">Discount codes</h2>
        {discounts.length > 0 && (
          <ul className="mt-3 divide-y divide-line text-sm">
            {discounts.map((d) => (
              <li key={d.code} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span>
                  <strong>{d.code}</strong> · {d.type === "percent" ? `${d.value}%${d.maxDiscount ? ` (max ${inr(d.maxDiscount)})` : ""}` : inr(d.value)} off
                  {d.minDays > 1 ? ` · min ${d.minDays} days` : ""}
                  {d.validFrom || d.validTo ? ` · ${d.validFrom ?? "…"} to ${d.validTo ?? "…"}` : ""}
                  {!d.active && <span className="ml-2 font-bold text-red-700">Inactive</span>}
                  {d.description && <span className="block text-xs text-muted">{d.description}</span>}
                </span>
                <form action={deleteDiscount}>
                  <input type="hidden" name="code" value={d.code} />
                  <button type="submit" className="btn btn-sm border border-red-300 text-red-700">Delete</button>
                </form>
              </li>
            ))}
          </ul>
        )}
        <form action={saveDiscount} className="mt-4 grid gap-3 border-t border-line pt-4 sm:grid-cols-3">
          <p className="text-sm font-semibold sm:col-span-3">Add or update a code (same code overwrites)</p>
          <div><label htmlFor="code" className="field-label">Code</label><input id="code" name="code" required className="field uppercase" placeholder="WELCOME10" /></div>
          <div>
            <label htmlFor="type" className="field-label">Type</label>
            <select id="type" name="type" className="field"><option value="percent">Percent off rent</option><option value="flat">Flat ₹ off rent</option></select>
          </div>
          <div><label htmlFor="value" className="field-label">Value</label><input id="value" name="value" type="number" min={1} required className="field" /></div>
          <div><label htmlFor="maxDiscount" className="field-label">Max discount ₹</label><input id="maxDiscount" name="maxDiscount" type="number" min={0} className="field" placeholder="0 = no cap" /></div>
          <div><label htmlFor="minDays" className="field-label">Minimum days</label><input id="minDays" name="minDays" type="number" min={1} defaultValue={1} className="field" /></div>
          <div><label htmlFor="description" className="field-label">Note</label><input id="description" name="description" className="field" placeholder="Diwali offer" /></div>
          <div><label htmlFor="validFrom" className="field-label">Valid from</label><input id="validFrom" name="validFrom" type="date" className="field" /></div>
          <div><label htmlFor="validTo" className="field-label">Valid to</label><input id="validTo" name="validTo" type="date" className="field" /></div>
          <label className="flex min-h-12 items-center gap-2 self-end text-sm font-semibold"><input type="checkbox" name="active" defaultChecked className="size-5 accent-brand-600" />Active</label>
          <button type="submit" className="btn btn-teal sm:col-span-3">Save code</button>
        </form>
      </section>

      <section id="staff" className="card scroll-mt-4 p-5">
        <h2 className="text-lg font-bold">Admin accounts</h2>
        <p className="text-sm text-muted">Staff can manage bookings and the calendar. Owners can do everything.</p>
        <ul className="mt-3 divide-y divide-line text-sm">
          {staff.map((m) => (
            <li key={m.uid} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span><strong>{m.name || m.email}</strong> · {m.email} · <span className="capitalize">{m.role}</span>{m.active === false && <span className="ml-2 font-bold text-red-700">Deactivated</span>}</span>
              {m.uid !== me.uid && (
                <form action={setStaffActive}>
                  <input type="hidden" name="uid" value={m.uid} />
                  <input type="hidden" name="active" value={m.active === false ? "true" : "false"} />
                  <button type="submit" className="btn btn-sm btn-secondary">{m.active === false ? "Re-activate" : "Deactivate"}</button>
                </form>
              )}
            </li>
          ))}
        </ul>
        <form action={addStaffMember} className="mt-4 grid gap-3 border-t border-line pt-4 sm:grid-cols-2">
          <div><label htmlFor="s-name" className="field-label">Name</label><input id="s-name" name="name" className="field" /></div>
          <div><label htmlFor="s-email" className="field-label">Email</label><input id="s-email" name="email" type="email" required className="field" /></div>
          <div><label htmlFor="s-password" className="field-label">Password (min 8)</label><input id="s-password" name="password" type="password" minLength={8} required autoComplete="new-password" className="field" /></div>
          <div>
            <label htmlFor="s-role" className="field-label">Role</label>
            <select id="s-role" name="role" className="field"><option value="staff">Staff</option><option value="owner">Owner</option></select>
          </div>
          <button type="submit" className="btn btn-teal sm:col-span-2">Add account</button>
        </form>
      </section>
    </div>
  );
}
