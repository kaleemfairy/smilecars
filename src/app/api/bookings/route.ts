import { NextResponse, after } from "next/server";
import { z } from "zod";
import { createBooking } from "@/lib/bookings";
import { getSettings } from "@/lib/data";
import { normalizeIndianMobile, normalizePhone } from "@/lib/format";
import { notifyNewBooking } from "@/lib/notifications";
import { validateSearch } from "@/lib/search";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const customerSchema = z.object({
  carId: z.string().min(1).max(60),
  customerName: z.string().trim().min(2, "Please enter your full name.").max(80),
  phone: z.string().trim().min(1, "Please enter your WhatsApp number."),
  email: z.union([z.literal(""), z.email("Please enter a valid email or leave it blank.")]).default(""),
  address: z.string().trim().min(10, "Please enter the full delivery address.").max(500),
  notes: z.string().trim().max(500).default(""),
  discountCode: z.string().trim().max(30).default(""),
  website: z.string().optional(),
});

/** Creates a booking (status "new") after re-checking availability on the server. */
export async function POST(req: Request) {
  if (!rateLimit(`book:${clientIp(req)}`, 8, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many bookings from this connection. Please call us to book." },
      { status: 429 },
    );
  }
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  // Bots fill the hidden "website" field. Reject without saving anything.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const search = validateSearch(body);
  if (!search.ok) return NextResponse.json({ error: search.error }, { status: 400 });

  const parsed = customerSchema.safeParse({
    ...body,
    email: typeof body.email === "string" ? body.email.trim() : "",
    notes: typeof body.notes === "string" ? body.notes : "",
  });
  const fieldErrors: Record<string, string> = {};
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fieldErrors[key] ??= issue.message;
    }
  }
  const cc = typeof body.countryCode === "string" ? body.countryCode : "91";
  const phone = typeof body.phone === "string" ? normalizePhone(cc, body.phone) : null;
  const altRaw = typeof body.alternatePhone === "string" ? body.alternatePhone.trim() : "";
  // The alternate number may be an Indian mobile even when the main one is foreign.
  const alternatePhone = altRaw ? (normalizeIndianMobile(altRaw) ?? normalizePhone(cc, altRaw)) : "";
  if (altRaw && !alternatePhone) fieldErrors.alternatePhone = "Please check the alternate number, or leave it blank.";
  if (!phone) fieldErrors.phone ??= cc === "91" ? "Please enter a valid 10-digit Indian mobile number." : "Please check the phone number and country code.";
  if (!parsed.success || !phone || (altRaw && !alternatePhone)) {
    return NextResponse.json({ error: "Please check the highlighted fields.", fieldErrors }, { status: 400 });
  }

  const d = parsed.data;
  const result = await createBooking({
    search: search.search,
    carId: d.carId,
    customerName: d.customerName,
    phone,
    alternatePhone: alternatePhone || "",
    email: d.email,
    address: d.address,
    notes: d.notes,
    discountCode: d.discountCode,
  });

  if (!result.ok) {
    const status = result.code === "unavailable" ? 409 : 400;
    return NextResponse.json({ error: result.error, code: result.code }, { status });
  }

  // Send WhatsApp messages after the response so the customer isn't kept waiting.
  const booking = result.booking;
  after(async () => {
    try {
      await notifyNewBooking(booking, await getSettings());
    } catch (err) {
      console.error("notifyNewBooking failed", err);
    }
  });

  return NextResponse.json({ id: booking.id, ticket: booking.ticket }, { status: 201 });
}
