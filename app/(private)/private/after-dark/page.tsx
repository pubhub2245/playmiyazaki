import type { Metadata } from "next";
import Link from "next/link";
import { PRIVATE_FOOTER } from "../brand";

export const metadata: Metadata = {
  title: "MIYAZAKI AFTER DARK",
  description:
    "A private evening in Nishitachi, Miyazaki. 18:00–23:00, two to four guests, one group per night.",
  alternates: { canonical: "/private/after-dark" },
};

const EVENING: { time: string; what: string }[] = [
  { time: "18:00", what: "Your host meets you at your hotel lobby in central Miyazaki City" },
  { time: "18:30", what: "Private-room dinner — Miyazaki wagyu, for your table only" },
  { time: "20:30", what: "Shochu tasting with a local host" },
  { time: "21:30", what: "A local bar" },
  { time: "22:15", what: "Private shisha room" },
  { time: "23:00", what: "Your host walks you back to your hotel" },
];

const INCLUDED = [
  "English-speaking host for the whole evening",
  "Dinner, drinks and shisha",
  "All reservations and private rooms",
];

const NOT_INCLUDED = [
  "Accommodation",
  "Flights and travel to Miyazaki",
  "Taxis if your hotel is outside the city centre (we introduce a local taxi company; you book and pay them directly)",
  "Gratuities (not expected in Japan)",
];

export default function AfterDark() {
  return (
    <main>
      <p className="mp-kicker">
        <Link href="/private">MIYAZAKI PRIVATE</Link>
      </p>
      <h1>MIYAZAKI AFTER DARK</h1>
      <p className="mp-lede" style={{ marginTop: "28px" }}>
        A private evening. 18:00–23:00. Two to four guests. One group per night.
      </p>

      <section className="mp-section">
        <p>
          Miyazaki after dark is not on any itinerary. We take you through it
          the way a local friend would — a private-room wagyu dinner, shochu
          poured by someone who knows it, a bar where the regulars are, and a
          private shisha room to end the night. Everything is within a
          ten-minute walk in Nishitachi, the city&rsquo;s night district.
        </p>
      </section>

      <section className="mp-section">
        <h2>The evening</h2>
        <p className="mp-muted" style={{ marginTop: "12px", fontSize: "14px" }}>
          Times are approximate.
        </p>
        <dl className="mp-time" style={{ marginTop: "20px" }}>
          {EVENING.map((step) => (
            <div key={step.time} style={{ display: "contents" }}>
              <dt>{step.time}</dt>
              <dd>{step.what}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mp-section">
        <h2>Included</h2>
        <ul className="mp-list" style={{ marginTop: "20px" }}>
          {INCLUDED.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </section>

      <section className="mp-section">
        <h2>Not included</h2>
        <ul className="mp-list" style={{ marginTop: "20px" }}>
          {NOT_INCLUDED.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </section>

      <section className="mp-section">
        <h2>Price</h2>
        <p style={{ marginTop: "20px" }}>
          ¥180,000 for two guests, ¥210,000 for three, ¥240,000 for four — per
          group, tax included, all food and drinks included. Five or six guests
          on request.
        </p>
      </section>

      <section className="mp-section">
        <h2>How it works</h2>
        <ol className="mp-list" style={{ marginTop: "20px" }}>
          <li>1. Send a request with your dates.</li>
          <li>2. We reply within 48 hours with a proposed evening and price.</li>
          <li>3. Confirm, and we send an invoice.</li>
        </ol>
        <p style={{ marginTop: "20px" }}>
          No online booking, no deposit until confirmed.
        </p>
      </section>

      <section className="mp-section">
        <Link className="mp-btn" href="/private/request">
          Request this evening
        </Link>
      </section>

      <footer className="mp-footer">
        <p>{PRIVATE_FOOTER}</p>
      </footer>
    </main>
  );
}
