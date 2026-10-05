import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

// Adresse für Vorschaubilder: auf Vercel immer die eigene Domain, lokal localhost.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL ? "https://portal.bkstechnologies.de" : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Projektportal (Demo)", template: "%s · Projektportal (Demo)" },
  description: "Kundenportal für Projekte: Aufgaben, Dateiübergabe, Freigaben und Synchronisationsverlauf. Demo von BKS Technologies mit erfundenen Daten.",
  openGraph: { type: "website", locale: "de_DE", siteName: "Projektportal (Demo)" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="de" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
