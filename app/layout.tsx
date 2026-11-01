import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n/i18n-provider";
import { Suspense } from "react";
import { RatingWidget } from "@/features/feedback/components/rating-widget";
import { SiteBanner, SiteSettingsProvider } from "./_components/site-settings";
import { SiteHeader } from "./_components/site-header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SmartTrip",
  description: "Personalized trip plans that save you money and time.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <I18nProvider>
          <SiteSettingsProvider>
            <SiteHeader />
            <SiteBanner />
            {children}
            <Suspense>
              <RatingWidget />
            </Suspense>
          </SiteSettingsProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
