"use client";

import { useEffect } from "react";
import { trackBooking } from "@/lib/track";

/** Reports a completed booking once per ticket (not again on refresh). */
export function TrackBooking({ ticket, total, carName }: { ticket: string; total: number; carName: string }) {
  useEffect(() => {
    const key = `tracked-${ticket}`;
    try {
      if (sessionStorage.getItem(key)) return;
    } catch {
      /* storage blocked: still report, at worst once per page view */
    }
    // gtag loads after hydration, so give it a moment. The flag is set only when the event
    // is actually sent, so React's double effect run in development doesn't swallow it.
    const t = setTimeout(() => {
      trackBooking(ticket, total, carName);
      try {
        sessionStorage.setItem(key, "1");
      } catch {
        /* ignore */
      }
    }, 1500);
    return () => clearTimeout(t);
  }, [ticket, total, carName]);
  return null;
}
