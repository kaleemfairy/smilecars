import { NextResponse } from "next/server";
import { getActiveHubs, getCarById, getDiscount, getSettings } from "@/lib/data";
import { quote } from "@/lib/pricing";
import { validateSearch } from "@/lib/search";
import { clientIp, rateLimit } from "@/lib/rate-limit";

/** Price for one car and search, optionally with a discount code. */
export async function POST(req: Request) {
  if (!rateLimit(`quote:${clientIp(req)}`, 30, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many attempts. Please wait a few minutes." }, { status: 429 });
  }
  const body = await req.json().catch(() => null);
  const result = validateSearch(body);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  const carId = typeof body?.carId === "string" ? body.carId : "";
  const code = typeof body?.discountCode === "string" ? body.discountCode.trim().toUpperCase() : "";

  const [car, hubs, settings] = await Promise.all([getCarById(carId), getActiveHubs(), getSettings()]);
  const hub = hubs.find((h) => h.id === result.search.hub);
  if (!car || !car.active || !hub) return NextResponse.json({ error: "Car or hub not found." }, { status: 404 });

  const discount = code ? await getDiscount(code) : null;
  const q = quote({
    car,
    hub,
    settings,
    rentalType: result.search.type,
    deliveryMode: result.search.mode,
    startAt: result.search.startAt,
    endAt: result.search.endAt,
    discount,
    discountCode: code || null,
  });
  return NextResponse.json(q);
}
