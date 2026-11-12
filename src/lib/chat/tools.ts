import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { findAvailableCars, findBookingsByTicket } from "../bookings";
import { getActiveCars, getActiveHubs, getCarById, getDiscount, getSettings } from "../data";
import { quote } from "../pricing";
import { searchToQuery, validateSearch } from "../search";
import { fmtDateTime, inr, LABELS, normalizeLookupPhone } from "../format";
import { BODY_TYPES, FUELS, RENTAL_TYPES, TRANSMISSIONS, DELIVERY_MODES } from "../types";

// Server-side tools for the chatbot. Each one reuses the same queries as the website,
// so the bot sees the same cars, prices and availability as the booking flow.

const dateProps = {
  pickup_date: { type: "string", description: "Pickup date, YYYY-MM-DD (India time)." },
  pickup_time: { type: "string", description: "Pickup time, HH:mm 24-hour (India time). Use 10:00 if the customer didn't say." },
  return_date: { type: "string", description: "Return date, YYYY-MM-DD (India time)." },
  return_time: { type: "string", description: "Return time, HH:mm 24-hour. Use the pickup time if the customer didn't say." },
  rental_type: { type: "string", enum: [...RENTAL_TYPES], description: "daily (default), weekly (7+ days) or monthly (30+ days)." },
  hub_id: { type: "string", description: "Delivery hub id from list_hubs. Omit to use the first hub." },
  delivery_mode: { type: "string", enum: [...DELIVERY_MODES], description: "two-way = delivery and pickup (default), one-way = delivery only." },
} as const;

export const CHAT_TOOLS: Anthropic.Tool[] = [
  {
    name: "search_available_cars",
    description:
      "Find cars that are free for the customer's dates, with the total price for the trip and a booking link. Use this whenever the customer asks what is available or what a trip would cost.",
    input_schema: {
      type: "object",
      properties: {
        ...dateProps,
        body_type: { type: "string", enum: [...BODY_TYPES] },
        transmission: { type: "string", enum: [...TRANSMISSIONS] },
        fuel: { type: "string", enum: [...FUELS] },
        min_seats: { type: "integer", minimum: 2, maximum: 10 },
      },
      required: ["pickup_date", "return_date"],
    },
  },
  {
    name: "get_price_quote",
    description:
      "Full price breakdown for one car and dates, optionally with a discount code. Use after the customer picks a car, or to check a discount code.",
    input_schema: {
      type: "object",
      properties: {
        car_id: { type: "string", description: "Car id from search_available_cars or list_fleet." },
        ...dateProps,
        discount_code: { type: "string" },
      },
      required: ["car_id", "pickup_date", "return_date"],
    },
  },
  {
    name: "list_fleet",
    description: "List the cars in the fleet with daily, weekly and monthly rates. Does not check dates.",
    input_schema: {
      type: "object",
      properties: {
        body_type: { type: "string", enum: [...BODY_TYPES] },
        transmission: { type: "string", enum: [...TRANSMISSIONS] },
      },
    },
  },
  {
    name: "list_hubs",
    description: "List delivery hubs with their ids and delivery fees.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "get_booking_status",
    description:
      "Look up a booking's status. Needs BOTH the ticket number and the phone number used for the booking; never reveal a booking without both.",
    input_schema: {
      type: "object",
      properties: {
        ticket: { type: "string", description: "Ticket number, e.g. SC-0042." },
        phone: { type: "string", description: "Phone number used for the booking." },
      },
      required: ["ticket", "phone"],
    },
  },
  {
    name: "get_business_info",
    description:
      "Contact numbers, address, documents needed, deposit, FASTag charge, km allowance, hold time and how booking works.",
    input_schema: { type: "object", properties: {} },
  },
];

const dates = z.object({
  pickup_date: z.string(),
  pickup_time: z.string().default("10:00"),
  return_date: z.string(),
  return_time: z.string().optional(),
  rental_type: z.enum(RENTAL_TYPES).default("daily"),
  hub_id: z.string().optional(),
  delivery_mode: z.enum(DELIVERY_MODES).default("two-way"),
});

async function toSearch(input: unknown) {
  const d = dates.parse(input);
  const hubs = await getActiveHubs();
  const hub = hubs.find((h) => h.id === d.hub_id) ?? hubs[0];
  if (!hub) return { ok: false as const, error: "No delivery hubs are set up yet. Ask the customer to call us." };
  return validateSearch({
    type: d.rental_type,
    hub: hub.id,
    mode: d.delivery_mode,
    pd: d.pickup_date,
    pt: d.pickup_time,
    rd: d.return_date,
    rt: d.return_time ?? d.pickup_time,
  });
}

export async function runChatTool(name: string, input: unknown): Promise<string> {
  switch (name) {
    case "search_available_cars": {
      const filters = z
        .object({
          body_type: z.enum(BODY_TYPES).optional(),
          transmission: z.enum(TRANSMISSIONS).optional(),
          fuel: z.enum(FUELS).optional(),
          min_seats: z.number().int().optional(),
        })
        .parse(input);
      const s = await toSearch(input);
      if (!s.ok) return JSON.stringify({ error: s.error });
      const { hub, results } = await findAvailableCars(s.search);
      const query = searchToQuery(s.search);
      const cars = results
        .filter((r) => !filters.body_type || r.car.bodyType === filters.body_type)
        .filter((r) => !filters.transmission || r.car.transmission === filters.transmission)
        .filter((r) => !filters.fuel || r.car.fuel === filters.fuel)
        .filter((r) => !filters.min_seats || r.car.seats >= filters.min_seats)
        .slice(0, 6)
        .map((r) => ({
          car_id: r.car.id,
          name: r.car.name,
          type: LABELS.bodyType[r.car.bodyType],
          transmission: LABELS.transmission[r.car.transmission],
          fuel: LABELS.fuel[r.car.fuel],
          seats: r.car.seats,
          total_price: inr(r.price.total),
          days: r.price.days,
          included_km: r.price.includedKm,
          book_link: `/book/confirm?${query}&car=${encodeURIComponent(r.car.id)}`,
        }));
      return JSON.stringify({
        hub: hub?.name,
        pickup: fmtDateTime(s.search.startAt),
        return: fmtDateTime(s.search.endAt),
        available_count: cars.length,
        all_results_link: `/book?${query}`,
        cars,
      });
    }
    case "get_price_quote": {
      const extra = z.object({ car_id: z.string(), discount_code: z.string().optional() }).parse(input);
      const s = await toSearch(input);
      if (!s.ok) return JSON.stringify({ error: s.error });
      const [car, hubs, settings] = await Promise.all([getCarById(extra.car_id), getActiveHubs(), getSettings()]);
      const hub = hubs.find((h) => h.id === s.search.hub);
      if (!car || !car.active || !hub) return JSON.stringify({ error: "Car not found." });
      const code = extra.discount_code?.trim().toUpperCase() || null;
      const q = quote({
        car,
        hub,
        settings,
        rentalType: s.search.type,
        deliveryMode: s.search.mode,
        startAt: s.search.startAt,
        endAt: s.search.endAt,
        discount: code ? await getDiscount(code) : null,
        discountCode: code,
      });
      const p = q.price;
      return JSON.stringify({
        car: car.name,
        note: "This is a price, not an availability check. Use search_available_cars to confirm the car is free.",
        rent: `${inr(p.rent)} (${p.rentLabel}, GST included)`,
        discount: p.discount ? inr(p.discount) : null,
        discount_error: q.discountError,
        delivery_fee: inr(p.deliveryFee),
        fastag_charge: inr(p.fastagCharge),
        total: inr(p.total),
        advance_to_confirm: p.advance ? inr(p.advance) : null,
        balance_at_delivery: p.advance ? inr(p.balance ?? p.total - p.advance) : null,
        refundable_deposit: inr(p.deposit),
        included_km: p.includedKm,
        extra_km_rate: `${inr(p.extraKmRate)}/km`,
        book_link: `/book/confirm?${searchToQuery(s.search)}&car=${encodeURIComponent(car.id)}`,
      });
    }
    case "list_fleet": {
      const f = z
        .object({ body_type: z.enum(BODY_TYPES).optional(), transmission: z.enum(TRANSMISSIONS).optional() })
        .parse(input ?? {});
      const cars = (await getActiveCars())
        .filter((c) => !f.body_type || c.bodyType === f.body_type)
        .filter((c) => !f.transmission || c.transmission === f.transmission)
        .map((c) => ({
          car_id: c.id,
          name: c.name,
          type: LABELS.bodyType[c.bodyType],
          transmission: LABELS.transmission[c.transmission],
          fuel: LABELS.fuel[c.fuel],
          seats: c.seats,
          per_day: inr(c.dailyRate),
          per_week: c.weeklyRate ? inr(c.weeklyRate) : null,
          per_month: c.monthlyRate ? inr(c.monthlyRate) : null,
          extra_km: `${inr(c.extraKmRate)}/km`,
          page: `/cars/${c.slug}`,
        }));
      return JSON.stringify({ cars });
    }
    case "list_hubs": {
      const hubs = await getActiveHubs();
      return JSON.stringify({
        hubs: hubs.map((h) => ({ hub_id: h.id, name: h.name, area: h.area, delivery_fee_each_way: inr(h.deliveryFee) })),
      });
    }
    case "get_booking_status": {
      const d = z.object({ ticket: z.string(), phone: z.string() }).parse(input);
      const phone = normalizeLookupPhone(d.phone);
      const match = phone ? (await findBookingsByTicket(d.ticket)).find((b) => b.phone === phone) : undefined;
      if (!match) return JSON.stringify({ error: "No booking matches that ticket and phone number." });
      return JSON.stringify({
        ticket: match.ticket,
        status: LABELS.status[match.status],
        car: match.carName,
        pickup: fmtDateTime(match.startAt),
        return: fmtDateTime(match.endAt),
        total: inr(match.price.total),
        hold_expires: match.status === "new" ? fmtDateTime(match.holdExpiresAt) : null,
      });
    }
    case "get_business_info": {
      const s = await getSettings();
      return JSON.stringify({
        business: s.businessName,
        address: s.address,
        branch_offices: s.branchAddresses,
        phones: s.phones,
        whatsapp: `https://wa.me/${s.whatsappNumber.replace(/\D/g, "")}`,
        email: s.email,
        documents_needed: ["Driving licence", "Aadhaar card", "Employee ID or business proof"],
        refundable_deposit: inr(s.depositAmount),
        fastag_charge: inr(s.fastagCharge),
        included_km_per_day: s.includedKmPerDay,
        prices_include_gst: true,
        online_payment: false,
        how_booking_works: `Book on the website without logging in. The car is held for ${s.holdHours} hours and staff call to confirm. Track it at /my-orders.`,
        advance_to_confirm:
          s.advanceDays > 0
            ? `${s.advanceDays} day(s) of the car's daily rent, paid by Google Pay, PhonePe or bank transfer when staff call; the balance is paid at delivery. The exact amount is shown as "advance" in get_price_quote.`
            : "No advance; staff explain payment on the call.",
        payment_methods: ["Google Pay", "PhonePe", "Bank transfer"],
      });
    }
    default:
      return JSON.stringify({ error: `Unknown tool ${name}` });
  }
}
