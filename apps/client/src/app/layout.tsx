import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});
if (
  !process.env.NEXT_PUBLIC_RELAY_URL || 
  !process.env.NEXT_PUBLIC_SUPPORTING_SERVICES_URL ||
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
) {
  const missing = [];
  if (!process.env.NEXT_PUBLIC_RELAY_URL) missing.push("NEXT_PUBLIC_RELAY_URL");
  if (!process.env.NEXT_PUBLIC_SUPPORTING_SERVICES_URL) missing.push("NEXT_PUBLIC_SUPPORTING_SERVICES_URL");
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  throw new Error(`[PitchOS Client] Missing required environment variables: ${missing.join(", ")}. Please configure them in your .env.local file.`);
}


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
