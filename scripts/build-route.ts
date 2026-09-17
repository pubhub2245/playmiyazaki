/**
 * build-route.ts
 *
 * Generates a 7-day Southern Kyushu route from data/listings/ and writes it
 * to docs/route-7days.en.md and docs/route-7days.ja.md.
 *
 * Rules:
 * - Route is: Miyazaki airport out and back.
 * - Day 1 Miyazaki-shi (Nishitachi), Day 2 Aoshima / Nichinan coast (surf or
 *   golf), Day 3 Nichinan / Kushima (golf or camp), Day 4 Miyakonojo (wagyu,
 *   shochu), Day 5 Aya / Saito (food, markets), Day 6 Takachiho area (via
 *   Nobeoka), Day 7 back to Miyazaki-shi.
 * - Each day gets 3–5 listings.
 * - Listings with a non-null price rank ahead of null-price ones.
 * - We do not list accommodation or drive times (see docs/private.md and
 *   requirements). Instead each day ends with "Stay in the same area".
 *
 * Also emits stats to stdout so the operator can see how many priced
 * listings landed in each day.
 */
import fs from "node:fs";
import path from "node:path";
import { loadAllListings } from "../lib/data";
import type { Listing } from "../lib/types";
import { googleMapsUrl } from "../lib/url";

type DayFilter = {
  n: number;
  headingJa: string;
  headingEn: string;
  themeJa: string;
  themeEn: string;
  areas: string[];
  genres: Array<Listing["genre"]>;
  categoriesExclude?: string[];
  min: number;
  max: number;
};

const DAYS: DayFilter[] = [
  {
    n: 1,
    headingJa: "Day 1 — 宮崎市（ニシタチ）",
    headingEn: "Day 1 — Miyazaki City (Nishitachi)",
    themeJa: "宮崎空港に着いた日。宮崎市中心部で地鶏の炭火焼と焼酎。",
    themeEn:
      "Arrival at Miyazaki Airport. Central Miyazaki City for charcoal-grilled jidori chicken and shochu.",
    areas: ["miyazaki-shi"],
    genres: ["food"],
    categoriesExclude: ["farm"],
    min: 3,
    max: 5,
  },
  {
    n: 2,
    headingJa: "Day 2 — 青島・日南海岸（サーフ／ゴルフ）",
    headingEn: "Day 2 — Aoshima and the Nichinan coast (surf or golf)",
    themeJa: "青島から日南海岸を南へ。サーフィンかゴルフを選ぶ日。",
    themeEn:
      "Aoshima and the Nichinan coast — a day for either surfing or golf.",
    areas: ["miyazaki-shi", "nichinan"],
    genres: ["surf", "golf"],
    categoriesExclude: ["stay"],
    min: 3,
    max: 5,
  },
  {
    n: 3,
    headingJa: "Day 3 — 日南・串間（ゴルフとキャンプ）",
    headingEn: "Day 3 — Nichinan and Kushima (golf and camping)",
    themeJa: "日南から串間へ。ゴルフ場、キャンプ場、直売所。",
    themeEn:
      "Nichinan into Kushima. Golf courses, campsites, and farm markets.",
    areas: ["nichinan", "kushima"],
    genres: ["golf", "camp", "food"],
    categoriesExclude: ["stay", "jidori"],
    min: 3,
    max: 5,
  },
  {
    n: 4,
    headingJa: "Day 4 — 都城（宮崎牛・焼酎）",
    headingEn: "Day 4 — Miyakonojo (Miyazaki wagyu and shochu)",
    themeJa: "都城は宮崎牛の本場、焼酎の生産量日本一のまち。",
    themeEn:
      "Miyakonojo is where Miyazaki wagyu is raised and where more shochu is produced than anywhere else in Japan.",
    areas: ["miyakonojo", "mimata"],
    genres: ["food"],
    min: 3,
    max: 5,
  },
  {
    n: 5,
    headingJa: "Day 5 — 綾・西都（食と直売所）",
    headingEn: "Day 5 — Aya and Saito (food and farm markets)",
    themeJa: "有機の里・綾町から西都へ。焼酎蔵と直売所。",
    themeEn:
      "From Aya, Japan's organic-farming town, up to Saito. Shochu distilleries and roadside farm markets.",
    areas: ["aya", "saito", "kunitomi", "kobayashi"],
    genres: ["food"],
    min: 3,
    max: 5,
  },
  {
    n: 6,
    headingJa: "Day 6 — 高千穂方面（延岡経由）",
    headingEn: "Day 6 — Takachiho area, via Nobeoka",
    themeJa: "延岡から山あいの高千穂・日之影・五ヶ瀬へ。神話の土地。",
    themeEn:
      "Nobeoka up into the mountains: Takachiho, Hinokage, Gokase. The land of the founding myths.",
    areas: ["nobeoka", "takachiho", "hinokage", "gokase"],
    genres: ["food", "camp"],
    categoriesExclude: [],
    min: 3,
    max: 5,
  },
  {
    n: 7,
    headingJa: "Day 7 — 宮崎市へ戻る",
    headingEn: "Day 7 — Back to Miyazaki City",
    themeJa: "帰り道。空港に戻る前に、青島とその周辺を歩く。",
    themeEn:
      "The way back. Aoshima and the beach walk before returning to the airport.",
    areas: ["miyazaki-shi"],
    genres: ["surf", "food", "camp"],
    categoriesExclude: ["jidori", "shochu"],
    min: 3,
    max: 5,
  },
];

function scoreListing(l: Listing): number {
  let s = 0;
  if (l.price) s += 100;
  if (l.website) s += 20;
  if (l.hours) s += 10;
  if (l.description?.en) s += 5;
  if (l.phone) s += 1;
  return s;
}

function pickForDay(day: DayFilter, all: Listing[], used: Set<string>): Listing[] {
  const areaSet = new Set(day.areas);
  const genreSet = new Set(day.genres);
  const excludeCategories = new Set(day.categoriesExclude ?? []);
  const pool = all.filter((l) => {
    if (used.has(`${l.genre}/${l.slug}`)) return false;
    if (l.status === "closed") return false;
    if (!areaSet.has(l.area)) return false;
    if (!genreSet.has(l.genre)) return false;
    for (const c of l.category) {
      if (excludeCategories.has(c)) return false;
    }
    return true;
  });
  pool.sort((a, b) => {
    const s = scoreListing(b) - scoreListing(a);
    if (s !== 0) return s;
    return a.slug.localeCompare(b.slug);
  });
  const picks: Listing[] = [];
  const categoryTaken = new Map<string, number>();
  for (const l of pool) {
    if (picks.length >= day.max) break;
    const primary = l.category[0] ?? "";
    const count = categoryTaken.get(primary) ?? 0;
    if (count >= 2) continue;
    picks.push(l);
    categoryTaken.set(primary, count + 1);
    used.add(`${l.genre}/${l.slug}`);
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
  console.log("=== 7-day route ===");
  for (const { day, picks } of daysWithPicks) {
    const p = picks.filter((x) => x.price !== null).length;
    console.log(`Day ${day.n}: ${picks.length} picks, ${p} with price`);
    total += picks.length;
    priced += p;
  }
  console.log(
    `Total: ${total}, priced: ${priced} (${total ? Math.round((priced * 100) / total) : 0}%)`,
  );

  // Also print a machine-readable summary so the page can import it if needed.
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
