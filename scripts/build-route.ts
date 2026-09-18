/**
 * build-route.ts
 *
 * Generates a 7-day Southern Kyushu route from data/listings/ and writes it
 * to docs/route-7days.en.md and docs/route-7days.ja.md.
 *
 * Rules (STEP 19-2):
 * - Route is: Miyazaki airport out and back.
 * - Each day has a fixed set of category "buckets" (e.g. Day 2 = 2 golf
 *   courses + 3 surf spots, no driving ranges). Areas are matched against
 *   data/taxonomy.json areas — items outside the day's areas are dropped
 *   even if they would otherwise fit the category.
 * - Listings with a non-null price are preferred. Null-price listings only
 *   fill in if a day cannot reach its minimum count with priced items.
 * - Same operator (same website hostname) is capped to 1 pick per day so a
 *   chain like Foodaly doesn't take multiple slots on the same day.
 * - No accommodation and no drive times (see docs/private.md). Each day
 *   ends with "Stay in the same area".
 *
 * Also emits stats to stdout so the operator can see how many priced
 * listings landed in each day.
 */
import fs from "node:fs";
import path from "node:path";
import { loadAllListings } from "../lib/data";
import type { Listing } from "../lib/types";
import { googleMapsUrl } from "../lib/url";

type Bucket = {
  name: string;
  max: number;
  match: (l: Listing) => boolean;
};

type DayFilter = {
  n: number;
  headingJa: string;
  headingEn: string;
  themeJa: string;
  themeEn: string;
  areas: string[];
  buckets: Bucket[];
  min: number;
};

function hasCategory(l: Listing, cats: string[]): boolean {
  const set = new Set(cats);
  return l.category.some((c) => set.has(c));
}

const DAYS: DayFilter[] = [
  {
    n: 1,
    headingJa: "Day 1 — 宮崎市（ニシタチ）",
    headingEn: "Day 1 — Miyazaki City (Nishitachi)",
    themeJa: "宮崎空港に着いた日。宮崎市中心部で地鶏の炭火焼と焼酎。",
    themeEn:
      "Arrival at Miyazaki Airport. Central Miyazaki City for charcoal-grilled jidori chicken and shochu.",
    areas: ["miyazaki-shi"],
    buckets: [
      {
        name: "jidori",
        max: 2,
        match: (l) => l.genre === "food" && hasCategory(l, ["jidori"]),
      },
      {
        name: "shochu",
        max: 1,
        match: (l) => l.genre === "food" && hasCategory(l, ["shochu"]),
      },
      {
        name: "market",
        max: 1,
        match: (l) => l.genre === "food" && hasCategory(l, ["market"]),
      },
    ],
    min: 3,
  },
  {
    n: 2,
    headingJa: "Day 2 — 青島・日南海岸（サーフ／ゴルフ）",
    headingEn: "Day 2 — Aoshima and the Nichinan coast (surf or golf)",
    themeJa: "青島から日南海岸を南へ。サーフィンかゴルフを選ぶ日。",
    themeEn:
      "Aoshima and the Nichinan coast — a day for either surfing or golf.",
    areas: ["miyazaki-shi", "nichinan"],
    buckets: [
      {
        name: "golf-course",
        max: 2,
        match: (l) => l.genre === "golf" && hasCategory(l, ["course"]),
      },
      {
        name: "surf",
        max: 3,
        match: (l) =>
          l.genre === "surf" && hasCategory(l, ["school", "shop", "point"]),
      },
    ],
    min: 3,
  },
  {
    n: 3,
    headingJa: "Day 3 — 日南・串間（ゴルフとキャンプ）",
    headingEn: "Day 3 — Nichinan and Kushima (golf and camping)",
    themeJa: "日南から串間へ。ゴルフ場、キャンプ場、直売所。",
    themeEn:
      "Nichinan into Kushima. Golf courses, campsites, and farm markets.",
    areas: ["nichinan", "kushima"],
    buckets: [
      {
        name: "golf-course",
        max: 1,
        match: (l) => l.genre === "golf" && hasCategory(l, ["course"]),
      },
      {
        name: "camp",
        max: 2,
        match: (l) =>
          l.genre === "camp" &&
          hasCategory(l, ["campsite", "rvpark", "carstay"]),
      },
      {
        name: "food",
        max: 2,
        match: (l) =>
          l.genre === "food" && hasCategory(l, ["market", "farm", "shochu"]),
      },
    ],
    min: 3,
  },
  {
    n: 4,
    headingJa: "Day 4 — 都城（宮崎牛・焼酎）",
    headingEn: "Day 4 — Miyakonojo (Miyazaki wagyu and shochu)",
    themeJa: "都城は宮崎牛の本場、焼酎の生産量日本一のまち。",
    themeEn:
      "Miyakonojo is where Miyazaki wagyu is raised and where more shochu is produced than anywhere else in Japan.",
    areas: ["miyakonojo", "mimata"],
    buckets: [
      {
        name: "jidori",
        max: 2,
        match: (l) => l.genre === "food" && hasCategory(l, ["jidori"]),
      },
      {
        name: "shochu",
        max: 1,
        match: (l) => l.genre === "food" && hasCategory(l, ["shochu"]),
      },
      {
        name: "farm",
        max: 1,
        match: (l) => l.genre === "food" && hasCategory(l, ["farm"]),
      },
      {
        name: "market",
        max: 1,
        match: (l) => l.genre === "food" && hasCategory(l, ["market"]),
      },
    ],
    min: 3,
  },
  {
    n: 5,
    headingJa: "Day 5 — 綾・西都・国富（食と直売所）",
    headingEn: "Day 5 — Aya, Saito and Kunitomi (food and farm markets)",
    themeJa: "有機の里・綾町から西都へ。焼酎蔵と直売所。",
    themeEn:
      "From Aya, Japan's organic-farming town, up to Saito. Shochu distilleries and roadside farm markets.",
    areas: ["aya", "saito", "kunitomi"],
    buckets: [
      {
        name: "shochu",
        max: 1,
        match: (l) => l.genre === "food" && hasCategory(l, ["shochu"]),
      },
      {
        name: "market",
        max: 2,
        match: (l) => l.genre === "food" && hasCategory(l, ["market"]),
      },
      {
        name: "farm",
        max: 1,
        match: (l) => l.genre === "food" && hasCategory(l, ["farm"]),
      },
      {
        name: "food-other",
        max: 1,
        match: (l) => l.genre === "food" && hasCategory(l, ["jidori"]),
      },
    ],
    min: 3,
  },
  {
    n: 6,
    headingJa: "Day 6 — 高千穂方面（延岡経由）",
    headingEn: "Day 6 — Takachiho area, via Nobeoka",
    themeJa: "延岡から山あいの高千穂・日之影・五ヶ瀬へ。神話の土地。",
    themeEn:
      "Nobeoka up into the mountains: Takachiho, Hinokage, Gokase. The land of the founding myths.",
    areas: ["nobeoka", "takachiho", "hinokage", "gokase"],
    buckets: [
      {
        name: "onsen",
        max: 2,
        match: (l) => l.genre === "camp" && hasCategory(l, ["onsen"]),
      },
      {
        name: "camp",
        max: 2,
        match: (l) =>
          l.genre === "camp" &&
          hasCategory(l, ["campsite", "rvpark", "carstay"]),
      },
      {
        name: "shochu",
        max: 1,
        match: (l) => l.genre === "food" && hasCategory(l, ["shochu"]),
      },
    ],
    min: 3,
  },
  {
    n: 7,
    headingJa: "Day 7 — 宮崎市（青島）",
    headingEn: "Day 7 — Miyazaki City (Aoshima)",
    themeJa: "帰り道。空港に戻る前に、青島とその周辺を歩く。",
    themeEn:
      "The way back. Aoshima and the beach walk before returning to the airport.",
    areas: ["miyazaki-shi"],
    buckets: [
      {
        name: "surf",
        max: 3,
        match: (l) =>
          l.genre === "surf" && hasCategory(l, ["school", "shop", "point"]),
      },
      {
        name: "camp",
        max: 1,
        match: (l) =>
          l.genre === "camp" &&
          hasCategory(l, ["campsite", "rvpark", "carstay"]),
      },
      {
        name: "food",
        max: 1,
        match: (l) =>
          l.genre === "food" && hasCategory(l, ["market", "farm"]),
      },
    ],
    min: 3,
  },
];

function scoreListing(l: Listing): number {
  let s = 0;
  if (l.website) s += 20;
  if (l.hours) s += 10;
  if (l.description?.en) s += 5;
  if (l.phone) s += 1;
  return s;
}

function operatorOf(l: Listing): string {
  if (l.website) {
    try {
      const u = new URL(l.website);
      const host = u.hostname.replace(/^www\./, "").toLowerCase();
      if (host) return `host:${host}`;
    } catch {
      // fall through
    }
  }
  return `slug:${l.genre}/${l.slug}`;
}

function pickForDay(
  day: DayFilter,
  all: Listing[],
  used: Set<string>,
): Listing[] {
  const areaSet = new Set(day.areas);
  const pool = all.filter(
    (l) =>
      !used.has(`${l.genre}/${l.slug}`) &&
      l.status !== "closed" &&
      areaSet.has(l.area),
  );

  const bucketPicks: Listing[][] = day.buckets.map(() => []);
  const usedOperators = new Set<string>();
  const categoryCounts = new Map<string, number>();

  const bucketFor = (l: Listing): number =>
    day.buckets.findIndex((b) => b.match(l));

  const sortByScore = (a: Listing, b: Listing): number => {
    const s = scoreListing(b) - scoreListing(a);
    if (s !== 0) return s;
    return a.slug.localeCompare(b.slug);
  };

  const tryAdd = (l: Listing): boolean => {
    const bi = bucketFor(l);
    if (bi < 0) return false;
    if (bucketPicks[bi].length >= day.buckets[bi].max) return false;
    const op = operatorOf(l);
    if (usedOperators.has(op)) return false;
    const primary = l.category[0] ?? "";
    if ((categoryCounts.get(primary) ?? 0) >= 2) return false;
    bucketPicks[bi].push(l);
    usedOperators.add(op);
    categoryCounts.set(primary, (categoryCounts.get(primary) ?? 0) + 1);
    return true;
  };

  const priced = pool.filter((l) => l.price !== null).sort(sortByScore);
  for (const l of priced) tryAdd(l);

  // Fill remaining bucket slots with null-price listings only where the
  // priced pool could not reach the bucket's max. Priced items are always
  // preferred (they were tried first).
  const unpriced = pool.filter((l) => l.price === null).sort(sortByScore);
  for (const l of unpriced) tryAdd(l);

  const picks: Listing[] = [];
  for (const arr of bucketPicks) {
    arr.sort(sortByScore);
    for (const l of arr) {
      picks.push(l);
      used.add(`${l.genre}/${l.slug}`);
    }
  }
  return picks;
}

function categoryLabel(l: Listing, lang: "ja" | "en"): string {
  const map: Record<string, { ja: string; en: string }> = {
    shop: { ja: "サーフショップ", en: "Surf shop" },
    school: { ja: "サーフスクール", en: "Surf school" },
    rental: { ja: "レンタル", en: "Board rental" },
    point: { ja: "サーフポイント", en: "Surf point" },
    stay: { ja: "宿", en: "Stay" },
    campsite: { ja: "キャンプ場", en: "Campsite" },
    rvpark: { ja: "RVパーク", en: "RV park" },
    carstay: { ja: "車中泊スポット", en: "Car stay" },
    onsen: { ja: "温泉", en: "Onsen" },
    jidori: { ja: "地鶏炭火焼", en: "Charcoal-grilled jidori" },
    shochu: { ja: "焼酎蔵", en: "Shochu distillery" },
    farm: { ja: "農園体験", en: "Farm" },
    market: { ja: "直売所", en: "Farm market" },
    course: { ja: "ゴルフ場", en: "Golf course" },
    range: { ja: "練習場", en: "Driving range" },
  };
  const primary = l.category[0] ?? "";
  return map[primary]?.[lang] ?? primary;
}

function mapsUrlFor(l: Listing): string {
  if (l.google_maps_url) return l.google_maps_url;
  const q = `${l.name.ja}, ${l.address.ja}`;
  return googleMapsUrl(q);
}

function fmtListingMd(l: Listing, lang: "ja" | "en"): string {
  const name = lang === "ja" ? l.name.ja : l.name.en;
  const label = categoryLabel(l, lang);
  const lines: string[] = [];
  lines.push(`- **${name}** — ${label}`);
  const address = lang === "ja" ? l.address.ja : l.address.en;
  lines.push(`  - ${lang === "ja" ? "住所" : "Address"}: ${address}`);
  if (l.hours) {
    const h = lang === "ja" ? l.hours.ja : l.hours.en;
    if (h) lines.push(`  - ${lang === "ja" ? "営業時間" : "Hours"}: ${h}`);
  } else {
    lines.push(
      `  - ${lang === "ja" ? "営業時間" : "Hours"}: ${lang === "ja" ? "公式サイトで確認" : "check the official site"}`,
    );
  }
  if (l.price) {
    const p = lang === "ja" ? l.price.ja : l.price.en;
    if (p) lines.push(`  - ${lang === "ja" ? "料金" : "Price"}: ${p}`);
  } else {
    lines.push(
      `  - ${lang === "ja" ? "料金" : "Price"}: ${lang === "ja" ? "公式サイトで確認" : "check the official site"}`,
    );
  }
  lines.push(`  - [${lang === "ja" ? "Google マップ" : "Google Maps"}](${mapsUrlFor(l)})`);
  if (l.website) {
    lines.push(`  - [${lang === "ja" ? "公式サイト" : "Official site"}](${l.website})`);
  }
  lines.push(`  - ${lang === "ja" ? "出典" : "Source"}: ${l.sources[0]}`);
  return lines.join("\n");
}

function renderMarkdown(
  lang: "ja" | "en",
  daysWithPicks: Array<{ day: DayFilter; picks: Listing[] }>,
): string {
  const parts: string[] = [];
  if (lang === "en") {
    parts.push("# 7-Day Southern Kyushu Route");
    parts.push("");
    parts.push(
      "A seven-day route through Miyazaki, southern Kyushu, built from our own verified database. Every stop has its address, opening hours (or a note to check the official site), price where the official source publishes one, a Google Maps link, and the source URL we verified against.",
    );
    parts.push("");
    parts.push(
      "In and out of Miyazaki Airport. We do not book hotels for you: sleep wherever you like inside the same area each night. We also do not print drive times because they change with the season and the road.",
    );
    parts.push("");
  } else {
    parts.push("# 宮崎7日ルート");
    parts.push("");
    parts.push(
      "宮崎の listing データから機械生成した7日間の旅程。各スポットには住所、営業時間（無ければ公式サイト参照）、公式に公開されている料金、Google マップへのリンク、確認済み出典URLを載せる。",
    );
    parts.push("");
    parts.push(
      "宮崎空港発着。宿は取らないので、各日の同じエリアで自分の好きな宿に泊まる。移動時間は季節と道で変わるので書かない。",
    );
    parts.push("");
  }
  for (const { day, picks } of daysWithPicks) {
    const heading = lang === "ja" ? day.headingJa : day.headingEn;
    const theme = lang === "ja" ? day.themeJa : day.themeEn;
    parts.push(`## ${heading}`);
    parts.push("");
    parts.push(theme);
    parts.push("");
    for (const p of picks) {
      parts.push(fmtListingMd(p, lang));
      parts.push("");
    }
    parts.push(
      lang === "ja"
        ? "_同じエリアに泊まる（宿は自分で手配）。_"
        : "_Stay in the same area (accommodation booked by you)._",
    );
    parts.push("");
  }
  return parts.join("\n").trimEnd() + "\n";
}

function main(): void {
  const all = loadAllListings();
  const used = new Set<string>();
  const daysWithPicks: Array<{ day: DayFilter; picks: Listing[] }> = [];
  for (const day of DAYS) {
    const picks = pickForDay(day, all, used);
    daysWithPicks.push({ day, picks });
  }

  const outDir = path.join(process.cwd(), "docs");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, "route-7days.en.md"),
    renderMarkdown("en", daysWithPicks),
    "utf8",
  );
  fs.writeFileSync(
    path.join(outDir, "route-7days.ja.md"),
    renderMarkdown("ja", daysWithPicks),
    "utf8",
  );

  let total = 0;
  let priced = 0;
  const perDay: string[] = [];
  console.log("=== 7-day route ===");
  for (const { day, picks } of daysWithPicks) {
    const p = picks.filter((x) => x.price !== null).length;
    const pct = picks.length ? Math.round((p * 100) / picks.length) : 0;
    console.log(
      `Day ${day.n}: ${picks.length} picks, ${p} priced (${pct}%)`,
    );
    perDay.push(`D${day.n} ${picks.length}(${pct}% priced)`);
    total += picks.length;
    priced += p;
  }
  console.log(
    `Total: ${total}, priced: ${priced} (${total ? Math.round((priced * 100) / total) : 0}%)`,
  );
  console.log(`STATS_LINE: ${perDay.join(" ")}`);

  const summary = daysWithPicks.map(({ day, picks }) => ({
    n: day.n,
    slugs: picks.map((p) => `${p.genre}/${p.slug}`),
  }));
  fs.writeFileSync(
    path.join(outDir, "route-7days.summary.json"),
    JSON.stringify(summary, null, 2) + "\n",
    "utf8",
  );
}

main();
