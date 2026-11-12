// Seeds starter data: settings, one hub and the cars listed on the old smilecars.net.
// Safe to re-run: existing documents are left alone unless you pass --force.
//   node scripts/seed.mjs
//   node scripts/seed.mjs --force
import { db } from "./firebase-admin.mjs";

const force = process.argv.includes("--force");

async function put(path, data) {
  const ref = db.doc(path);
  if (!force && (await ref.get()).exists) {
    console.log(`skip   ${path} (exists)`);
    return;
  }
  await ref.set({ ...data, createdAt: Date.now(), updatedAt: Date.now() });
  console.log(`write  ${path}`);
}

// Business details from the current website. Deposit and FASTag start at 0: set them in Admin > Settings.
await put("settings/general", {
  businessName: "Smile Cars®",
  address: "No.1076, 44th Street, TVS Colony, Anna Nagar West Extension, Chennai 600101",
  phones: ["+91 99620 97400", "+91 99620 56400", "+91 90925 55444"],
  whatsappNumber: "919962097400",
  email: "bookings@smilecars.net",
  staffAlertNumbers: [],
  depositAmount: 0,
  fastagCharge: 0,
  holdHours: 2,
  includedKmPerDay: 300,
  turnaroundHours: 0,
  ticketPrefix: "SC",
});

await put("hubs/anna-nagar-west", {
  name: "Anna Nagar West",
  area: "TVS Colony, Anna Nagar West Extension",
  deliveryFee: 0,
  active: true,
  sortOrder: 0,
});

// Daily rates from the current website. Weekly/monthly rates, extra-km rates and photos
// are left for the owner to fill in under Admin > Cars.
const cars = [
  ["renault-kwid", "Renault Kwid", "hatchback", "manual", "petrol", 5, 1800],
  ["hyundai-santro-manual", "Hyundai Santro", "hatchback", "manual", "petrol", 5, 1500],
  ["hyundai-santro-automatic", "Hyundai Santro (Automatic)", "hatchback", "automatic", "petrol", 5, 1800],
  ["hyundai-grand-i10-nios-manual", "Hyundai Grand i10 Nios", "hatchback", "manual", "petrol", 5, 2000],
  ["hyundai-grand-i10-nios-automatic", "Hyundai Grand i10 Nios (Automatic)", "hatchback", "automatic", "petrol", 5, 2000],
  ["maruti-alto-k10-manual", "Maruti Alto K10", "hatchback", "manual", "petrol", 5, 1800],
  ["maruti-alto-k10-automatic", "Maruti Alto K10 (Automatic)", "hatchback", "automatic", "petrol", 5, 1800],
];
let order = 0;
for (const [slug, name, bodyType, transmission, fuel, seats, dailyRate] of cars) {
  await put(`cars/${slug}`, {
    slug,
    name,
    bodyType,
    transmission,
    fuel,
    seats,
    dailyRate,
    weeklyRate: null,
    monthlyRate: null,
    includedKmPerDay: null,
    extraKmRate: 0,
    photos: [],
    description: "",
    features: [],
    regNumber: "",
    active: true,
    sortOrder: order++,
  });
}

console.log("\nDone. Next: node scripts/create-owner.mjs <email> <password> \"<name>\"");
process.exit(0);
