import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import NextAuthSessionProvider from "@/components/SessionProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Image Sign - Secure Digital Image Authentication",
  description:
    "Protect your digital assets with cryptographic signatures. Sign in with Google to embed your encrypted email address into images for tamper-proof authenticity verification.",
  keywords: [
    "image signing",
    "digital authentication",
    "cryptographic verification",
    "image security",
    "digital signatures",
  ],
  authors: [{ name: "Image Sign" }],
  creator: "Image Sign",
  publisher: "Image Sign",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://image-sign.app"),
  openGraph: {
    title: "Image Sign - Secure Digital Image Authentication",
    description:
      "Protect your digital assets with cryptographic signatures and verified identity embedding.",
    type: "website",
    locale: "en_US",
    siteName: "Image Sign",
    url: "https://image-sign.app",
  },
  twitter: {
    card: "summary_large_image",
    title: "Image Sign - Secure Digital Image Authentication",
    description:
      "Protect your digital assets with cryptographic signatures and verified identity embedding.",
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
  verification: {
    google: "google-site-verification-token",
  },
  alternates: {
    canonical: "https://image-sign.app",
  },
};

// Structured data for better SEO
const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Image Sign",
  description:
    "Secure digital image authentication with cryptographic signatures",
  url: "https://image-sign.app",
  applicationCategory: "SecurityApplication",
  operatingSystem: "Web Browser",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  author: {
    "@type": "Organization",
    name: "Image Sign",
  },
  featureList: [
    "Digital image signing",
    "Cryptographic verification",
    "Google OAuth authentication",
    "Tamper-proof verification",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      </head>
      <body className={inter.className}>
        <NextAuthSessionProvider>{children}</NextAuthSessionProvider>
      </body>
    </html>
  );
}
