import type { Metadata } from "next";
import { BadgeIndianRupee, ShieldCheck, Wrench } from "lucide-react";
import { EnquiryForm } from "./EnquiryForm";
import { PageHeader } from "@/components/site/PageHeader";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Attach your vehicle",
  description: "Own a car in Chennai? Attach it with Smile Cars and earn from it when you are not using it.",
};

export default function AttachPage() {
  return (
    <>
    <PageHeader
      narrow
      eyebrow="Have a car to share?"
      title={<>Let your car earn its own <em className="not-italic text-brand-500">smile.</em></>}
      lead="Earn from your car when you are not using it. Tell us about your car and our team will call you to explain how it works."
    />
    <div className="container-page max-w-3xl py-10">
      <ul className=" grid gap-3 sm:grid-cols-3">
        {[
          [BadgeIndianRupee, "Regular income", "From your idle car"],
          [ShieldCheck, "29+ years in Chennai", "A team you can trust"],
          [Wrench, "We handle bookings", "And the customers"],
        ].map(([Icon, t, s]) => {
          const I = Icon as typeof Wrench;
          return (
            <li key={t as string} className="card flex items-center gap-3 p-4">
              <I className="size-7 text-brand-700" aria-hidden />
              <div><p className="font-bold">{t as string}</p><p className="text-sm text-muted">{s as string}</p></div>
            </li>
          );
        })}
      </ul>
      <div className="mt-8"><EnquiryForm /></div>
    </div>
    </>
  );
}
