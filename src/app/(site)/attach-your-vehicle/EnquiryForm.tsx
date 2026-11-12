"use client";

import { useActionState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { submitEnquiry, type EnquiryState } from "./actions";

const initial: EnquiryState = { ok: false, message: "" };

export function EnquiryForm() {
  const [state, action, pending] = useActionState(submitEnquiry, initial);

  if (state.ok) {
    return (
      <div className="card p-6 text-center" role="status">
        <CheckCircle2 className="mx-auto size-12 text-brand-600" aria-hidden />
        <p className="mt-3 text-lg font-bold">{state.message}</p>
      </div>
    );
  }

  const f = state.fieldErrors ?? {};
  const field = (name: string, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label htmlFor={name} className="field-label">{label}</label>
      <input id={name} name={name} className="field" aria-invalid={!!f[name]} aria-describedby={f[name] ? `${name}-e` : undefined} {...props} />
      {f[name] && <p id={`${name}-e`} className="mt-1 text-sm text-red-700">{f[name]}</p>}
    </div>
  );

  return (
    <form action={action} className="card grid gap-4 p-4 sm:grid-cols-2 sm:p-6" noValidate>
      {field("ownerName", "Your name *", { required: true, autoComplete: "name", maxLength: 80 })}
      {field("phone", "Mobile number *", { required: true, type: "tel", inputMode: "numeric", autoComplete: "tel" })}
      {field("carModel", "Car make and model *", { required: true, placeholder: "e.g. Maruti Swift", maxLength: 80 })}
      {field("year", "Year", { inputMode: "numeric", maxLength: 4, placeholder: "2022" })}
      <div>
        <label htmlFor="fuel" className="field-label">Fuel</label>
        <select id="fuel" name="fuel" className="field" defaultValue="">
          <option value="">Choose</option><option>Petrol</option><option>Diesel</option><option>CNG</option><option>Electric</option>
        </select>
      </div>
      <div>
        <label htmlFor="transmission" className="field-label">Transmission</label>
        <select id="transmission" name="transmission" className="field" defaultValue="">
          <option value="">Choose</option><option>Manual</option><option>Automatic</option>
        </select>
      </div>
      {field("kmDriven", "Km driven", { inputMode: "numeric", maxLength: 20 })}
      {field("area", "Your area in Chennai", { maxLength: 80 })}
      <div className="sm:col-span-2">
        <label htmlFor="notes" className="field-label">Anything else?</label>
        <textarea id="notes" name="notes" maxLength={500} className="field" />
      </div>
      <div aria-hidden className="hidden"><input name="website" tabIndex={-1} autoComplete="off" /></div>
      {state.message && <p role="alert" className="text-sm text-red-700 sm:col-span-2">{state.message}</p>}
      <button type="submit" disabled={pending} className="btn btn-primary sm:col-span-2">
        {pending && <Loader2 className="size-5 animate-spin" aria-hidden />}
        Submit enquiry
      </button>
    </form>
  );
}
