import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kindred",
  description: "A place to find your wellness family",
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
