import type { Metadata } from "next";
import localFont from "next/font/local";
import { AppProviders } from "@/components/providers/app-providers";
import "./globals.css";

// Self-hosted (not next/font/google) so builds don't depend on reaching Google's
// font CDN — corporate proxies, air-gapped CI or an outage would otherwise fail
// the build or silently fall back. Same variable-font files Google serves.
const plusJakarta = localFont({
  src: "../assets/fonts/PlusJakartaSans-Variable.woff2",
  variable: "--font-heading",
  weight: "500 800",
  display: "swap",
});

const inter = localFont({
  src: "../assets/fonts/Inter-Variable.woff2",
  variable: "--font-sans",
  weight: "400 700",
  display: "swap",
});

export const metadata: Metadata = {
  title: "JBIT Dehradun — Campus ERP",
  description: "Academic and institutional management for JB Institute of Technology, Dehradun.",
  icons: { icon: "/assets/jbit-logo.svg", shortcut: "/assets/jbit-logo.svg", apple: "/assets/jbit-logo.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${inter.variable} antialiased`}>
      <body className="min-h-screen bg-surface-canvas text-slate-800 font-sans">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
