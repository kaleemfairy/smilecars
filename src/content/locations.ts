// Area landing pages for local search (/locations/[slug]).
// Slugs match the old smilecars.net pages, which redirect here.
// Edit the text freely; keep each intro unique so search engines don't treat pages as duplicates.

export interface Location {
  slug: string;
  name: string;
  intro: string;
  nearby: string[];
  /** Hub id to pre-select in the search form, if this area has its own hub. */
  hubId?: string;
}

export const LOCATIONS: Location[] = [
  {
    slug: "anna-nagar",
    name: "Anna Nagar",
    intro:
      "Our office is in Anna Nagar West Extension, so Anna Nagar customers get some of our quickest handovers. Book online and we deliver the car to your home, office or apartment gate.",
    nearby: ["Anna Nagar West", "Anna Nagar East", "Thirumangalam", "Shanthi Colony", "Tower Park"],
  },
  {
    slug: "mogappair",
    name: "Mogappair",
    intro:
      "Mogappair is right next to our Anna Nagar West base. Rent a hatchback for the week's errands or an SUV for a family trip, delivered to your doorstep in Mogappair East or West.",
    nearby: ["Mogappair East", "Mogappair West", "Nolambur", "Golden George Nagar"],
  },
  {
    slug: "koyambedu",
    name: "Koyambedu",
    intro:
      "Arriving at the Koyambedu bus terminus or heading out on the bypass? Book a self-drive car for pickup in the Koyambedu area and start your trip without waiting for a cab.",
    nearby: ["CMBT", "Koyambedu Market", "Virugambakkam", "Nerkundram"],
  },
  {
    slug: "arumbakkam",
    name: "Arumbakkam",
    intro:
      "Self-drive cars for Arumbakkam residents, with delivery to your street on 100 Feet Road, MMDA Colony or near the metro station.",
    nearby: ["MMDA Colony", "Arumbakkam Metro", "Choolaimedu", "Aminjikarai"],
  },
  {
    slug: "ambattur",
    name: "Ambattur",
    intro:
      "From the Ambattur Industrial Estate to Avadi Road, rent a car for work commutes or weekend drives and have it delivered to you in Ambattur.",
    nearby: ["Ambattur Industrial Estate", "Ambattur OT", "Pattaravakkam", "Mannurpet"],
  },
  {
    slug: "vadapalani",
    name: "Vadapalani",
    hubId: "choolaimedu",
    intro:
      "Need a car near Vadapalani? We deliver to homes and offices around the temple, the Forum mall and Arcot Road, for a day, a week or a month.",
    nearby: ["Arcot Road", "Ashok Nagar", "K.K. Nagar", "Saligramam"],
  },
  {
    slug: "t-nagar",
    name: "T. Nagar",
    hubId: "choolaimedu",
    intro:
      "Skip the parking-lot taxi queues in T. Nagar. Rent a self-drive car for shopping days, family functions or trips out of the city, delivered in T. Nagar.",
    nearby: ["Pondy Bazaar", "Panagal Park", "Mambalam", "Kodambakkam"],
  },
  {
    slug: "nungambakkam",
    name: "Nungambakkam",
    hubId: "choolaimedu",
    intro:
      "Self-drive car rental for Nungambakkam and the city centre, ideal for business visitors and residents who want their own car without owning one.",
    nearby: ["Khader Nawaz Khan Road", "Sterling Road", "Valluvar Kottam", "Thousand Lights"],
  },
  {
    slug: "guindy",
    name: "Guindy",
    hubId: "choolaimedu",
    intro:
      "Rent a car in Guindy for airport runs, office commutes in the industrial estate or a drive down GST Road, with delivery to your doorstep.",
    nearby: ["Guindy Industrial Estate", "Kathipara", "Ekkatuthangal", "Saidapet"],
  },
  {
    slug: "adyar",
    name: "Adyar",
    intro:
      "Self-drive cars in Adyar for beach drives, ECR getaways and everyday errands. We deliver across Adyar, Besant Nagar and Kotturpuram.",
    nearby: ["Besant Nagar", "Kotturpuram", "Gandhi Nagar", "Indira Nagar"],
  },
  {
    slug: "thiruvanmiyur",
    name: "Thiruvanmiyur",
    intro:
      "Thiruvanmiyur sits where ECR and OMR begin, so it's a natural starting point for weekend trips. Rent a car and have it waiting at your door.",
    nearby: ["Kalakshetra Colony", "Valmiki Nagar", "Palavakkam", "Kottivakkam"],
  },
  {
    slug: "velachery",
    name: "Velachery",
    intro:
      "Rent a self-drive car in Velachery for the commute to OMR, a mall run or a weekend out of town, delivered near the MRTS station or to your home.",
    nearby: ["Velachery MRTS", "Vijayanagar", "Taramani", "Madipakkam"],
  },
  {
    slug: "omr",
    name: "OMR",
    intro:
      "For IT professionals and families along Old Mahabalipuram Road, rent a car by the day, week or month, with delivery from Perungudi to Sholinganallur and beyond.",
    nearby: ["Perungudi", "Thoraipakkam", "Sholinganallur", "Navalur"],
  },
  {
    slug: "ecr",
    name: "ECR",
    intro:
      "Plan a drive down East Coast Road to Mahabalipuram or Puducherry. Rent a comfortable self-drive car and we'll deliver it to you along ECR.",
    nearby: ["Neelankarai", "Injambakkam", "Uthandi", "Muttukadu"],
  },
  {
    slug: "porur",
    name: "Porur",
    intro:
      "Self-drive car rental for Porur, Valasaravakkam and Mount-Poonamallee Road, handy for office commutes and trips toward Bengaluru Highway.",
    nearby: ["Valasaravakkam", "Ramapuram", "Iyyappanthangal", "Mugalivakkam"],
  },
  {
    slug: "tambaram",
    name: "Tambaram",
    intro:
      "Rent a car in Tambaram for trips down GST Road, family visits or the daily drive into the city, delivered to your home in Tambaram or Chromepet.",
    nearby: ["Chromepet", "Selaiyur", "Perungalathur", "Pallavaram"],
  },
];

export function getLocation(slug: string): Location | undefined {
  return LOCATIONS.find((l) => l.slug === slug);
}
