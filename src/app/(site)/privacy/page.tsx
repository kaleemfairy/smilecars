import type { Metadata } from "next";
import { getPublicSettings } from "@/lib/data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Privacy policy" };

// Plain-language starting point. Have the client (or their advisor) review it before launch,
// in particular against India's Digital Personal Data Protection Act, 2023.
export default async function PrivacyPage() {
  const s = await getPublicSettings();
  return (
    <div className="container-page max-w-3xl py-8">
      <h1 className="text-3xl font-extrabold">Privacy policy</h1>
      <div className="prose-page mt-4">
        <p>This policy explains what personal information {s.businessName} collects on this website and how we use it.</p>
        <h2>What we collect</h2>
        <ul>
          <li>When you book: your name, WhatsApp number, email (optional), delivery address, notes and trip details.</li>
          <li>When you send a vehicle enquiry: your name, phone number and details about your car.</li>
          <li>When you use the chat assistant: the messages you type.</li>
          <li>Basic technical data such as your IP address, used to prevent abuse.</li>
        </ul>
        <h2>How we use it</h2>
        <ul>
          <li>To check availability, confirm your booking by phone and deliver the car.</li>
          <li>To send booking updates on WhatsApp, such as your ticket number, confirmation and delivery-day reminder.</li>
          <li>To answer your questions and enquiries.</li>
        </ul>
        <p>We do not sell your personal information or use it for advertising by other companies.</p>
        <h2>Who we share it with</h2>
        <p>
          We use trusted service providers to run this website: Google Firebase (data storage), Vercel (hosting), Meta
          WhatsApp Business (messages) and Anthropic (the AI chat assistant, which processes the messages you type in the chat).
          They process data only to provide these services to us.
        </p>
        <h2>How long we keep it</h2>
        <p>We keep booking records for as long as needed for our business, accounting and legal requirements.</p>
        <h2>Your choices</h2>
        <p>
          You can ask us to see, correct or delete your personal information by writing to{" "}
          <a href={`mailto:${s.email}`} className="font-semibold text-brand-700 underline">{s.email}</a> or calling {s.phones[0]}.
        </p>
        <h2>Contact</h2>
        <p>{s.businessName}, {s.address}.</p>
      </div>
    </div>
  );
}
