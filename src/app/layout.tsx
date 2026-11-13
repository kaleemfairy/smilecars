import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
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
    <html lang="en-IN" className={jakarta.variable}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
