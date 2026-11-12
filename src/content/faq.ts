import type { Settings } from "@/lib/types";
import { inr } from "@/lib/format";

export interface FaqItem {
  q: string;
  a: string;
  category: "Booking" | "Documents" | "Payment" | "Driving" | "Delivery";
}

// Answers that depend on prices or policies read from admin Settings, so they stay in sync.
export function getFaq(s: Settings): FaqItem[] {
  return [
    {
      category: "Booking",
      q: "How do I book a car?",
      a: "Choose your rental type, delivery hub and dates, pick a car that is free for those dates, then enter your address and WhatsApp number. You get a ticket number right away and our team calls you to confirm.",
    },
    {
      category: "Booking",
      q: "Is my booking confirmed as soon as I submit it?",
      a: `No. Submitting holds the car for you for ${s.holdHours} hours. Our team calls you on the number you gave to verify your details and confirm. If we can't confirm within that time, the hold is released.`,
    },
    {
      category: "Booking",
      q: "How can I check my booking?",
      a: "Open My Orders and enter your ticket number or the phone number you booked with.",
    },
    {
      category: "Documents",
      q: "What documents do I need?",
      a: "A valid driving licence, Aadhaar card, and an employee ID or business proof. Please keep the originals ready for verification at delivery.",
    },
    {
      category: "Payment",
      q: "Do I pay online?",
      a: "No online payment is taken on this website. Our team explains the payment steps when they call to confirm your booking.",
    },
    {
      category: "Payment",
      q: "Is GST included in the price?",
      a: "Yes. All rental prices shown on the website include GST.",
    },
    {
      category: "Payment",
      q: "Is there a security deposit?",
      a:
        s.depositAmount > 0
          ? `Yes, a refundable deposit of ${inr(s.depositAmount)} is collected and returned after the car comes back in good condition.`
          : "There is currently no security deposit for standard bookings.",
    },
    {
      category: "Driving",
      q: "How many kilometres are included?",
      a: `Each car includes a daily km allowance (usually ${s.includedKmPerDay} km per day). The allowance and the extra-km rate are shown on every car and in your price breakdown.`,
    },
    {
      category: "Driving",
      q: "Do cars have FASTag?",
      a:
        s.fastagCharge > 0
          ? `Yes. A FASTag charge of ${inr(s.fastagCharge)} is added as a separate line in your price.`
          : "Yes. Toll charges used on the FASTag are settled when you return the car.",
    },
    {
      category: "Delivery",
      q: "Do you deliver the car?",
      a: "Yes. Choose 'Delivery only' if you will return the car to us, or 'Delivery & pickup' if we should collect it too. The delivery fee for your hub is shown in the price.",
    },
  ];
}
