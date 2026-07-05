import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});



export const metadata: Metadata = {
  title: "PitchOS — Decentralized Football OS",
  description: "Offline-first, P2P operating system for grassroots football clubs. Manage rosters, tournaments, live scoring, and prediction pools without a central database.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
