import type { Metadata } from "next";
import localFont from "next/font/local";
import { QueryProvider } from "@/components/providers/query-provider";
import "./globals.css";

// Self-hosted (not next/font/google): the institutional design system pins
// specific Inter/Plus Jakarta Sans weights, and fetching those from Google at
// build time makes the build fail-slow or fall back silently on any network
// restriction (corporate proxy, air-gapped CI, transient outage). These are
// the same variable-font files Google serves, just bundled locally instead.
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
  title: "JBIT Dehradun — Campus ERP Ecosystem",
  description: "Enterprise Academic & Institutional Operating System for JB Institute of Technology, Dehradun (Affiliated to UTU / SDSUV / UBTER).",
  icons: {
    icon: "/assets/jbit-logo.svg",
    shortcut: "/assets/jbit-logo.svg",
    apple: "/assets/jbit-logo.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${inter.variable} antialiased`}>
      <body className="min-h-screen bg-slate-50 text-slate-800 font-sans">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
