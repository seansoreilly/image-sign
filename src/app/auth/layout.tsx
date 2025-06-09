import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authentication - Image Sign",
  description:
    "Sign in to Image Sign to protect your digital assets with cryptographic signatures and verified identity embedding.",
  robots: {
    index: false, // Don't index auth pages
    follow: false,
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
