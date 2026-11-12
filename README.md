# Smile Cars — self drive car rental website

Phase 1 website for Smile Cars®, Chennai: online booking with live availability, an admin panel for staff,
WhatsApp notifications and an AI chat assistant.

**Stack:** Next.js 16 (App Router, TypeScript, Tailwind CSS 4) · Firebase (Firestore, Storage, Auth) ·
Vercel · Anthropic API (`claude-haiku-5-5`) · WhatsApp Business Cloud API.

## What's included

| Area | Where |
|---|---|
| Home with booking search | `src/app/(site)/page.tsx` |
| Booking: search → choose car → confirm → success | `src/app/(site)/book/**` |
| Fleet, car detail, monthly plans, FAQ, about, privacy | `src/app/(site)/**` |
| Area pages for local SEO (16 areas, old URLs 301-redirect here) | `/locations/[slug]`, content in `src/content/locations.ts` |
| Attach-your-vehicle enquiry form | `/attach-your-vehicle` |
| My Orders (ticket or phone lookup) | `/my-orders` |
| Admin: bookings, calendar & blocks, cars & photos, hubs, enquiries, settings, discount codes, staff accounts | `/admin` |
| Chat assistant (floating widget → `/api/chat`, server-side tools) | `src/components/chat`, `src/lib/chat/tools.ts` |
| WhatsApp notifications behind one `sendWhatsApp()` switch | `src/lib/whatsapp.ts`, `src/lib/notifications.ts` |

### How bookings work

1. The customer searches (rental type, hub, delivery mode, dates). Only cars free for those times are shown, each with its total price.
2. On submit, the server re-checks availability **inside a Firestore transaction** and creates the booking with status `new`
   and the next ticket number (`SC-0001`, prefix editable). Two people cannot book the same car for overlapping times.
3. A `new` booking holds the car for the hold duration (default 2 hours, editable). When the hold runs out the car is
   automatically free again: availability ignores expired holds, so no background job is needed.
4. Staff call the customer, then press **Confirm** in admin. Confirming after the hold ran out re-checks the car first.
5. Status flow: `new → confirmed → delivered → returned → closed`, or `cancelled` from new/confirmed.

### Pricing (all editable in admin)

- Car: daily rate (GST included), optional weekly (7-day) and monthly (30-day) rates, included km/day, extra-km rate.
- Hub: delivery fee per trip (×2 for "Delivery & pickup"; 0 = free).
- Settings: refundable deposit and FASTag charge (separate lines), default km/day, hold hours, gap between bookings.
- Discount codes: percent or flat off the rent, optional cap, minimum days and validity dates.

Every started 24 hours counts as a rental day. Rules are in `src/lib/pricing.ts` and covered by `npm test`.

## Setup

Requires Node.js 22.18+ (24 recommended).

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev
```

The site runs without Firebase (pages show empty states), but booking and admin need it.

### 1. Firebase project

1. Create a project at console.firebase.google.com (Spark free plan is enough to start; Storage on new projects
   may need the Blaze plan with its free tier).
2. **Firestore:** create a database in production mode, region `asia-south1` (Mumbai).
3. **Storage:** enable it (same region).
4. **Authentication:** enable the **Email/Password** sign-in method. Add your Vercel domain under
   Authentication → Settings → Authorized domains.
5. **Service account:** Project settings → Service accounts → Generate new private key. Base64-encode it into
   `FIREBASE_SERVICE_ACCOUNT_BASE64` (commands in `.env.example`). Never commit the JSON file.
6. **Web app config:** Project settings → General → Add web app, copy the values into the `NEXT_PUBLIC_FIREBASE_*` variables.
7. Deploy rules and indexes (all client access is denied; the server uses the Admin SDK):

   ```bash
   npx firebase-tools login
   npx firebase-tools deploy --only firestore:rules,firestore:indexes,storage --project <project-id>
   ```

   The service-account key cannot deploy (it lacks the Service Usage permission), so either sign in with
   `firebase-tools login` as a project owner, or create the two composite indexes from
   `firebase/firestore.indexes.json` in the console (Firestore → Indexes → Manual), or by opening the link
   in the error the first time a booking query runs.

8. Seed starter data and create the owner login:

   ```bash
   npm run seed
   npm run create-owner -- owner@example.com "a-strong-password" "Owner Name"
   ```

   The seed adds settings, the Anna Nagar West hub and the seven cars from the current website (daily rates only).
   Add photos, weekly/monthly rates and extra-km rates in **Admin → Cars**, and set the deposit and FASTag charge in
   **Admin → Settings**.

### 2. Vercel

1. Import the GitHub repo in Vercel (framework: Next.js).
2. Add every variable from `.env.example` under Settings → Environment Variables. Set `NEXT_PUBLIC_SITE_URL` to the live URL.
3. `vercel.json` runs functions in Mumbai (`bom1`) and schedules the delivery-day reminder at 07:00 IST.
   Set `CRON_SECRET` so only Vercel can call it.
4. Add the Vercel domain (and any custom domain) under Firebase → Authentication → Settings → Authorized domains.

Two Vercel details that are already handled in `package.json`, so don't remove them:

- `engines.node` is `24.x` (Vercel otherwise picks the newest Node it offers).
- `overrides` pins `jose` 5 under `jwks-rsa`. firebase-admin 14 otherwise loads `jose` 6, which is ES-module only,
  through `require()`. Vercel's runtime rejects that (`ERR_REQUIRE_ESM`) and every Firestore page returns 500.

Live: https://smilecars.vercel.app (project `smilecars` under kaleemfairy's Vercel account, Firebase project `smilecars-d0117`).

### 3. AI chat assistant

Create an API key at console.anthropic.com and set `ANTHROPIC_API_KEY` (server only). The assistant uses
`claude-haiku-5-5` with these server-side tools, which call the same code as the website:

| Tool | Purpose |
|---|---|
| `search_available_cars` | Free cars for dates, with totals and booking links |
| `get_price_quote` | Full price breakdown, optionally with a discount code |
| `list_fleet` | Cars and their daily/weekly/monthly rates |
| `list_hubs` | Delivery hubs and fees |
| `get_booking_status` | Status lookup — needs both ticket **and** phone |
| `get_business_info` | Contacts, documents, deposit, km policy |

The bot cannot create or change bookings; it links customers to the booking page. Chat is rate-limited per IP and
messages are capped in length. Set `NEXT_PUBLIC_CHAT_ENABLED=false` to hide the widget.

### 4. WhatsApp templates

Keep `WHATSAPP_ENABLED=false` until Meta business verification is done; messages are only logged until then.
Click-to-chat and call buttons work without any setup.

Create these **Utility** templates in WhatsApp Manager (language `en`, or set `WHATSAPP_TEMPLATE_LANGUAGE`).
Parameters are filled in this order:

| Template | Sent to | Suggested body |
|---|---|---|
| `staff_new_booking` | Numbers in Settings → "New-booking WhatsApp alerts" | New booking {{1}}: {{2}}, {{3}}. Customer: {{4}}. Total {{5}}. Open: {{6}} |
| `booking_received` | Customer, on submit | Hi {{1}}, we received your booking {{2}} for {{3}} ({{4}}). We are holding the car for {{5}} hours and will call you to confirm. |
| `booking_confirmed` | Customer, when staff confirm | Hi {{1}}, your booking {{2}} for {{3}} ({{4}}) is confirmed. Total {{5}}. See you on delivery day! |
| `delivery_day` | Customer, 07:00 IST on pickup day | Hi {{1}}, your {{3}} (booking {{2}}) will be delivered today at {{4}}. Questions? Call {{5}}. |

Then set `WHATSAPP_TOKEN` (a permanent System User token), `WHATSAPP_PHONE_NUMBER_ID` and `WHATSAPP_ENABLED=true`.

### 5. Email alerts, Zoho CRM, Google Analytics and Search Console

These replace what the old smilecars.net did. Each is off until its env vars are set.

| Feature | What it does | To switch on |
|---|---|---|
| Email alerts (`src/lib/email.ts`) | Emails every new booking (with an "Open in admin" button) and every vehicle-owner enquiry to the addresses in **Admin → Settings** (default: bookings@smilecars.net, rentacarbooking@yahoo.com) | Create a free Resend account, verify `smilecars.net` (adds DNS records at GoDaddy), set `RESEND_API_KEY`, `EMAIL_FROM` and `EMAIL_ENABLED=true` |
| Zoho CRM (`src/lib/zoho.ts`) | Adds each booking's customer to Zoho as a lead, through the same Web-to-Lead form the old home page used | Set `ZOHO_ENABLED=true` (form tokens are in `.env.example`) |
| Google Analytics 4 + Ads (`src/components/site/GoogleTags.tsx`) | Page views; `generate_lead` on each completed booking; `click_call` / `click_whatsapp` plus the old "Outbound click" Ads conversion on call and WhatsApp taps | Set the `NEXT_PUBLIC_GA_*` / `NEXT_PUBLIC_GOOGLE_ADS_*` vars. Tags load only on `NEXT_PUBLIC_TRACKING_HOSTS` (smilecars.net), so vercel.app and localhost traffic never reach the reports |
| Search Console | `public/googled26e4fb58ad6bd30.html` keeps the existing domain verification when the domain moves to Vercel | Nothing |

The old site's Ads tag fired the "Outbound click" conversion on every home page load; the new site fires it only on real
call and WhatsApp taps, so expect conversion numbers to drop to their true level. For bookings, create a separate
"Booking submitted" conversion in Google Ads and put its label in `NEXT_PUBLIC_GOOGLE_ADS_BOOKING_LABEL`.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `npm test` | Pricing and availability unit tests (Node test runner) |
| `npm run seed` | Starter data (`-- --force` overwrites) |
| `npm run create-owner` | Create or reset an owner login |

## Before launch

- Replace the text logo (`src/components/site/Logo.tsx`) with the client's logo, and upload real car photos.
- Review the privacy policy (`src/app/(site)/privacy/page.tsx`) with the client.
- Confirm business rules with the client: deposit amount, FASTag charge, hub list and fees, advance payment wording.
- Blog posts on the old site redirect to the home page; recreate any that bring meaningful search traffic.
