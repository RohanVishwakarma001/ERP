import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { QueryProvider } from "@/components/providers/query-provider";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
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
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-800 font-sans">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
