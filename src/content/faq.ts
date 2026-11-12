import type { Settings } from "@/lib/types";
import { inr } from "@/lib/format";

export const FAQ_CATEGORIES = ["About us", "Booking", "Documents & eligibility", "Payment & charges", "During your trip", "Delivery & travel"] as const;

export interface FaqItem {
  q: string;
  a: string;
  category: (typeof FAQ_CATEGORIES)[number];
}

// Based on the old smilecars.net "FAQs & Rental Terms" page. Answers about prices and
// policies read from Admin > Settings, so they stay in sync with what customers are charged.
export function getFaq(s: Settings): FaqItem[] {
  const emergency = s.emergencyPhone || s.phones[0] || "";
  return [
    {
      category: "About us",
      q: "Who are Smile Cars®?",
      a: "Smile Cars® is a Chennai-based self drive car rental company with over 29 years in the rent-a-car business and more than 2,00,000 customers served. We offer well-maintained cars with doorstep delivery across Chennai.",
    },
    {
      category: "About us",
      q: "Are the cars logo-free?",
      a: "Yes. All Smile Cars vehicles are logo-free, so you can drive privately without any rental branding.",
    },
    {
      category: "Booking",
      q: "How do I book a car?",
      a: "Book on this website: choose daily, weekly or monthly, your delivery hub and dates, pick a car that is free, and enter your address and WhatsApp number. You get a ticket number right away. You can also book by calling us or sending a WhatsApp message.",
    },
    {
      category: "Booking",
      q: "Is my booking confirmed as soon as I submit it?",
      a: `Submitting holds the car for you for ${s.holdHours} hours. Our team calls you on the number you gave to verify your details${s.advanceDays > 0 ? ", and the booking is confirmed once the advance is paid" : " and confirm the booking"}. If it isn't confirmed within that time, the hold is released.`,
    },
    {
      category: "Booking",
      q: "How can I check my booking?",
      a: "Open My Orders and enter your ticket number or the phone number you booked with.",
    },
    {
      category: "Booking",
      q: "Can I extend my rental?",
      a: "Yes. Extensions are possible depending on the car's availability. Please tell our team in advance.",
    },
    {
      category: "Documents & eligibility",
      q: "What documents do I need?",
      a: "For local customers: a valid driving licence, Aadhaar card, and employee ID or business proof. For NRI and foreign customers: passport copy, international ID and an international driving licence valid in India. Please keep the originals ready for verification at delivery.",
    },
    {
      category: "Documents & eligibility",
      q: "What is the minimum age to rent a car?",
      a: "For small cars, 24 years, with a driving licence held for at least 3 years. For premium cars and big SUVs, 27 years.",
    },
    {
      category: "Payment & charges",
      q: "Is GST included in the price?",
      a: "Yes. All rental prices shown on the website include GST.",
    },
    {
      category: "Payment & charges",
      q: "Is there a security deposit?",
      a:
        s.depositAmount > 0
          ? `Yes, a refundable deposit of ${inr(s.depositAmount)} is collected and returned after the car comes back in good condition.`
          : "No. There is currently no security deposit for standard bookings.",
    },
    {
      category: "Payment & charges",
      q: "How do I pay?",
      a:
        s.advanceDays > 0
          ? `No payment is taken on this website. To confirm your booking, pay ${s.advanceDays === 1 ? "one day's" : `${s.advanceDays} days'`} rent in advance by Google Pay, PhonePe or bank transfer when our team calls. The remaining rent is paid at the time of delivery.`
          : "No payment is taken on this website. We accept Google Pay, PhonePe and bank transfer; our team explains the payment steps when they call to confirm your booking.",
    },
    {
      category: "Payment & charges",
      q: "Is fuel included?",
      a: "No. Fuel is not included in the rental. Please return the car with the same fuel level it was delivered with.",
    },
    {
      category: "Payment & charges",
      q: "How many kilometres are included?",
      a: `Each car includes a daily km allowance (usually ${s.includedKmPerDay} km per day), shown on every car and in your price breakdown, with the extra-km rate. Unlimited-km options are available at an additional charge; ask our team.`,
    },
    {
      category: "Payment & charges",
      q: "Do the cars have FASTag?",
      a: `Yes. Every car has FASTag. Tolls are deducted through it, and you recharge it based on your usage.${s.fastagCharge > 0 ? ` A FASTag charge of ${inr(s.fastagCharge)} is shown as a separate line in your price.` : ""}`,
    },
    {
      category: "During your trip",
      q: "What happens if the car breaks down?",
      a: `We provide 24/7 support. Our team will help immediately and arrange a replacement car if needed.${emergency ? ` For emergencies, call ${emergency}.` : ""}`,
    },
    {
      category: "Delivery & travel",
      q: "Can the car be delivered to my home, hotel or the airport?",
      a: "Yes. We deliver and collect anywhere in Chennai, including homes, hotels, offices and the airport. Choose 'Delivery only' if you will return the car to us, or 'Delivery & pickup' if we should collect it. The delivery fee for your hub is shown in the price before you book.",
    },
    {
      category: "Delivery & travel",
      q: "Can I take the car outside Chennai or Tamil Nadu?",
      a: "Yes. Outstation and interstate travel is allowed with prior intimation to our team. Interstate permits and taxes are payable as per government rules.",
    },
    {
      category: "Delivery & travel",
      q: "Can I pick up in Chennai and drop the car in another city?",
      a: "Yes, with additional charges. Please call or WhatsApp us to arrange a one-way trip.",
    },
    {
      category: "Delivery & travel",
      q: "Do you deliver to other cities?",
      a: "Yes, for rentals of one week or more, with additional charges. Contact us with your city and dates.",
    },
    {
      category: "Delivery & travel",
      q: "Do you offer long-term or corporate rentals?",
      a: "Yes. We offer weekly, monthly and yearly plans and corporate rentals at special prices. We are also an official transport partner for SriLankan Airlines, Kuwait Airways and Emirates. See Monthly Plans or contact us for a quote.",
    },
  ];
}
