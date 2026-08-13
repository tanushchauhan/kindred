import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kindred",
  description:
    "AI-assisted wellness matching, shared health insights, personalized plans, and chat.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
