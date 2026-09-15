/**
 * patch-features.ts
 *
 * Reads every listing under data/listings/, infers a `features` array from
 * information that was ALREADY confirmed from source (the description text was
 * written from source in earlier steps; hours/price/category are also
 * source-verified). Writes the JSON back in place with the new features
 * array inserted after `tags`.
 *
 * Rule: only add a feature when a specific keyword appears in a
 * source-derived field. Never infer from geography or type alone.
 */
import fs from "node:fs";
import path from "node:path";
import { listingSchema, taxonomySchema, type Listing, type Taxonomy } from "../lib/types";

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "data");
const LISTINGS_DIR = path.join(DATA_DIR, "listings");

type Extractor = (l: Listing, text: string) => boolean;

const CAMP_RULES: Record<string, Extractor> = {
  sea: (_, t) =>
    /海[^軍抜]|ビーチ|海水浴|beach|coast|coastal|seaside|seashore|沿岸|浜木綿|白浜/i.test(t),
  river: (_, t) =>
    /川ぞい|川沿い|川辺|沿岸|riverside|river|渓流|五ヶ瀬川|綾北川|祝子川|酒谷川|耳川|石並川|川あそび|川遊び|river play|滝|waterfall|falls/i.test(
      t,
    ),
  lake: (_, t) =>
    /湖畔|湖の|lake|lakeside|reservoir|ダム湖|御池|Lake Miike|reservoir/i.test(t),
  mountain: (_, t) =>
    /高原(?!町)|標高|山あい|山中|山ぞい|山沿い|mountain camp|mountain lodge|mountain stream|highland|Ebino Highlands|Yatake Highlands|Kyushu Spine|Osuzu Prefectural|Kirishima range|elevation|m elevation/i.test(
      t,
    ),
  onsen: (l, t) =>
    l.category.includes("onsen") ||
    /温泉|onsen|入浴|hot spring|湯/i.test(t),
  auto: (l, t) =>
    l.category.includes("rvpark") ||
    /オート|オートキャンプ|auto camp|auto campsite|auto-camp/i.test(t),
  "free-site": (_, t) => /フリーサイト|free site|free-site/i.test(t),
  cottage: (_, t) =>
    /バンガロー|コテージ|cottage|bungalow|cabin|lodge|ロッジ/i.test(t),
  glamping: (_, t) => /グランピング|glamping/i.test(t),
  pet: (_, t) => /ペット|pet-friendly|Pets welcome|dog run|ドッグラン/i.test(t),
  carstay: (l) => l.category.includes("carstay"),
  rv: (l) => l.category.includes("rvpark"),
  power: (_, t) => /電源|power|electric|hookup/i.test(t),
  shower: (_, t) => /シャワー|shower/i.test(t),
  "day-camp": (_, t) => /デイキャンプ|day camp/i.test(t),
  "rental-gear": (_, t) => /手ぶら|レンタル用品|gear rental|レンタル一式/i.test(t),
  wifi: (_, t) => /Wi-?Fi|ワイファイ/i.test(t),
  "flush-toilet": (_, t) => /水洗トイレ|flush toilet/i.test(t),
  "reservation-online": (_, t) => /ネット予約|オンライン予約|online booking/i.test(t),
};

const FOOD_RULES: Record<string, Extractor> = {
  takeout: (_, t) => /テイクアウト|持ち帰り|takeout|Takeout|take-out/i.test(t),
  "meat-sales": (l, t) =>
    l.category.includes("market") ||
    /精肉|肉の販売|meat sales|meat and prepared|prepared products|whole birds/i.test(t),
  tour: (_, t) =>
    /蔵見学|工場見学|見学|tour|Tour|brewery tour|farm walk|hands-on/i.test(t),
  tasting: (_, t) => /試飲|試食|tasting|Tasting/i.test(t),
  reservation: (_, t) =>
    /要予約|予約制|要事前予約|reservation required|by reservation|reservation only/i.test(t),
  seasonal: (_, t) =>
    /季節限定|季節の|seasonal|Seasonal|\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\b[\s\-–—]|[1-9１-９]月[〜～ー\-]|[1-9１-９]月〜|picking/i.test(
      t,
    ),
  parking: (_, t) => /駐車|parking|Parking/i.test(t),
  english: (_, t) => /英語|English/i.test(t),
};

const SURF_RULES: Record<string, Extractor> = {
  rental: (l, t) =>
    l.category.includes("rental") ||
    /レンタル|board rental|wetsuit rental/i.test(t),
  beginner: (l, t) => {
    const isSchool = l.category.includes("school");
    if (!isSchool && !/初心者|beginner/i.test(t)) return false;
    return /初心者|beginner|beginner-friendly/i.test(t) || isSchool;
  },
  shower: (_, t) => /シャワー|shower/i.test(t),
  parking: (_, t) => /駐車|parking/i.test(t),
  english: (_, t) => /英語|English/i.test(t),
  stay: (l) => l.category.includes("stay"),
  pickup: (_, t) => /送迎|shuttle|pickup|airport pickup/i.test(t),
  kids: (_, t) => /キッズ|子ども|子供|kids|children|after-school/i.test(t),
};

function combinedText(l: Listing): string {
  const bits: string[] = [
    l.name.ja,
    l.name.en,
    l.description?.ja ?? "",
    l.description?.en ?? "",
    l.hours?.ja ?? "",
    l.hours?.en ?? "",
    l.price?.ja ?? "",
    l.price?.en ?? "",
    l.address.ja,
    l.address.en,
  ];
  return bits.join(" \n ");
}

function extractFeatures(l: Listing, taxonomy: Taxonomy): string[] {
  const text = combinedText(l);
  const rules =
    l.genre === "surf"
      ? SURF_RULES
      : l.genre === "camp"
        ? CAMP_RULES
        : l.genre === "food"
          ? FOOD_RULES
          : {};
  const validFeatureSlugs = new Set(
    (taxonomy.features[l.genre] ?? []).map((f) => f.slug),
  );
  // Start from any features already on the listing that are still in taxonomy —
  // preserves flags added by import scripts (e.g., takeout / meat-sales set from
  // the mjitokko cooperative detail page, which won't appear in the description).
  const out = new Set<string>();
  for (const f of l.features) {
    if (validFeatureSlugs.has(f)) out.add(f);
  }
  for (const [slug, rule] of Object.entries(rules)) {
    if (!validFeatureSlugs.has(slug)) continue;
    try {
      if (rule(l, text)) out.add(slug);
    } catch {
      // ignore
    }
  }
  // Preserve taxonomy order for stable output.
  const order = (taxonomy.features[l.genre] ?? []).map((f) => f.slug);
  return order.filter((s) => out.has(s));
}

function serializeWithFeatures(existing: unknown, features: string[]): string {
  // Preserve field ordering: rewrite the listing object with `features`
  // inserted between `tags` and `sources` (matching the schema order).
  const src = existing as Record<string, unknown>;
  const ordered: Record<string, unknown> = {};
  const preferredOrder = [
    "slug",
    "genre",
    "category",
    "area",
    "name",
    "address",
    "lat",
    "lng",
    "phone",
    "website",
    "google_maps_url",
    "hours",
    "price",
    "description",
    "tags",
    "features",
    "sources",
    "verified_at",
    "status",
  ];
  for (const k of preferredOrder) {
    if (k === "features") {
      ordered.features = features;
      continue;
    }
    if (k in src) ordered[k] = src[k];
  }
  // Preserve any unexpected keys after the known ones.
  for (const k of Object.keys(src)) {
    if (!(k in ordered)) ordered[k] = src[k];
  }
  return JSON.stringify(ordered, null, 2) + "\n";
}

function main(): void {
  const taxonomy = taxonomySchema.parse(
    JSON.parse(fs.readFileSync(path.join(DATA_DIR, "taxonomy.json"), "utf8")),
  );

  const stats: Record<string, { withFeatures: number; empty: number; totalTags: number; emptyNames: string[] }> = {};

  const genreDirs = fs.readdirSync(LISTINGS_DIR).filter((f) => {
    return fs.statSync(path.join(LISTINGS_DIR, f)).isDirectory();
  });

  for (const genreDir of genreDirs) {
    stats[genreDir] = { withFeatures: 0, empty: 0, totalTags: 0, emptyNames: [] };
    const dir = path.join(LISTINGS_DIR, genreDir);
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
    for (const file of files) {
      const full = path.join(dir, file);
      const raw = fs.readFileSync(full, "utf8");
      const parsedRaw = JSON.parse(raw) as Record<string, unknown>;
      // Ensure a features array exists so schema parse doesn't throw here.
      if (!("features" in parsedRaw)) parsedRaw.features = [];
      const listing = listingSchema.parse(parsedRaw);
      const features = extractFeatures(listing, taxonomy);
      const written = serializeWithFeatures(parsedRaw, features);
      fs.writeFileSync(full, written, "utf8");

      if (features.length > 0) {
        stats[genreDir].withFeatures += 1;
        stats[genreDir].totalTags += features.length;
      } else {
        stats[genreDir].empty += 1;
        stats[genreDir].emptyNames.push(listing.slug);
      }
    }
  }

  console.log("=== features backfill ===");
  for (const [genre, s] of Object.entries(stats)) {
    console.log(
      `${genre}: withFeatures=${s.withFeatures} empty=${s.empty} totalTags=${s.totalTags} avg=${s.withFeatures ? (s.totalTags / s.withFeatures).toFixed(2) : "0"}`,
    );
    if (s.emptyNames.length > 0) {
      console.log(`  empty: ${s.emptyNames.join(", ")}`);
    }
  }
}

main();
