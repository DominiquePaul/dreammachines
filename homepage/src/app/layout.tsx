import type { Metadata } from "next";
import { Analytics } from '@vercel/analytics/react';
import FooterImprintLink from '@/components/FooterImprintLink';
import { DM_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

// Google Font - DM Mono
const dmMono = DM_Mono({
  weight: ["300", "400", "500"],
  subsets: ["latin"],
  variable: "--font-dm-mono",
});

// Local Font - Hasklig
const hasklig = localFont({
  src: [
    {
      path: "./fonts/Hasklig-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/Hasklig-Bold.otf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-hasklig",
});

// Local Font - Season Collection Variable Font
const seasonCollective = localFont({
  src: "./fonts/SeasonCollectionTrial.ttf",
  variable: "--font-season-collective",
});

export const metadata: Metadata = {
  title: "Dream Machines - AI-Powered Robotic Arms for European SMEs",
  description: "Dream Machines lets non-roboticists automate variable, repetitive manufacturing work in SMEs by teaching robots through demonstration.",
  keywords: ["robotics", "AI", "automation", "manufacturing", "Germany", "Europe", "SME", "KMU", "robotic arms", "machine learning", "adaptive robotics"],
  authors: [{ name: "Dream Machines" }],
  creator: "Dream Machines",
  publisher: "Dream Machines",
  metadataBase: new URL("https://dream-machines.eu"),
  alternates: {
    canonical: "/",
    languages: {
      "en-US": "/",
      "de-DE": "/",
    },
  },
  openGraph: {
    title: "Dream Machines - AI-Powered Robotic Arms for European SMEs",
    description: "Dream Machines lets non-roboticists automate variable, repetitive manufacturing work in SMEs by teaching robots through demonstration.",
    url: "https://dream-machines.eu",
    siteName: "Dream Machines",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Dream Machines - AI-Powered Robotics",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dream Machines - AI-Powered Robotic Arms for European SMEs",
    description: "Dream Machines lets non-roboticists automate variable, repetitive manufacturing work in SMEs by teaching robots through demonstration.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: { url: "/icon.svg", type: "image/svg+xml" },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmMono.variable} ${hasklig.variable} ${seasonCollective.variable}`}>
      <body className="bg-nerdy text-navy font-dm-mono">
        {children}
        <footer className="border-t border-navy/10">
          <div className="max-w-2xl mx-auto px-6 py-4 flex justify-end">
            <FooterImprintLink />
          </div>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
