import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "cal-sans";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

import { ThemeProvider } from "../components/ThemeProvider";
import SolarGradientEngine from "../components/SolarGradientEngine";
import { ToastProvider } from "../components/ToastProvider";

export const metadata: Metadata = {
  title: "Orbit — World Timezone Planner",
  description: "Visualize time zones, find meeting overlaps, and sync with your global team. Free and instant.",
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              var stored = localStorage.getItem('orbit-theme');
              var system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
              var theme = stored || system;
              document.documentElement.setAttribute('data-theme', theme);
            } catch(e) {}
          })();
        `}} />
      </head>
      <body className="antialiased">
        {/* Background layer */}
        <SolarGradientEngine />
        <ThemeProvider>
          <ToastProvider>
            {/* Content wrapper transparent so backgrounds show through */}
            <div style={{ position: 'relative', zIndex: 1 }}>
              {children}
            </div>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
