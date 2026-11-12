import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { toBooking } from "@/lib/bookings";
import { getSettings } from "@/lib/data";
import { notifyDeliveryDay } from "@/lib/notifications";
import { istDayRange, todayIst } from "@/lib/time";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Sends the delivery-day WhatsApp message for confirmed bookings starting today (IST).
 * Vercel Cron calls this once each morning (see vercel.json) with
 * "Authorization: Bearer $CRON_SECRET".
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { start, end } = istDayRange(todayIst());
  const snap = await adminDb().collection("bookings").where("startAt", ">=", start).where("startAt", "<", end).get();
  const settings = await getSettings();
  let sent = 0;
  for (const doc of snap.docs) {
    const b = toBooking(doc);
    if (b.status !== "confirmed" || b.deliveryReminderSent) continue;
    const res = await notifyDeliveryDay(b, settings);
    if (res.status === "sent") {
      await doc.ref.update({ deliveryReminderSent: true });
      sent++;
    }
  }
  return NextResponse.json({ checked: snap.size, sent });
}
