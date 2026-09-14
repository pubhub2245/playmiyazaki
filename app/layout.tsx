import type { Metadata } from "next";
import "./globals.css";
import { HOME_TITLE, SITE_TAGLINE, SITE_URL } from "@/lib/i18n";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: HOME_TITLE.ja,
    template: "%s | Play Miyazaki",
  },
  description: SITE_TAGLINE.ja,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
