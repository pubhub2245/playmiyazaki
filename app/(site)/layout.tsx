import type { Metadata, Viewport } from "next";
import { Zen_Kaku_Gothic_New, IBM_Plex_Mono } from "next/font/google";
import "../globals.css";
import { HOME_TITLE, SITE_TAGLINE, SITE_URL } from "@/lib/i18n";

const display = Zen_Kaku_Gothic_New({
  weight: ["400", "700"],
  subsets: ["latin"],
  preload: false,
  variable: "--font-display",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: HOME_TITLE.ja,
    template: "%s | Play Miyazaki",
  },
  description: SITE_TAGLINE.ja,
};

export const viewport: Viewport = {
  themeColor: "#0B6AA8",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${display.variable} ${mono.variable}`}>
      <body>
        <div className="pm-canvas-bg" aria-hidden />
        <div className="pm-page">{children}</div>
      </body>
    </html>
  );
}
