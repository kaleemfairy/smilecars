import Link from "next/link";
import { getActiveCars, getActiveHubs, getPublicSettings } from "@/lib/data";
import { safe } from "@/lib/safe";
import { inr, LABELS } from "@/lib/format";
import { searchDefaults } from "@/lib/search-defaults";
import { SearchForm } from "@/components/booking/SearchForm";
import { LOCATIONS } from "@/content/locations";
import { GOOGLE_RATING, PARTNERS_LINE, TESTIMONIALS } from "@/content/testimonials";
import { BODY_TYPES, type BodyType, type Car } from "@/lib/types";

export const dynamic = "force-dynamic";

// Real photographs of Smile Cars' own fleet, taken on the streets around the TVS Colony office.
const HERO_PHOTOS = [
  { src: "/photos/hero-fronx.webp", alt: "A red Maruti Fronx from the Smile Cars fleet on a leafy street in Anna Nagar" },
  { src: "/photos/hero-crysta.webp", alt: "A white Toyota Innova Crysta from the Smile Cars fleet" },
  { src: "/photos/hero-hycross.webp", alt: "A blue Toyota Innova Hycross from the Smile Cars fleet" },
  { src: "/photos/hero-brezza.webp", alt: "A grey Maruti Brezza from the Smile Cars fleet" },
];

const FLEET_PHOTOS: Record<BodyType, string> = {
  hatchback: "/photos/fleet-hatchback.webp",
  sedan: "/photos/fleet-sedan.webp",
  suv: "/photos/fleet-suv.webp",
  muv: "/photos/fleet-seven.webp",
  luxury: "/photos/fleet-premium.webp",
};

const FLEET_TITLES: Record<BodyType, string> = {
  hatchback: "Hatchbacks",
  sedan: "Sedans",
  suv: "Compact SUVs",
  muv: "7 and 8 seaters",
  luxury: "Premium SUVs",
};

/** One line per model: manual and automatic variants of the same car are merged. */
function modelLines(cars: Car[]) {
  const byModel = new Map<string, Car[]>();
  for (const c of cars) {
    const base = c.name.replace(/\s*\(Automatic\)\s*$/i, "");
    byModel.set(base, [...(byModel.get(base) ?? []), c]);
  }
  return [...byModel.entries()]
    .map(([name, variants]) => ({
      name,
      slug: variants[0].slug,
      from: Math.min(...variants.map((v) => v.dailyRate)),
      gearbox: [...new Set(variants.map((v) => LABELS.transmission[v.transmission].toLowerCase()))].join(" or "),
    }))
    .sort((a, b) => a.from - b.from);
}

export default async function HomePage() {
  const [hubs, cars, settings] = await Promise.all([
    safe(getActiveHubs, [], "hubs"),
    safe(getActiveCars, [], "cars"),
    getPublicSettings(),
  ]);
  const { defaults, minDate } = searchDefaults(hubs);

  const groups = BODY_TYPES.map((type) => {
    const inType = cars.filter((c) => c.bodyType === type && c.dailyRate > 0);
    return { type, lines: modelLines(inType), from: inType.length ? Math.min(...inType.map((c) => c.dailyRate)) : 0 };
  }).filter((g) => g.lines.length > 0);

  const letter = TESTIMONIALS[0];
  const [opening, ...rest] = letter.text.split(/(?<=\.)\s+/);
  const advanceText =
    settings.advanceDays > 0 ? (settings.advanceDays === 1 ? "one day's rent" : `${settings.advanceDays} days' rent`) : "";

  return (
    <>
      {/* 1. Split stage: the booking card beside a large photograph of our own cars. */}
      <section className="px-3 pt-3 lg:grid lg:grid-cols-2 lg:gap-3" aria-labelledby="hero-title">
        <div className="relative h-[48svh] overflow-hidden rounded-2xl bg-brand-900 lg:sticky lg:top-[76px] lg:order-2 lg:h-[calc(100svh-88px)]">
          <div className="crossfade absolute inset-0">
            {HERO_PHOTOS.map((p, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={p.src}
                src={p.src}
                alt={i === 0 ? p.alt : ""}
                aria-hidden={i === 0 ? undefined : true}
                width={900}
                height={1200}
                loading={i === 0 ? "eager" : "lazy"}
                fetchPriority={i === 0 ? "high" : "auto"}
                className="absolute inset-0 size-full object-cover"
              />
            ))}
          </div>
        </div>

        <div className="relative z-10 -mt-6 rounded-2xl bg-white px-5 pb-8 pt-7 sm:px-8 lg:order-1 lg:mt-0 lg:flex lg:min-h-[calc(100svh-88px)] lg:flex-col lg:justify-center lg:py-12 lg:pr-14 lg:pl-[max(3.5rem,calc((100vw-1200px)/2+1.75rem))]">
          <h1 id="hero-title" className="max-w-[15ch] text-[2.5rem] font-extrabold leading-[1.02] tracking-[-0.03em] sm:text-6xl xl:text-7xl">
            Self drive cars, at your door
          </h1>
          <p className="mt-6 max-w-[42ch] text-lg leading-relaxed">
            Hatchbacks, sedans and SUVs across Chennai by the day, week or month. See which cars are free and the full
            price before you book.
          </p>
          <p className="mt-3 text-[0.9375rem] font-semibold text-brand-800">
            {GOOGLE_RATING.stars} on Google from {GOOGLE_RATING.reviews} reviews · 29 years in Anna Nagar
          </p>
          <div className="mt-8 rounded-2xl bg-brand-50 p-4 sm:p-6" id="book">
            <h2 className="mb-4 text-xl font-extrabold">Find a car for your dates</h2>
            <SearchForm hubs={hubs} defaults={defaults} minDate={minDate} />
          </div>
        </div>
      </section>

      {/* 2. How it works, printed as a booking slip. */}
      <section className="mt-24 bg-brand-900 py-20 text-white lg:mt-32 lg:py-28" aria-labelledby="how-title">
        <div className="container-page grid gap-10 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-5">
            <h2 id="how-title" className="reveal text-4xl font-extrabold leading-[1.05] tracking-[-0.02em] sm:text-5xl">
              From search to your doorstep
            </h2>
            <p className="reveal mt-6 max-w-[34ch] text-lg leading-relaxed text-white/90">
              No login and no online payment. You pick the car, we call you, and the car comes to you.
            </p>
          </div>
          <div className="reveal slip w-full max-w-[480px] bg-white px-6 pb-12 pt-7 text-ink lg:col-span-6 lg:col-start-7">
            <SlipGroup title="Online, now">
              <SlipRow left="Choose dates and delivery hub" right="1 min" />
              <SlipRow left="Pick a car that is free" right="live price" />
            </SlipGroup>
            <SlipGroup title={`Within ${settings.holdHours} hours`}>
              <SlipRow left="Car held for you" right={`${settings.holdHours} hours`} />
              <SlipRow left="We call to confirm your details" right="by phone" />
              {advanceText && <SlipRow left={`Pay ${advanceText} in advance`} right="GPay, PhonePe" />}
            </SlipGroup>
            <SlipGroup title="On your pickup day">
              <SlipRow left="Car delivered to your address" right="on time" />
              {advanceText && <SlipRow left="Balance paid at delivery" right="cash or UPI" />}
            </SlipGroup>
            <p className="mt-7 flex min-h-11 items-center justify-between bg-brand-900 px-4 text-[0.9375rem] font-bold text-white">
              <span>Keys in your hand</span>
              <span className="tabular-nums">{settings.includedKmPerDay} km a day included</span>
            </p>
          </div>
        </div>
      </section>

      {/* 3. The fleet: a pinned heading on a field of brand green, real cars passing beside it. */}
      {groups.length > 0 && (
        <section className="bg-brand-500 py-20 text-brand-ink lg:py-28" aria-labelledby="fleet-title">
          <div className="container-page lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="sticky top-16 z-10 -mx-4 bg-brand-500 px-4 py-3 lg:col-span-5 lg:mx-0 lg:self-start lg:bg-transparent lg:p-0 lg:top-28">
              <h2 id="fleet-title" className="text-[9vw] font-extrabold leading-[0.95] tracking-[-0.035em] lg:text-[clamp(3.5rem,6.6vw,6.5rem)]">
                Our fleet
              </h2>
              <p className="mt-5 hidden max-w-[24ch] text-lg font-semibold lg:block">
                {cars.length} models from {inr(Math.min(...groups.map((g) => g.from)))} a day, GST included.
              </p>
            </div>
            <div className="mt-8 space-y-[4.5rem] lg:col-span-7 lg:mt-0 lg:space-y-28">
              {groups.map((g, i) => (
                <article key={g.type} className="reveal">
                  <h3 className="text-[1.75rem] font-extrabold leading-tight">
                    {FLEET_TITLES[g.type]} <span className="font-semibold">from {inr(g.from)} a day</span>
                  </h3>
                  <div className={`mt-5 flex flex-col gap-5 sm:flex-row sm:items-start ${i % 2 ? "sm:flex-row-reverse" : ""}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={FLEET_PHOTOS[g.type]}
                      alt={`${FLEET_TITLES[g.type]} from the Smile Cars fleet`}
                      width={600}
                      height={800}
                      loading="lazy"
                      className="aspect-[4/3] w-full object-cover sm:aspect-[3/4] sm:w-[13rem] sm:shrink-0"
                    />
                    <ul className="flex-1 space-y-3.5 text-[1.0625rem]">
                      {g.lines.slice(0, 6).map((l) => (
                        <li key={l.name}>
                          <Link href={`/cars/${l.slug}`} className="group flex items-baseline justify-between gap-3">
                            <span className="font-bold underline-offset-4 group-hover:underline">{l.name}</span>
                            <span className="shrink-0 tabular-nums">{inr(l.from)}</span>
                          </Link>
                          <span className="text-[0.9375rem]">{l.gearbox}</span>
                        </li>
                      ))}
                      {g.lines.length > 6 && (
                        <li>
                          <Link href={`/cars?body=${g.type}`} className="font-bold underline underline-offset-4">
                            {g.lines.length - 6} more
                          </Link>
                        </li>
                      )}
                    </ul>
                  </div>
                </article>
              ))}
              <Link href="/book" className="btn btn-teal">Check which are free for your dates</Link>
            </div>
          </div>
        </section>
      )}

      {/* 4. Figures, stated quietly. */}
      <section className="container-page py-24 lg:py-36" aria-labelledby="figures-title">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-7 lg:col-start-2">
            <h2 id="figures-title" className="reveal pl-[6.5rem] text-2xl font-extrabold sm:pl-[9.75rem]">
              Why Chennai drives with us
            </h2>
            <dl className="mt-10 space-y-7">
              {[
                ["29", "years renting cars from Anna Nagar, with a branch in Choolaimedu."],
                ["2 lakh+", "customers, from week-long family trips to a car for the airport run."],
                ["200+", "cars, every one cleaned and checked before it is handed over."],
                [GOOGLE_RATING.stars, `stars on Google from ${GOOGLE_RATING.reviews} reviews.`],
                ["24/7", "support during your trip, with a replacement car if something goes wrong."],
              ].map(([figure, sentence]) => (
                <div key={figure} className="reveal grid grid-cols-[5.5rem_1fr] items-baseline gap-4 sm:grid-cols-[8.25rem_1fr] sm:gap-6">
                  <dt className="text-right text-2xl font-extrabold tabular-nums text-brand-800 sm:text-[2rem]">{figure}</dt>
                  <dd className="max-w-[40ch] text-[1.0625rem] leading-relaxed">{sentence}</dd>
                </div>
              ))}
            </dl>
            <p className="reveal mt-10 pl-[6.5rem] text-[1.0625rem] font-semibold sm:pl-[9.75rem]">{PARTNERS_LINE}.</p>
          </div>
          <div className="mt-12 lg:col-span-3 lg:col-start-10 lg:mt-20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/photos/stats-kiger.webp"
              alt="An orange Renault Kiger from the Smile Cars fleet"
              width={640}
              height={640}
              loading="lazy"
              className="reveal ml-auto aspect-square w-[56%] object-cover lg:w-full"
            />
          </div>
        </div>
      </section>

      {/* 5. One customer's words, set as a letter. */}
      <section className="bg-white py-24 lg:py-36" aria-labelledby="letter-title">
        <div className="container-page lg:grid lg:grid-cols-12 lg:gap-8">
          <h2 id="letter-title" className="reveal text-2xl font-extrabold lg:col-span-3">
            From a customer
          </h2>
          <div className="mt-8 max-w-[38ch] lg:col-span-6 lg:col-start-5 lg:mt-0">
            <p className="reveal text-[1.75rem] font-bold leading-snug sm:text-[2rem]">{opening}</p>
            {rest.length > 0 && <p className="reveal mt-6 text-lg leading-relaxed">{rest.join(" ")}</p>}
            <p className="reveal mt-10 text-base font-bold">{letter.name}</p>
            <p className="text-base">Booked from the UK, picked up at Chennai airport</p>
            <Link href="/about#reviews" className="mt-6 inline-block font-bold text-brand-800 underline underline-offset-4">
              More reviews
            </Link>
          </div>
        </div>
      </section>

      {/* 6. Areas we deliver to. */}
      <section className="container-page py-24 lg:py-32" aria-labelledby="areas-title">
        <h2 id="areas-title" className="reveal text-3xl font-extrabold tracking-[-0.02em] sm:text-4xl">
          Delivered across Chennai
        </h2>
        <ul className="reveal mt-8 grid grid-cols-2 gap-x-6 gap-y-3 text-[1.0625rem] sm:grid-cols-3 lg:grid-cols-4">
          {LOCATIONS.map((l) => (
            <li key={l.slug}>
              <Link href={`/locations/${l.slug}`} className="font-semibold text-brand-800 underline-offset-4 hover:underline">
                {l.name}
              </Link>
            </li>
          ))}
        </ul>
        <p className="reveal mt-10 text-[1.0625rem]">
          Own a car you rarely drive?{" "}
          <Link href="/attach-your-vehicle" className="font-bold text-brand-800 underline underline-offset-4">
            Attach it with Smile Cars and earn from it
          </Link>
          .
        </p>
      </section>

      {/* 7. Closing photograph: monthly plans. */}
      <section className="relative overflow-hidden bg-brand-900" aria-labelledby="monthly-title">
        <div className="relative h-[70svh] overflow-hidden lg:h-[90svh]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/photos/cta-swift.webp"
            alt="A grey Maruti Swift from the Smile Cars fleet parked on a quiet street"
            width={1600}
            height={1200}
            loading="lazy"
            className="drift absolute inset-0 size-full object-cover object-left brightness-[0.8]"
          />
        </div>
        <div className="px-4 py-12 text-white lg:absolute lg:inset-y-0 lg:right-0 lg:flex lg:w-1/2 lg:flex-col lg:justify-end lg:px-14 lg:pb-[12svh]">
          <h2 id="monthly-title" className="text-[1.75rem] font-extrabold leading-tight lg:text-[3.4vw]">
            A car for the whole month
          </h2>
          <p className="mt-4 max-w-[40ch] text-lg leading-relaxed">
            Lower monthly rates, delivered to your door, with servicing taken care of. Ideal for a project, a long
            visit or between cars.
          </p>
          <Link href="/monthly-plans" className="btn btn-paper mt-7 w-full sm:w-auto">
            See monthly plans
          </Link>
        </div>
      </section>
    </>
  );
}

function SlipGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-7 first:mt-0">
      <h3 className="text-base font-extrabold">{title}</h3>
      <ul className="mt-3 space-y-2.5">{children}</ul>
    </div>
  );
}

function SlipRow({ left, right }: { left: string; right: string }) {
  return (
    <li className="flex items-baseline text-base">
      <span>{left}</span>
      <span className="leader" aria-hidden />
      <span className="shrink-0 tabular-nums text-muted">{right}</span>
    </li>
  );
}
