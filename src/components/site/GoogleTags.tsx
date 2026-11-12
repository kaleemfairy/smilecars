"use client";

import { useEffect, useSyncExternalStore } from "react";
import Script from "next/script";
import { ADS_ID, GA_ID, trackContactClick } from "@/lib/track";

// Hosts where Google tags load. Keeps test traffic (localhost, *.vercel.app) out of the
// client's Analytics and Ads reports.
const HOSTS = (process.env.NEXT_PUBLIC_TRACKING_HOSTS ?? "smilecars.net,www.smilecars.net")
  .split(",")
  .map((h) => h.trim().toLowerCase())
  .filter(Boolean);

const noop = () => () => {};

/** Loads gtag.js once for GA4 and Google Ads, and reports call / WhatsApp taps anywhere on the page. */
export function GoogleTags() {
  const enabled = useSyncExternalStore(
    noop,
    () => (GA_ID || ADS_ID) !== "" && HOSTS.includes(window.location.hostname.toLowerCase()),
    () => false,
  );

  useEffect(() => {
    if (!enabled) return;
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a");
      const href = a?.getAttribute("href") ?? "";
      const where = a?.closest("header") ? "header" : a?.closest("footer") ? "footer" : a?.closest(".fixed") ? "floating" : "page";
      if (href.startsWith("tel:")) trackContactClick("call", where);
      else if (/wa\.me|api\.whatsapp\.com/.test(href)) trackContactClick("whatsapp", where);
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, [enabled]);

  if (!enabled) return null;
  const configs = [GA_ID, ADS_ID].filter(Boolean).map((id) => `gtag('config','${id}');`).join("");
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID || ADS_ID}`} strategy="afterInteractive" />
      <Script id="gtag-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());${configs}`}
      </Script>
    </>
  );
}
