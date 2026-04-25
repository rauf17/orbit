import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "cal-sans";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Orbit — World Timezone Planner",
  description: "Visualize time zones, find meeting overlaps, and sync with your global team. Free and instant.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
