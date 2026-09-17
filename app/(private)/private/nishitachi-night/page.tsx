import type { Metadata } from "next";
import Link from "next/link";
import { PRIVATE_FOOTER } from "../brand";

export const metadata: Metadata = {
  title: "NISHITACHI NIGHT WITH A LOCAL",
  description:
    "Three hours in Nishitachi with an English-speaking local host. 19:00–22:00, two to six guests, twice a week.",
  alternates: { canonical: "/private/nishitachi-night" },
};

const EVENING: { time: string; what: string }[] = [
  { time: "19:00", what: "Meet your host at a landmark in central Miyazaki City" },
  { time: "19:15", what: "Miyazaki wagyu — one plate, one drink" },
  { time: "20:15", what: "Shochu tasting" },
  { time: "21:15", what: "A local bar" },
  { time: "22:00", what: "Goodnight at the same landmark" },
];

const INCLUDED = [
  "English-speaking local host",
  "One wagyu plate, shochu tasting and two drinks",
  "All seats reserved",
];

const NOT_INCLUDED = [
  "Additional food and drinks",
  "Transport to and from central Miyazaki",
  "Gratuities (not expected in Japan)",
];

export default function NishitachiNight() {
  return (
    <main>
      <p className="mp-kicker">
        <Link href="/private">MIYAZAKI PRIVATE</Link>
      </p>
      <h1>NISHITACHI NIGHT WITH A LOCAL</h1>
      <p className="mp-lede" style={{ marginTop: "28px" }}>
        Three hours. 19:00–22:00. Two to six guests. Twice a week.
      </p>

      <section className="mp-section">
        <p>
          Nishitachi is where Miyazaki drinks. Not on any itinerary, not in any
          guidebook — just a few streets of tiny bars where the regulars are. A
          local host takes you in: one plate of Miyazaki wagyu, shochu poured
          the way it is here, and a bar you would never find on your own.
          Everything within a five-minute walk.
        </p>
      </section>

      <section className="mp-section">
        <h2>The night</h2>
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
          ¥25,000 per guest. Minimum two guests, maximum six. Private group on
          request.
        </p>
      </section>

      <section className="mp-section">
        <h2>Book</h2>
        <p style={{ marginTop: "20px" }}>
          Available on GetYourGuide, Viator and Airbnb Experiences. Or send us
          a request.
        </p>
        <p style={{ marginTop: "24px" }}>
          <Link className="mp-btn" href="/private/request">
            Send a request
          </Link>
        </p>
      </section>

      <section className="mp-section">
        <p className="mp-muted" style={{ fontSize: "14px" }}>
          Guests must be 20 or older (Japan&rsquo;s legal drinking age).
        </p>
      </section>

      <footer className="mp-footer">
        <p>{PRIVATE_FOOTER}</p>
      </footer>
    </main>
  );
}
