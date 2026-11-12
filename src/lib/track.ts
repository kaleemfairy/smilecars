"use client";

// Google Analytics 4 + Google Ads helpers. They do nothing unless the gtag script was loaded
// by <GoogleTags />, which only happens on the production hosts.

type Gtag = (...args: unknown[]) => void;
declare global {
  interface Window {
    gtag?: Gtag;
    dataLayer?: unknown[];
  }
}

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "";
export const ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID ?? "";
/** Existing "Outbound click" conversion from the old site, used for call and WhatsApp taps. */
const ADS_CONTACT_LABEL = process.env.NEXT_PUBLIC_GOOGLE_ADS_CONTACT_LABEL ?? "";
/** Optional separate conversion for completed bookings (create it in Google Ads, paste the label). */
const ADS_BOOKING_LABEL = process.env.NEXT_PUBLIC_GOOGLE_ADS_BOOKING_LABEL ?? "";

export function track(event: string, params: Record<string, unknown> = {}) {
  window.gtag?.("event", event, params);
}

function adsConversion(label: string, params: Record<string, unknown> = {}) {
  if (ADS_ID && label) window.gtag?.("event", "conversion", { send_to: `${ADS_ID}/${label}`, ...params });
}

export function trackContactClick(kind: "call" | "whatsapp", location: string) {
  track(kind === "call" ? "click_call" : "click_whatsapp", { link_location: location });
  adsConversion(ADS_CONTACT_LABEL);
}

export function trackBooking(ticket: string, total: number, carName: string) {
  track("generate_lead", { currency: "INR", value: total, transaction_id: ticket, item_name: carName });
  adsConversion(ADS_BOOKING_LABEL, { value: total, currency: "INR", transaction_id: ticket });
}
