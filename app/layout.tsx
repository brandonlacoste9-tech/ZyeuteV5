/**
 * Root Layout - Quebec-First Configuration
 */

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Zyeuté - Le TikTok du Québec",
  description: "Le réseau social fait par le Québec, pour le Québec",
  keywords: ["Québec", "social media", "TikTok", "Montréal", "Joual"],
  authors: [{ name: "Zyeuté Team" }],
  creator: "Zyeuté",
  publisher: "Zyeuté",
  robots: "index, follow",
  openGraph: {
    title: "Zyeuté - Le TikTok du Québec",
    description: "Le réseau social fait par le Québec, pour le Québec",
    url: "https://zyeute.com",
    siteName: "Zyeuté",
    locale: "fr_CA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Zyeuté - Le TikTok du Québec",
    description: "Le réseau social fait par le Québec, pour le Québec",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr-CA" className={inter.variable}>
      <head>
        <meta name="theme-color" content="#003399" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="bg-white text-gray-900 antialiased">
        {/* Quebec Blue accent bar */}
        <div className="h-1 bg-zyeute-blue" />
        <main className="min-h-screen">{children}</main>
        {/* Footer with Quebec branding */}
        <footer className="bg-zyeute-snow border-t border-zyeute-blue/10 py-8">
          <div className="container mx-auto px-4 text-center">
            <p className="text-sm text-gray-600">
              Fait au Québec, pour le Québec 🇨🇦
            </p>
            <p className="text-xs text-gray-500 mt-2">
              © {new Date().getFullYear()} Zyeuté. Tous droits réservés.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
