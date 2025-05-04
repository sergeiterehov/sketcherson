import type { Metadata } from "next";
import { NextAppDirEmotionCacheProvider } from "tss-react/next/appDir";
import { CSSInterpolation, GlobalStyles } from "tss-react";
import iconColor from "@/icons/utils/iconColor";

export const metadata: Metadata = {
  title: "Sketcherson",
  description: "Two-dimensional CAD sketch",
};

const globalStyles: CSSInterpolation = {
  ":root": {
    "--background": "#fff",
    "--foreground": "#000",

    [iconColor.definition.basic]: "#000",
    [iconColor.definition.accent]: "#F00",
  },

  "html, body": {
    overscrollBehavior: "none",
  },

  body: {
    color: "var(--foreground)",
    background: "var(--background)",
    fontFamily: "Arial, Helvetica, sans-serif",
    WebkitFontSmoothing: "antialiased",
    MozOsxFontSmoothing: "grayscale",
  },

  "*": {
    boxSizing: "border-box",
    padding: 0,
    margin: 0,
  },

  a: {
    color: "inherit",
    textDecoration: "none",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <NextAppDirEmotionCacheProvider options={{ key: "css" }}>
          <GlobalStyles styles={globalStyles} />
          {children}
        </NextAppDirEmotionCacheProvider>
      </body>
    </html>
  );
}
