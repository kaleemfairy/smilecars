import { inr } from "@/lib/format";
import type { PriceBreakdown } from "@/lib/types";

export function PriceTable({ price }: { price: PriceBreakdown }) {
  const rows: [string, number, string?][] = [[`Rent (${price.rentLabel})`, price.rent, "GST included"]];
  if (price.discount > 0) rows.push([`Discount${price.discountCode ? ` (${price.discountCode})` : ""}`, -price.discount]);
  rows.push(["Delivery fee", price.deliveryFee]);
  if (price.fastagCharge > 0) rows.push(["FASTag charge", price.fastagCharge]);

  return (
    <div>
      <dl className="divide-y divide-line text-sm">
        {rows.map(([label, amount, note]) => (
          <div key={label} className="flex items-start justify-between gap-4 py-2.5">
            <dt>
              {label}
              {note && <span className="block text-xs text-muted">{note}</span>}
            </dt>
            <dd className={`font-semibold tabular-nums ${amount < 0 ? "text-brand-700" : ""}`}>
              {amount < 0 ? `− ${inr(-amount)}` : amount === 0 ? "Free" : inr(amount)}
            </dd>
          </div>
        ))}
        <div className="flex items-center justify-between gap-4 py-3">
          <dt className="text-base font-bold">Total rental</dt>
          <dd className="text-xl font-extrabold tabular-nums">{inr(price.total)}</dd>
        </div>
        {!!price.advance && price.advance > 0 && (
          <>
            <div className="flex items-start justify-between gap-4 bg-tint px-2 py-2.5">
              <dt>
                <strong>Advance to confirm</strong>
                <span className="block text-xs text-muted">Paid by GPay, PhonePe or bank transfer when we call</span>
              </dt>
              <dd className="font-bold tabular-nums">{inr(price.advance)}</dd>
            </div>
            <div className="flex items-start justify-between gap-4 py-2.5">
              <dt>Balance at delivery</dt>
              <dd className="font-semibold tabular-nums">{inr(price.balance ?? price.total - price.advance)}</dd>
            </div>
          </>
        )}
        {price.deposit > 0 && (
          <div className="flex items-start justify-between gap-4 py-2.5">
            <dt>
              Refundable deposit
              <span className="block text-xs text-muted">Returned after the car comes back. Not part of the total.</span>
            </dt>
            <dd className="font-semibold tabular-nums">{inr(price.deposit)}</dd>
          </div>
        )}
      </dl>
      <p className="mt-2 rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-800">
        Includes {price.includedKm.toLocaleString("en-IN")} km for {price.days} day{price.days > 1 ? "s" : ""}. Extra km
        charged at {inr(price.extraKmRate)}/km.
      </p>
    </div>
  );
}
