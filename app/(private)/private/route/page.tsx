import type { Metadata } from "next";
import Link from "next/link";
import fs from "node:fs";
import path from "node:path";
import { loadAllListings } from "@/lib/data";
import { googleMapsUrl } from "@/lib/url";
import type { Listing } from "@/lib/types";
import { PRIVATE_FOOTER } from "../brand";

export const metadata: Metadata = {
  title: "7-DAY SOUTHERN KYUSHU ROUTE",
  description:
    "A seven-day route through Miyazaki built from our verified database. Every stop with its price, opening hours and official source. No hotels sold, no commissions.",
  alternates: { canonical: "/private/route" },
};

type DayMeta = {
  n: number;
  heading: string;
  theme: string;
};

const DAY_META: Record<number, DayMeta> = {
  1: {
    n: 1,
    heading: "Day 1 — Miyazaki City (Nishitachi)",
    theme:
      "Arrival at Miyazaki Airport. Central Miyazaki City for charcoal-grilled jidori chicken and shochu.",
  },
  2: {
    n: 2,
    heading: "Day 2 — Aoshima and the Nichinan coast",
    theme: "Aoshima and the Nichinan coast — a day for either surfing or golf.",
  },
  3: {
    n: 3,
    heading: "Day 3 — Nichinan and Kushima",
    theme: "Nichinan into Kushima. Golf courses, campsites, and farm markets.",
  },
  4: {
    n: 4,
    heading: "Day 4 — Miyakonojo",
    theme:
      "Miyakonojo is where Miyazaki wagyu is raised and where more shochu is produced than anywhere else in Japan.",
  },
  5: {
    n: 5,
    heading: "Day 5 — Aya, Saito and Kunitomi",
    theme:
      "From Aya, Japan's organic-farming town, up to Saito. Shochu distilleries and roadside farm markets.",
  },
  6: {
    n: 6,
    heading: "Day 6 — Takachiho area, via Nobeoka",
    theme:
      "Nobeoka up into the mountains: Takachiho, Hinokage, Gokase. The land of the founding myths.",
  },
  7: {
    n: 7,
    heading: "Day 7 — Miyazaki City (Aoshima)",
    theme:
      "The way back. Aoshima and the beach walk before returning to the airport.",
  },
};

const CATEGORY_EN: Record<string, string> = {
  shop: "Surf shop",
  school: "Surf school",
  rental: "Board rental",
  point: "Surf point",
  stay: "Stay",
  campsite: "Campsite",
  rvpark: "RV park",
  carstay: "Car stay",
  onsen: "Onsen",
  jidori: "Charcoal-grilled jidori",
  shochu: "Shochu distillery",
  farm: "Farm",
  market: "Farm market",
  course: "Golf course",
  range: "Driving range",
};

type Summary = { n: number; slugs: string[] }[];

function loadSummary(): Summary {
  const p = path.join(process.cwd(), "docs", "route-7days.summary.json");
  const raw = fs.readFileSync(p, "utf8");
  return JSON.parse(raw) as Summary;
}

function mapsUrlFor(l: Listing): string {
  if (l.google_maps_url) return l.google_maps_url;
  return googleMapsUrl(`${l.name.ja}, ${l.address.ja}`);
}

function categoryLabel(l: Listing): string {
  const primary = l.category[0] ?? "";
  return CATEGORY_EN[primary] ?? primary;
}

type DayView = { meta: DayMeta; listings: Listing[] };

function buildView(): DayView[] {
  const summary = loadSummary();
  const all = loadAllListings();
  const bySlug = new Map<string, Listing>();
  for (const l of all) bySlug.set(`${l.genre}/${l.slug}`, l);
  const view: DayView[] = [];
  for (const d of summary) {
    const meta = DAY_META[d.n];
    if (!meta) continue;
    const listings: Listing[] = [];
    for (const key of d.slugs) {
      const l = bySlug.get(key);
      if (l) listings.push(l);
    }
    view.push({ meta, listings });
  }
  return view;
}

export default function RoutePage() {
  const days = buildView();
  return (
    <main>
      <p className="mp-kicker">
        <Link href="/private">MIYAZAKI PRIVATE</Link>
      </p>
      <h1>7-DAY SOUTHERN KYUSHU ROUTE</h1>
      <p className="mp-lede" style={{ marginTop: "28px" }}>
        For your second or third time in Japan. Miyazaki, without the crowds.
      </p>

      <section className="mp-section">
        <p>
          A seven-day route through Miyazaki built from our own verified
          database: every stop with its price, opening hours and official
          source. No hotels sold, no commissions &mdash; just the order we would
          do it in. Updated every season.
        </p>
      </section>

      {days.map(({ meta, listings }) => (
        <section key={meta.n} className="mp-section">
          <hr className="mp-rule" />
          <h2 style={{ marginTop: "28px" }}>{meta.heading}</h2>
          <p style={{ marginTop: "20px" }}>{meta.theme}</p>
          <ul className="mp-list" style={{ marginTop: "20px" }}>
            {listings.map((l) => {
              const priceEn = l.price?.en ?? null;
              return (
                <li key={`${l.genre}/${l.slug}`}>
                  <div>
                    <strong>{l.name.en}</strong>
                    <span className="mp-muted"> &mdash; {categoryLabel(l)}</span>
                  </div>
                  {priceEn ? (
                    <div style={{ marginTop: "6px" }}>{priceEn}</div>
                  ) : (
                    <div className="mp-muted" style={{ marginTop: "6px" }}>
                      Price: check the official site
                    </div>
                  )}
                  <div style={{ marginTop: "6px" }}>
                    <a href={mapsUrlFor(l)} rel="noopener">
                      Open in Google Maps
                    </a>
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="mp-muted" style={{ marginTop: "16px", fontSize: "14px" }}>
            Stay in the same area.
          </p>
        </section>
      ))}

      <section className="mp-section">
        <hr className="mp-rule" />
        <p style={{ marginTop: "28px" }}>
          Want the full route as a PDF with sources and a map? Request it
          &mdash; free while we are in preview.
        </p>
        <p style={{ marginTop: "24px" }}>
          <Link className="mp-btn" href="/private/request">
            Request the PDF
          </Link>
        </p>
      </section>

      <footer className="mp-footer">
        <p>{PRIVATE_FOOTER}</p>
      </footer>
    </main>
  );
}
