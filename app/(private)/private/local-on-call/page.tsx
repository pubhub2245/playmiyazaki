import type { Metadata } from "next";
import Link from "next/link";
import { PRIVATE_FOOTER } from "../brand";

export const metadata: Metadata = {
  title: "LOCAL ON CALL",
  description:
    "A local friend in your pocket, for the length of your stay in Miyazaki. One chat thread, answers within the hour, 8:00–23:00 JST.",
  alternates: { canonical: "/private/local-on-call" },
};

const WHAT_YOU_GET = [
  "One chat thread (WhatsApp or email) for your whole group",
  "Answers within the hour, 8:00–23:00 JST",
  "Restaurant and activity suggestions with prices and opening hours",
  "Reservations made on your behalf where a phone call in Japanese is needed",
];

const WHAT_WE_DONT_DO = [
  "Transport, accommodation or flight bookings",
  "Guiding in person",
  "Payments on your behalf",
];

export default function LocalOnCall() {
  return (
    <main>
      <p className="mp-kicker">
        <Link href="/private">MIYAZAKI PRIVATE</Link>
      </p>
      <h1>LOCAL ON CALL</h1>
      <p className="mp-lede" style={{ marginTop: "28px" }}>
        A local friend in your pocket, for the length of your stay in Miyazaki.
      </p>

      <section className="mp-section">
        <p>
          Not a tour. Not a guide. Just someone local you can message &mdash;
          in English &mdash; for up to seven days. Where to eat tonight,
          whether the surf is worth the drive tomorrow, what to buy at that
          roadside station, how to say it at the counter. We answer within the
          hour, from 8:00 to 23:00 Japan time, using our own verified database
          of 315 places in Miyazaki with prices.
        </p>
      </section>

      <section className="mp-section">
        <h2>What you get</h2>
        <ul className="mp-list" style={{ marginTop: "20px" }}>
          {WHAT_YOU_GET.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </section>

      <section className="mp-section">
        <h2>What we don&rsquo;t do</h2>
        <ul className="mp-list" style={{ marginTop: "20px" }}>
          {WHAT_WE_DONT_DO.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </section>

      <section className="mp-section">
        <h2>Price</h2>
        <p style={{ marginTop: "20px" }}>
          &yen;15,000 per group, up to seven days.
        </p>
      </section>

      <section className="mp-section">
        <Link className="mp-btn" href="/private/request">
          Request Local on Call
        </Link>
      </section>

      <footer className="mp-footer">
        <p>{PRIVATE_FOOTER}</p>
      </footer>
    </main>
  );
}
