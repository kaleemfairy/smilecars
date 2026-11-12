// Imports the fleet listed on the old smilecars.net (assets/const/car-list.js, 31 models)
// with its daily rates, the ₹12/km extra rate and the old site's photos (public/cars/*.webp).
//
// Safe to re-run. Existing cars keep their number of cars, weekly/monthly rates,
// registration number and any photos uploaded in admin.
//   node scripts/import-fleet.mjs
import { db } from "./firebase-admin.mjs";

// [slug, name, bodyType, transmission, fuel, seats, dailyRate, photo]
const FLEET = [
  // Small hatchbacks
  ["maruti-alto-k10-manual", "Maruti Alto K10", "hatchback", "manual", "petrol", 5, 1800, "maruti-alto-k10"],
  ["maruti-alto-k10-automatic", "Maruti Alto K10 (Automatic)", "hatchback", "automatic", "petrol", 5, 1800, "maruti-alto-k10"],
  ["hyundai-santro-manual", "Hyundai Santro", "hatchback", "manual", "petrol", 5, 1500, "hyundai-santro-manual"],
  ["hyundai-santro-automatic", "Hyundai Santro (Automatic)", "hatchback", "automatic", "petrol", 5, 1800, "hyundai-santro-automatic"],
  ["renault-kwid", "Renault Kwid", "hatchback", "manual", "petrol", 5, 1800, "renault-kwid"],
  ["hyundai-grand-i10-nios-manual", "Hyundai Grand i10 Nios", "hatchback", "manual", "petrol", 5, 2000, "hyundai-grand-i10-nios"],
  ["hyundai-grand-i10-nios-automatic", "Hyundai Grand i10 Nios (Automatic)", "hatchback", "automatic", "petrol", 5, 2000, "hyundai-grand-i10-nios"],
  // Big hatchbacks
  ["maruti-swift-manual", "Maruti Swift", "hatchback", "manual", "petrol", 5, 2200, "maruti-swift"],
  ["maruti-swift-automatic", "Maruti Swift (Automatic)", "hatchback", "automatic", "petrol", 5, 2200, "maruti-swift"],
  ["toyota-glanza", "Toyota Glanza", "hatchback", "manual", "petrol", 5, 2200, "toyota-glanza"],
  ["maruti-baleno-manual", "Maruti Baleno", "hatchback", "manual", "petrol", 5, 2200, "maruti-baleno-manual"],
  ["maruti-baleno-automatic", "Maruti Baleno (Automatic)", "hatchback", "automatic", "petrol", 5, 2200, "maruti-baleno-automatic"],
  // Sedans (the old site listed the manual Dzire under "Big Hatch")
  ["maruti-dzire-manual", "Maruti Dzire", "sedan", "manual", "petrol", 5, 2500, "maruti-dzire"],
  ["maruti-dzire-automatic", "Maruti Dzire (Automatic)", "sedan", "automatic", "petrol", 5, 2200, "maruti-dzire"],
  ["honda-amaze", "Honda Amaze", "sedan", "automatic", "petrol", 5, 2500, "honda-amaze"],
  // 5-seater SUVs
  ["toyota-urban-cruiser-taisor", "Toyota Urban Cruiser Taisor", "suv", "manual", "petrol", 5, 2500, "toyota-urban-cruiser-taisor"],
  ["maruti-fronx", "Maruti Fronx", "suv", "manual", "petrol", 5, 2500, "maruti-fronx"],
  ["hyundai-venue", "Hyundai Venue", "suv", "manual", "petrol", 5, 2500, "hyundai-venue"],
  ["nissan-magnite", "Nissan Magnite", "suv", "automatic", "petrol", 5, 3000, "nissan-magnite"],
  ["skoda-kushaq", "Skoda Kushaq", "suv", "manual", "petrol", 5, 2500, "skoda-kushaq"],
  ["kia-sonet", "Kia Sonet", "suv", "automatic", "petrol", 5, 3000, "kia-sonet"],
  ["maruti-brezza", "Maruti Brezza", "suv", "automatic", "petrol", 5, 3000, "maruti-brezza"],
  // 7-seaters
  ["renault-triber", "Renault Triber", "muv", "automatic", "petrol", 7, 3000, "renault-triber"],
  ["toyota-rumion", "Toyota Rumion", "muv", "manual", "petrol", 7, 3500, "toyota-rumion"],
  ["kia-carens", "Kia Carens", "muv", "manual", "petrol", 7, 3500, "kia-carens"],
  // Premium SUVs
  ["hyundai-creta", "Hyundai Creta", "luxury", "automatic", "petrol", 5, 3000, "hyundai-creta"],
  ["kia-seltos", "Kia Seltos", "luxury", "automatic", "petrol", 5, 4000, "kia-seltos"],
  ["jeep-compass", "Jeep Compass", "luxury", "automatic", "petrol", 5, 5000, "jeep-compass"],
  ["mg-hector-plus", "MG Hector Plus", "luxury", "automatic", "petrol", 7, 5000, "mg-hector-plus"],
  // 8-seaters
  ["toyota-innova-crysta", "Toyota Innova Crysta", "muv", "manual", "diesel", 8, 4500, "toyota-innova-crysta"],
  ["toyota-innova-hycross", "Toyota Innova Hycross", "muv", "automatic", "petrol", 8, 6000, "toyota-innova-hycross"],
];

let created = 0;
let updated = 0;
for (const [i, [slug, name, bodyType, transmission, fuel, seats, dailyRate, photo]] of FLEET.entries()) {
  const ref = db.doc(`cars/${slug}`);
  const snap = await ref.get();
  const cur = snap.data() ?? {};
  const doc = {
    slug,
    name,
    bodyType,
    transmission,
    fuel,
    seats,
    dailyRate,
    extraKmRate: cur.extraKmRate || 12,
    sortOrder: i,
    active: cur.active ?? true,
    updatedAt: Date.now(),
  };
  if (!snap.exists) {
    await ref.set({
      ...doc,
      units: 1,
      weeklyRate: null,
      monthlyRate: null,
      includedKmPerDay: null,
      photos: [`/cars/${photo}.webp`],
      description: "",
      features: [],
      regNumber: "",
      createdAt: Date.now(),
    });
    created++;
  } else {
    const photos = Array.isArray(cur.photos) && cur.photos.length ? cur.photos : [`/cars/${photo}.webp`];
    await ref.set({ ...doc, photos, units: cur.units ?? 1 }, { merge: true });
    updated++;
  }
}
console.log(`Fleet import done: ${created} added, ${updated} updated (${FLEET.length} models).`);
console.log("Set how many cars of each model the business has in Admin > Cars > Number of cars.");
process.exit(0);
