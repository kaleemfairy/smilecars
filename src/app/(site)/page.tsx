import Link from "next/link";
import { ArrowRight, ArrowUpRight, CalendarSearch, CarFront, Handshake, KeyRound, PhoneCall, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { getActiveCars, getActiveHubs, getPublicSettings } from "@/lib/data";
import { safe } from "@/lib/safe";
import { inr } from "@/lib/format";
import { searchDefaults } from "@/lib/search-defaults";
import { SearchForm } from "@/components/booking/SearchForm";
import { LOCATIONS } from "@/content/locations";
import { ProofStrip, Testimonials } from "@/components/content/Trust";
import { GOOGLE_RATING } from "@/content/testimonials";
import { getFaq } from "@/content/faq";
import { BODY_TYPES, type BodyType } from "@/lib/types";

export const dynamic = "force-dynamic";

// The client's own cars, photographed in Chennai (public/photos).
const CATEGORY: Record<BodyType, { title: string; line: string; photo: string; alt: string }> = {
  hatchback: { title: "Hatchbacks", line: "Easy on the city. Easy on you.", photo: "/photos/fleet-hatchback.webp", alt: "A Smile Cars hatchback" },
  sedan: { title: "Sedans", line: "A little more room to roam.", photo: "/photos/fleet-sedan.webp", alt: "A Smile Cars sedan" },
  suv: { title: "Compact SUVs", line: "Take the long way round.", photo: "/photos/fleet-suv.webp", alt: "A Smile Cars compact SUV" },
  muv: { title: "7–8 seaters", line: "Bring everyone along.", photo: "/photos/fleet-seven.webp", alt: "A Smile Cars 7-seater" },
  luxury: { title: "Premium SUVs", line: "More comfort for longer drives.", photo: "/photos/fleet-premium.webp", alt: "A Smile Cars premium SUV" },
};

const FAQ_PICKS = ["What documents do I need?", "How do I pay?", "Can the car be delivered to my home, hotel or the airport?"];

export default async function HomePage() {
  const [hubs, cars, settings] = await Promise.all([
    safe(getActiveHubs, [], "hubs"),
    safe(getActiveCars, [], "cars"),
    getPublicSettings(),
  ]);
  const { defaults, minDate } = searchDefaults(hubs);

  const categories = BODY_TYPES.map((type) => {
    const inType = cars.filter((c) => c.bodyType === type && c.dailyRate > 0);
    return { type, count: inType.length, from: inType.length ? Math.min(...inType.map((c) => c.dailyRate)) : 0 };
  }).filter((c) => c.count > 0);
  const extraKm = Math.min(...cars.map((c) => c.extraKmRate).filter((r) => r > 0), Infinity);

  const advance =
    settings.advanceDays > 0
      ? `Pay ${settings.advanceDays === 1 ? "one day's" : `${settings.advanceDays} days'`} rent in advance after our team confirms. The rest at delivery.`
      : "Our team calls you to confirm. Pay at delivery.";
  const faqs = getFaq(settings).filter((f) => FAQ_PICKS.includes(f.q));

  return (
    <>
      {/* Hero */}
      <section className="container-page grid gap-6 pb-4 pt-7 lg:min-h-[470px] lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:gap-10 lg:pb-10 lg:pt-14">
        <div>
          <p className="eyebrow flex items-center gap-2 text-[10px] sm:text-[11px]">
            <span className="size-[7px] rounded-full bg-brand-500 shadow-[0_0_0_4px_rgb(39_174_144/0.12)]" aria-hidden />
            Chennai&rsquo;s own car rental company
          </p>
          <h1 className="hero-title mt-4 font-display text-[46px] font-extrabold leading-[1.02] tracking-[-0.055em] sm:text-[60px] lg:mt-6 lg:text-[clamp(52px,5.1vw,72px)]">
            Your city.
            <br />
            <em>Your car.</em>
            <br />
            Big smile.
            <span className="mt-4 block font-sans text-[16px] font-normal leading-snug tracking-normal text-[#5d6974] sm:text-[18px]">
              Self drive cars in Chennai, delivered to your door.
            </span>
          </h1>
          <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-[#52616a]">
            <span className="tracking-[2px] text-[#efa932]" aria-hidden>★★★★★</span>
            <b className="text-ink">{GOOGLE_RATING.stars}</b> on Google
            <span className="size-1 rounded-full bg-[#b9c6c2]" aria-hidden />
            <b className="text-ink">29+ years</b> of happy drives
          </p>
          <div className="mt-8 hidden items-center gap-3 text-[13px] leading-relaxed text-[#63736e] lg:flex">
            <span className="flex size-[42px] items-center justify-center rounded-[10px] bg-tint text-brand-700">
              <Truck className="size-5" aria-hidden />
            </span>
            <span>
              Doorstep delivery across Chennai
              <br />
              <b className="text-ink">
                {settings.includedKmPerDay} km/day included · No login needed
              </b>
            </span>
          </div>
        </div>
        <div className="relative h-[230px] overflow-hidden rounded-xl bg-tint sm:h-[330px] lg:h-[390px] lg:rounded-[14px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/photos/cta-swift.webp"
            alt="A Smile Cars Maruti Swift parked on a Chennai street"
            width={1600}
            height={1200}
            fetchPriority="high"
            className="size-full object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#13221c]/45 to-transparent" aria-hidden />
          <p className="absolute bottom-4 left-4 flex items-center gap-1.5 text-[12px] font-semibold text-white sm:bottom-5 sm:left-6 sm:text-[13px]">
            <Sparkles className="size-3.5 text-[#7ee2bd]" aria-hidden />
            Your next Chennai drive starts here
          </p>
          <div className="absolute right-3 top-3 grid size-[72px] rotate-[8deg] place-content-center rounded-full bg-white text-center shadow-[0_10px_30px_rgb(23_53_44/0.13)] sm:right-5 sm:top-5 sm:size-[92px]">
            <b className="font-display text-[15px] font-extrabold text-brand-700 sm:text-[19px]">2 lakh+</b>
            <small className="text-[8px] text-[#6d7778] sm:text-[9px]">happy customers</small>
          </div>
        </div>
      </section>

      {/* Booking search (step 1) */}
      <section id="book" className="container-page scroll-mt-24 pb-6 lg:pb-11">
        <div className="rounded-[14px] border border-[#e4efeb] bg-white px-4 pb-3 pt-5 shadow-raised sm:px-7 sm:pb-4 sm:pt-6">
          <div className="mb-1 flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="eyebrow">Let&rsquo;s get you moving</p>
              <h2 className="mt-1.5 text-[20px] font-bold tracking-tight sm:text-[23px]">Where to, Chennai?</h2>
            </div>
            <p className="flex items-center gap-1.5 text-[12px] text-[#5d6a64]">
              <ShieldCheck className="size-4 text-brand-700" aria-hidden />
              No payment until we call
            </p>
          </div>
          <div className="mt-4">
            <SearchForm hubs={hubs} defaults={defaults} minDate={minDate} />
          </div>
        </div>
      </section>

      <ProofStrip />

      {/* How it works */}
      <section className="container-page py-14 lg:py-24">
        <div className="mb-6 flex items-end justify-between gap-4 lg:mb-8">
          <div>
            <p className="eyebrow">Simple as a smile</p>
            <h2 className="section-title mt-2.5">
              Four steps to <em>go.</em>
            </h2>
          </div>
          <Link href="/faq" className="text-link shrink-0">
            How booking works <ArrowUpRight className="size-4" aria-hidden />
          </Link>
        </div>
        <ol className="grid grid-cols-2 gap-2.5 lg:grid-cols-4 lg:gap-3.5">
          {[
            [CalendarSearch, "Find your ride", "Choose your dates and we'll show you what's free, with the full price."],
            [CarFront, "Pick your car", "Room for two, or the whole family. Your call."],
            [PhoneCall, "We call, you confirm", `We hold the car for ${settings.holdHours} hours. ${advance}`],
            [KeyRound, "We bring the keys", "Doorstep delivery and pickup, anywhere across Chennai."],
          ].map(([Icon, title, text], i) => {
            const I = Icon as typeof CarFront;
            return (
              <li key={i} className="card relative p-4 lg:min-h-[183px] lg:p-5">
                <span className="absolute right-4 top-4 font-display text-[11px] font-semibold text-[#8fa89f]" aria-hidden>
                  0{i + 1}
                </span>
                <span className="flex size-9 items-center justify-center rounded-[9px] bg-tint text-brand-700">
                  <I className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 text-[14px] font-bold sm:text-[15px]">{title as string}</h3>
                <p className="mt-1.5 text-[12px] leading-relaxed text-[#68756f] sm:text-[13px]">{text as string}</p>
              </li>
            );
          })}
        </ol>
        <p className="mt-5 text-center text-[12px] text-[#68756f]">No login. No online payment. Just a real person to help.</p>
      </section>

      {/* Fleet categories */}
      {categories.length > 0 && (
        <section className="container-page pb-14 lg:pb-24">
          <div className="mb-6 flex items-end justify-between gap-4 lg:mb-8">
            <div>
              <p className="eyebrow">Find your kind of drive</p>
              <h2 className="section-title mt-2.5">
                Room for every <em>plan.</em>
              </h2>
            </div>
            <Link href="/cars" className="text-link shrink-0">
              View all cars <ArrowUpRight className="size-4" aria-hidden />
            </Link>
          </div>
          <ul className="grid grid-cols-2 gap-x-2.5 gap-y-4 md:grid-cols-3 lg:grid-cols-5 lg:gap-4">
            {categories.map((c) => {
              const meta = CATEGORY[c.type];
              return (
                <li key={c.type}>
                  <Link href={`/cars?body=${c.type}`} className="group block">
                    <div className="relative h-[150px] overflow-hidden rounded-[10px] bg-tint sm:h-[200px]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={meta.photo} alt={meta.alt} loading="lazy" className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                      <span className="absolute right-2.5 top-2.5 flex size-8 items-center justify-center rounded-full bg-white/90 text-brand-700" aria-hidden>
                        <ArrowUpRight className="size-4" />
                      </span>
                    </div>
                    <div className="px-0.5 pt-3">
                      <h3 className="text-[14px] font-bold group-hover:text-brand-700 sm:text-[15px]">{meta.title}</h3>
                      <p className="mt-0.5 text-[12px] text-[#6f7b76]">{meta.line}</p>
                      <p className="mt-1.5 text-[13px] font-bold">
                        from {inr(c.from)}
                        <span className="font-medium text-[#6f7b76]">/day</span>
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
          <p className="mt-5 flex flex-col gap-1 border-t border-line pt-4 text-[12px] text-[#596861] sm:flex-row sm:justify-between">
            <span>
              <b className="text-brand-700">{settings.includedKmPerDay} km/day</b> included on every car
              {Number.isFinite(extraKm) && <> · Extra distance {inr(extraKm)}/km</>}
            </span>
            <span className="text-[#77847f]">All prices include GST</span>
          </p>
        </section>
      )}

      {/* Monthly plans callout */}
      <section className="container-page pb-4">
        <div className="relative overflow-hidden rounded-[14px] bg-tint-strong px-5 py-7 sm:px-10 sm:py-11 lg:grid lg:min-h-[320px] lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:px-14">
          <div className="relative z-10 max-w-[56%] lg:max-w-none">
            <p className="eyebrow">Your next chapter</p>
            <h2 className="section-title mt-2.5">
              Stay a little
              <br />
              <em>longer.</em>
            </h2>
            <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-[#5c7067]">
              Going month to month? Lower monthly rates, delivered to your door. No loan, no maintenance worries.
            </p>
            <Link href="/monthly-plans" className="btn btn-dark mt-5 min-h-11 gap-2 px-4 text-[13px]">
              Explore monthly plans <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          <div className="absolute inset-y-0 right-0 w-[48%] [clip-path:polygon(28%_0,100%_0,100%_100%,0_100%)] lg:w-[57%] lg:[clip-path:polygon(19%_0,100%_0,100%_100%,0_100%)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/photos/hero-brezza.webp" alt="" loading="lazy" className="size-full object-cover" />
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="container-page py-14 lg:py-20">
        <div className="mb-6 flex items-end justify-between gap-4 lg:mb-8">
          <div>
            <p className="eyebrow">The good word gets around</p>
            <h2 className="section-title mt-2.5">
              Chennai says <em>smile.</em>
            </h2>
          </div>
          <div className="shrink-0 text-right">
            <span className="block tracking-[2px] text-[#efa932]" aria-hidden>★★★★★</span>
            <b className="font-display text-[22px] font-extrabold sm:text-[28px]">{GOOGLE_RATING.stars}</b>
            <small className="ml-1.5 text-[11px] text-[#6f7a75]">Google · {GOOGLE_RATING.reviews.replace("3200", "3,200")} reviews</small>
          </div>
        </div>
        <Testimonials limit={3} />
      </section>

      {/* Owner banner */}
      <section className="relative overflow-hidden bg-forest text-white">
        <div
          className="pointer-events-none absolute -right-20 -top-52 size-[360px] rounded-full border border-white/10 shadow-[0_0_0_40px_rgb(255_255_255/0.03),0_0_0_80px_rgb(255_255_255/0.02)]"
          aria-hidden
        />
        <div className="container-page relative grid gap-5 py-9 md:grid-cols-[auto_1fr_1fr] md:items-center md:gap-8 md:py-12">
          <span className="hidden size-16 items-center justify-center rounded-2xl bg-white/10 text-[#69cdb0] md:flex" aria-hidden>
            <Handshake className="size-8" />
          </span>
          <div>
            <p className="eyebrow text-[#78d9ba]">Have a car to share?</p>
            <h2 className="section-title mt-2.5">
              Let your car earn
              <br />
              its own <em className="!text-[#7ee2bd]">smile.</em>
            </h2>
          </div>
          <div>
            <p className="max-w-sm text-[13px] leading-relaxed text-[#bed4cd]">
              Earn from your car when you are not using it. Tell us about it and our fleet team will call you.
            </p>
            <Link href="/attach-your-vehicle" className="btn btn-outline-light mt-4 min-h-11 gap-2 px-4 text-[13px]">
              Attach your car <ArrowUpRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      {/* Areas */}
      <section className="container-page grid gap-6 py-14 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-16 lg:py-20">
        <div>
          <p className="eyebrow">Good to go, all over town</p>
          <h2 className="section-title mt-2.5">
            Wherever Chennai takes <em>you.</em>
          </h2>
        </div>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:gap-2.5">
          {LOCATIONS.map((l) => (
            <li key={l.slug}>
              <Link
                href={`/locations/${l.slug}`}
                className="flex min-h-11 items-center justify-between rounded-md border border-line px-3 text-[13px] font-semibold transition-colors hover:border-brand-500 hover:bg-tint"
                aria-label={`Self drive cars in ${l.name}`}
              >
                {l.name}
                <ArrowUpRight className="size-3.5 text-brand-700" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Monthly / My Orders / FAQ */}
      <section className="container-page grid gap-3 pb-16 md:grid-cols-2 lg:grid-cols-[1fr_1fr_1.25fr] lg:gap-4 lg:pb-24">
        <div className="card-tint p-6">
          <p className="eyebrow">A car for the long run</p>
          <h2 className="mt-3 text-[22px] font-bold leading-tight sm:text-[24px]">
            Make it a <em className="not-italic text-brand-500">monthly.</em>
          </h2>
          <p className="mt-3 text-[13px] leading-relaxed text-[#62716b]">
            Flexible monthly rentals with the same friendly support. Tell us what you need and we&rsquo;ll find your fit.
          </p>
          <Link href="/monthly-plans" className="text-link mt-2">
            See monthly prices <ArrowUpRight className="size-4" aria-hidden />
          </Link>
        </div>
        <div className="card p-6">
          <p className="eyebrow">Picking up where you left off?</p>
          <h2 className="mt-3 text-[22px] font-bold leading-tight sm:text-[24px]">
            Your plans, all in <em className="not-italic text-brand-500">one place.</em>
          </h2>
          <p className="mt-3 text-[13px] leading-relaxed text-[#62716b]">
            Look up a booking with your ticket number or phone number. No account needed.
          </p>
          <Link href="/my-orders" className="btn btn-secondary mt-3 min-h-11 gap-2 px-4 text-[13px]">
            Find my booking <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
        <div className="card p-6 md:col-span-2 lg:col-span-1">
          <p className="eyebrow">A few good answers</p>
          <h2 className="mt-3 text-[22px] font-bold leading-tight sm:text-[24px]">
            Good to <em className="not-italic text-brand-500">know.</em>
          </h2>
          <div className="mt-2">
            {faqs.map((f) => (
              <details key={f.q} className="group border-b border-line">
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 text-[13px] font-bold [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span className="text-lg font-normal text-brand-700 group-open:hidden" aria-hidden>+</span>
                  <span className="hidden text-lg font-normal text-brand-700 group-open:inline" aria-hidden>−</span>
                </summary>
                <p className="pb-3 pr-4 text-[13px] leading-relaxed text-[#62716b]">{f.a}</p>
              </details>
            ))}
          </div>
          <Link href="/faq" className="text-link mt-1">
            More questions answered <ArrowUpRight className="size-4" aria-hidden />
          </Link>
        </div>
      </section>
    </>
  );
}
