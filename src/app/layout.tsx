import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import NextAuthSessionProvider from "@/components/SessionProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Image Sign - Secure Digital Image Authentication",
  description:
    "Protect your digital assets with cryptographic signatures. Sign in with Google to embed your verified identity into images for tamper-proof authenticity verification.",
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <NextAuthSessionProvider>{children}</NextAuthSessionProvider>
      </body>
    </html>
  );
}
