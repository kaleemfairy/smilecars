"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Info, Loader2 } from "lucide-react";
import { COUNTRY_CODES, inr } from "@/lib/format";
import type { PriceBreakdown } from "@/lib/types";
import type { SearchDefaults } from "./SearchForm";
import { PriceTable } from "./PriceTable";

interface Props {
  search: SearchDefaults;
  carId: string;
  initialPrice: PriceBreakdown;
  holdHours: number;
}

export function ConfirmForm({ search, carId, initialPrice, holdHours }: Props) {
  const router = useRouter();
  const [price, setPrice] = useState(initialPrice);
  const [countryCode, setCountryCode] = useState("91");
  const [code, setCode] = useState("");
  const [codeMsg, setCodeMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [applying, setApplying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function applyCode() {
    const value = code.trim();
    if (!value) return;
    setApplying(true);
    setCodeMsg(null);
    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...search, carId, discountCode: value }),
      });
      const data = await res.json();
      if (res.ok && data.price) {
        setPrice(data.price);
        setCodeMsg(
          data.discountError
            ? { ok: false, text: data.discountError }
            : { ok: true, text: `Code applied. You save ${inr(data.price.discount)}.` },
        );
      } else {
        setCodeMsg({ ok: false, text: data.error ?? "Could not check this code." });
      }
    } catch {
      setCodeMsg({ ok: false, text: "Could not check this code. Please try again." });
    } finally {
      setApplying(false);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    const form = new FormData(e.currentTarget);
    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...search,
          carId,
          customerName: form.get("customerName"),
          countryCode,
          phone: form.get("phone"),
          alternatePhone: form.get("alternatePhone"),
          email: form.get("email"),
          address: form.get("address"),
          notes: form.get("notes"),
          discountCode: price.discountCode ?? "",
          website: form.get("website"),
        }),
      });
      const data = await res.json();
      if (res.ok && data.id) {
        router.push(`/book/success/${data.id}`);
        return;
      }
      if (data.fieldErrors) setFieldErrors(data.fieldErrors);
      setError(data.error ?? "Something went wrong. Please try again or call us.");
    } catch {
      setError("Could not reach the server. Please check your connection and try again.");
    }
    setSubmitting(false);
  }

  const err = (name: string) =>
    fieldErrors[name] ? (
      <p id={`${name}-error`} className="mt-1 text-sm text-red-700">{fieldErrors[name]}</p>
    ) : null;

  return (
    <form onSubmit={onSubmit} className="mt-5 grid gap-5 pb-28 md:grid-cols-[1fr_320px] md:items-start md:pb-0" noValidate>
      <section className="card space-y-4 p-4 sm:p-5" aria-labelledby="details-h">
        <h2 id="details-h" className="text-lg font-bold">Delivery and contact details</h2>
        <div>
          <label htmlFor="address" className="field-label">Delivery address *</label>
          <textarea
            id="address"
            name="address"
            required
            maxLength={500}
            autoComplete="street-address"
            placeholder="House / flat no., street, area, landmark"
            className="field"
            aria-invalid={!!fieldErrors.address}
            aria-describedby={fieldErrors.address ? "address-error" : undefined}
          />
          {err("address")}
        </div>
        <div>
          <label htmlFor="customerName" className="field-label">Full name (as on driving licence) *</label>
          <input id="customerName" name="customerName" required maxLength={80} autoComplete="name" className="field" aria-invalid={!!fieldErrors.customerName} aria-describedby={fieldErrors.customerName ? "customerName-error" : undefined} />
          {err("customerName")}
        </div>
        <div>
          <label htmlFor="phone" className="field-label">WhatsApp number *</label>
          <div className="flex">
            <label htmlFor="countryCode" className="sr-only">Country code</label>
            <select
              id="countryCode"
              name="countryCode"
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="min-h-12 w-28 shrink-0 rounded-l-xl border border-r-0 border-line-strong bg-brand-50 px-2 font-semibold"
            >
              {COUNTRY_CODES.map(([code, country]) => (
                <option key={code + country} value={code}>
                  +{code} {country}
                </option>
              ))}
            </select>
            <input
              id="phone"
              name="phone"
              type="tel"
              inputMode="numeric"
              required
              autoComplete="tel-national"
              placeholder={countryCode === "91" ? "10-digit mobile number" : "Phone number"}
              className="field rounded-l-none"
              aria-invalid={!!fieldErrors.phone}
              aria-describedby={fieldErrors.phone ? "phone-error" : "phone-help"}
            />
          </div>
          <p id="phone-help" className="mt-1 text-xs text-muted">We call this number to confirm, and send your ticket on WhatsApp.</p>
          {err("phone")}
        </div>
        <div>
          <label htmlFor="alternatePhone" className="field-label">Alternate number (optional)</label>
          <input
            id="alternatePhone"
            name="alternatePhone"
            type="tel"
            inputMode="tel"
            autoComplete="off"
            placeholder="Family member or office number"
            className="field"
            aria-invalid={!!fieldErrors.alternatePhone}
            aria-describedby={fieldErrors.alternatePhone ? "alternatePhone-error" : undefined}
          />
          {err("alternatePhone")}
        </div>
        <div>
          <label htmlFor="email" className="field-label">Email (optional)</label>
          <input id="email" name="email" type="email" maxLength={120} autoComplete="email" className="field" aria-invalid={!!fieldErrors.email} aria-describedby={fieldErrors.email ? "email-error" : undefined} />
          {err("email")}
        </div>
        <div>
          <label htmlFor="notes" className="field-label">Notes (optional)</label>
          <textarea id="notes" name="notes" maxLength={500} placeholder="Trip plans, preferred delivery spot, anything else" className="field" />
        </div>
        {/* Honeypot for bots. Hidden from people and screen readers. */}
        <div aria-hidden className="hidden">
          <label>Website <input name="website" tabIndex={-1} autoComplete="off" /></label>
        </div>
      </section>

      <aside className="space-y-4 md:sticky md:top-20">
        <section className="card p-4 sm:p-5" aria-labelledby="price-h">
          <h2 id="price-h" className="mb-2 text-lg font-bold">Price breakdown</h2>
          <PriceTable price={price} />
          <div className="mt-4">
            <label htmlFor="code" className="field-label">Discount code</label>
            <div className="flex gap-2">
              <input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={30}
                className="field uppercase"
                autoComplete="off"
              />
              <button type="button" onClick={applyCode} disabled={applying || !code.trim()} className="btn btn-secondary shrink-0">
                {applying ? <Loader2 className="size-4 animate-spin" aria-hidden /> : "Apply"}
              </button>
            </div>
            {codeMsg && (
              <p role="status" className={`mt-1 text-sm ${codeMsg.ok ? "text-brand-700" : "text-red-700"}`}>{codeMsg.text}</p>
            )}
          </div>
        </section>
        <p className="flex gap-2 rounded-xl border border-accent-300 bg-accent-300/30 p-3 text-sm">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            No payment now. We hold this car for {holdHours} hours and our team will call you to confirm.
          </span>
        </p>
        {error && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>
        )}
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white p-3 shadow-[0_-4px_20px_rgb(0_0_0/0.06)] md:static md:border-0 md:bg-transparent md:p-0 md:shadow-none">
          <div className="mx-auto flex max-w-3xl items-center gap-3 pr-16 md:pr-0">
            <div className="md:hidden">
              <p className="text-lg font-extrabold tabular-nums">{inr(price.total)}</p>
              <p className="text-xs text-muted">{price.days} day{price.days > 1 ? "s" : ""}</p>
            </div>
            <button type="submit" disabled={submitting} className="btn btn-primary flex-1 text-base">
              {submitting ? <Loader2 className="size-5 animate-spin" aria-hidden /> : null}
              {submitting ? "Submitting…" : "Submit booking"}
            </button>
          </div>
        </div>
      </aside>
    </form>
  );
}
