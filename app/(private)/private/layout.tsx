import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./private.css";
import { PRIVATE_URL } from "./brand";

// MIYAZAKI PRIVATE is a separate brand. This is its own root layout:
// nothing from the Play Miyazaki layout, fonts or palette reaches it.
// See docs/private.md.

const display = Cormorant_Garamond({
  weight: ["500", "600"],
  subsets: ["latin"],
  preload: false,
  variable: "--font-mp-display",
  display: "swap",
});

const body = Inter({
  weight: ["400", "500"],
  subsets: ["latin"],
  preload: false,
  variable: "--font-mp-body",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(PRIVATE_URL),
  title: {
    default: "MIYAZAKI PRIVATE",
    template: "%s | MIYAZAKI PRIVATE",
  },
  description:
    "Private evenings and days in Miyazaki, southern Japan, for two to six guests.",
};

export default function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <div className="mp-page">{children}</div>
      </body>
    </html>
  );
}
