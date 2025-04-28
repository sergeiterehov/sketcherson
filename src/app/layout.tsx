import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sketcherson",
  description: "Create Sketch Like a CAD",
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
