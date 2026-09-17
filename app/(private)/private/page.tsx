import type { Metadata } from "next";
import Link from "next/link";
import { PRIVATE_FOOTER } from "./brand";

export const metadata: Metadata = {
  title: "MIYAZAKI PRIVATE",
  description:
    "Private evenings and days in Miyazaki, southern Japan, for two to six guests who already know Tokyo and Kyoto.",
  alternates: { canonical: "/private" },
};

export default function PrivateHome() {
  return (
    <main>
      <h1>MIYAZAKI PRIVATE</h1>
      <p className="mp-lede" style={{ marginTop: "28px" }}>
        There is another Miyazaki.
      </p>
      <p className="mp-lede">
        Zero-crowd Japan. Miyazaki is what Kyoto used to feel like.
      </p>

      <section className="mp-section">
        <p>
          Private evenings and days in Miyazaki, southern Japan — designed for
          two to six guests who already know Tokyo and Kyoto. An
          English-speaking host, private rooms, and places that are not on the
          map.
        </p>
      </section>

      <section className="mp-section">
        <hr className="mp-rule" />
        <h2 style={{ marginTop: "28px" }}>
          <Link href="/private/after-dark">
            MIYAZAKI AFTER DARK — a private evening. From ¥180,000 for two
            guests. →
          </Link>
        </h2>
        <h2 style={{ marginTop: "28px" }}>
          <Link href="/private/nishitachi-night">
            NISHITACHI NIGHT WITH A LOCAL — three hours. ¥25,000 per guest. →
          </Link>
        </h2>
        <h2 style={{ marginTop: "28px" }}>
          <Link href="/private/local-on-call">
            LOCAL ON CALL — a local friend in your pocket. ¥15,000 per group. →
          </Link>
        </h2>
        <h2 style={{ marginTop: "28px" }}>
          <Link href="/private/route">
            7-DAY SOUTHERN KYUSHU ROUTE — Miyazaki without the crowds. Free
            preview. →
          </Link>
        </h2>
      </section>

      <section className="mp-section">
        <Link className="mp-btn" href="/private/request">
          Request a private evening
        </Link>
      </section>

      <footer className="mp-footer">
        <p>{PRIVATE_FOOTER}</p>
      </footer>
    </main>
  );
}
