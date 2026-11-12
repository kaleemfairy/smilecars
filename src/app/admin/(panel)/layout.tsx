import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, CarFront, ClipboardList, Inbox, MapPin, Settings } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { Logo } from "@/components/site/Logo";
import { LogoutButton } from "./LogoutButton";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin" }, robots: { index: false, follow: false } };

const NAV = [
  { href: "/admin", label: "Bookings", icon: ClipboardList, owner: false },
  { href: "/admin/calendar", label: "Calendar", icon: CalendarDays, owner: false },
  { href: "/admin/cars", label: "Cars", icon: CarFront, owner: true },
  { href: "/admin/hubs", label: "Hubs", icon: MapPin, owner: true },
  { href: "/admin/enquiries", label: "Enquiries", icon: Inbox, owner: true },
  { href: "/admin/settings", label: "Settings", icon: Settings, owner: true },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireStaff();
  const nav = NAV.filter((n) => !n.owner || staff.role === "owner");
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="border-b border-line bg-white lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-3 px-4 py-3 lg:block lg:py-5">
          <Link href="/admin"><Logo /></Link>
          <div className="text-right text-xs lg:mt-3 lg:text-left">
            <p className="font-semibold">{staff.name || staff.email}</p>
            <p className="capitalize text-muted">{staff.role}</p>
          </div>
        </div>
        <nav aria-label="Admin" className="flex gap-1 overflow-x-auto px-2 pb-2 lg:flex-1 lg:flex-col lg:overflow-visible lg:px-3">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold hover:bg-brand-50 hover:text-brand-700">
              <Icon className="size-4" aria-hidden />
              {label}
            </Link>
          ))}
          <Link href="/" className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-muted hover:bg-brand-50 lg:mt-auto">
            View website
          </Link>
          <LogoutButton />
        </nav>
      </aside>
      <main className="min-w-0 p-4 lg:p-8">{children}</main>
    </div>
  );
}
