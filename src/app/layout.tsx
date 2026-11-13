import type { Metadata, Viewport } from "next";
import { DM_Sans, Manrope } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});
const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "Self Drive Cars in Chennai | Smile Cars®",
    template: "%s | Smile Cars®",
  },
  description:
    "Self drive car rental in Chennai with doorstep delivery. Hatchbacks, sedans and SUVs by the day, week or month. Prices include GST.",
  openGraph: { siteName: "Smile Cars®", locale: "en_IN", type: "website" },
};

export const viewport: Viewport = {
  themeColor: "#27ae90",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${dmSans.variable} ${manrope.variable}`}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
