import { loadAllListings, loadTaxonomy } from "./data";
import type { Listing } from "./types";

/**
 * A feature page must have at least this many listings to be generated.
 * Below this, the page would be "thin content" and drag down the site's
 * search-engine evaluation.
 */
export const FEATURE_MIN_COUNT = 3;

/**
 * A cross-genre area page (/[lang]/area/[area]) must have at least this many
 * listings across all genres to be generated. Municipalities with only a
 * handful of spots are already covered by the genre x area pages; giving them
 * their own page as well would only add thin pages.
 */
export const AREA_MIN_COUNT = 5;

/**
 * A genre x municipality page (/[lang]/[genre]/a/[area]) needs at least this
 * many listings before it is worth showing to a search engine. With one or two
 * listings the page is a near-duplicate of the listing's own detail page, and
 * a pile of near-duplicates makes a crawler stop reading any of them. The
 * pages themselves stay (people reach them from the genre page); they are just
 * marked "do not index" and left out of the sitemap. Same threshold as
 * FEATURE_MIN_COUNT so the two stay consistent.
 */
export const AREA_GENRE_MIN_COUNT = 3;

export type Coverage = {
  genres: Set<string>;
  /** listing count per area, across every genre */
  areaTotals: Map<string, number>;
  /** genres present in each area, with their counts */
  genreCountsByArea: Map<string, Map<string, number>>;
  categoriesByGenre: Map<string, Set<string>>;
  areasByGenre: Map<string, Set<string>>;
  featureCountsByGenre: Map<string, Map<string, number>>;
};

let cache: Coverage | null = null;

export function getCoverage(): Coverage {
  if (cache) return cache;
  const listings = loadAllListings();
  const genres = new Set<string>();
  const categoriesByGenre = new Map<string, Set<string>>();
  const areasByGenre = new Map<string, Set<string>>();
  const featureCountsByGenre = new Map<string, Map<string, number>>();
  const areaTotals = new Map<string, number>();
  const genreCountsByArea = new Map<string, Map<string, number>>();
  for (const l of listings) {
    areaTotals.set(l.area, (areaTotals.get(l.area) ?? 0) + 1);
    if (!genreCountsByArea.has(l.area)) genreCountsByArea.set(l.area, new Map());
    const gc = genreCountsByArea.get(l.area)!;
    gc.set(l.genre, (gc.get(l.genre) ?? 0) + 1);
    genres.add(l.genre);
    if (!categoriesByGenre.has(l.genre)) categoriesByGenre.set(l.genre, new Set());
    if (!areasByGenre.has(l.genre)) areasByGenre.set(l.genre, new Set());
    if (!featureCountsByGenre.has(l.genre)) featureCountsByGenre.set(l.genre, new Map());
    for (const c of l.category) categoriesByGenre.get(l.genre)!.add(c);
    areasByGenre.get(l.genre)!.add(l.area);
    const fc = featureCountsByGenre.get(l.genre)!;
    for (const f of l.features) fc.set(f, (fc.get(f) ?? 0) + 1);
  }
  cache = { genres, areaTotals, genreCountsByArea, categoriesByGenre, areasByGenre, featureCountsByGenre };
  return cache;
}

export function hasGenre(genre: string): boolean {
  return getCoverage().genres.has(genre);
}

export function hasCategory(genre: string, category: string): boolean {
  return getCoverage().categoriesByGenre.get(genre)?.has(category) ?? false;
}

export function hasArea(genre: string, area: string): boolean {
  return getCoverage().areasByGenre.get(genre)?.has(area) ?? false;
}

export function hasFeature(genre: string, feature: string): boolean {
  const count = getCoverage().featureCountsByGenre.get(genre)?.get(feature) ?? 0;
  return count >= FEATURE_MIN_COUNT;
}

export function featureCount(genre: string, feature: string): number {
  return getCoverage().featureCountsByGenre.get(genre)?.get(feature) ?? 0;
}

export function genresWithListings(): string[] {
  const taxonomy = loadTaxonomy();
  const cov = getCoverage();
  return taxonomy.genres.map((g) => g.slug).filter((s) => cov.genres.has(s));
}

export function categoriesWithListings(genre: string): string[] {
  const taxonomy = loadTaxonomy();
  const set = getCoverage().categoriesByGenre.get(genre) ?? new Set<string>();
  return (taxonomy.categories[genre] ?? []).map((c) => c.slug).filter((s) => set.has(s));
}

export function areasWithListings(genre: string): string[] {
  const taxonomy = loadTaxonomy();
  const set = getCoverage().areasByGenre.get(genre) ?? new Set<string>();
  return taxonomy.areas.map((a) => a.slug).filter((s) => set.has(s));
}

/**
 * Feature slugs that meet the FEATURE_MIN_COUNT threshold for this genre.
 * Returned in the order they appear in the taxonomy so the UI stays stable.
 */
export function featuresWithListings(genre: string): string[] {
  const taxonomy = loadTaxonomy();
  const cov = getCoverage();
  const counts = cov.featureCountsByGenre.get(genre) ?? new Map<string, number>();
  return (taxonomy.features[genre] ?? [])
    .map((f) => f.slug)
    .filter((s) => (counts.get(s) ?? 0) >= FEATURE_MIN_COUNT);
}

/** Every (genre, feature) pair that meets the threshold, sorted by count desc. */
export function allFeaturePagesRanked(): Array<{ genre: string; feature: string; count: number }> {
  const cov = getCoverage();
  const out: Array<{ genre: string; feature: string; count: number }> = [];
  for (const [genre, counts] of cov.featureCountsByGenre) {
    for (const [feature, count] of counts) {
      if (count >= FEATURE_MIN_COUNT) out.push({ genre, feature, count });
    }
  }
  out.sort((a, b) => b.count - a.count);
  return out;
}

/**
 * Areas that have their own cross-genre page, ordered by the taxonomy so the
 * listing order never shuffles between builds.
 */
export function areasWithCrossGenrePages(): string[] {
  const taxonomy = loadTaxonomy();
  const totals = getCoverage().areaTotals;
  return taxonomy.areas
    .map((a) => a.slug)
    .filter((slug) => (totals.get(slug) ?? 0) >= AREA_MIN_COUNT);
}

export function areaTotal(area: string): number {
  return getCoverage().areaTotals.get(area) ?? 0;
}

export function hasCrossGenreAreaPage(area: string): boolean {
  return areaTotal(area) >= AREA_MIN_COUNT;
}

/** Genres present in one area, in taxonomy order, with their counts. */
export function genresInArea(area: string): Array<{ genre: string; count: number }> {
  const taxonomy = loadTaxonomy();
  const counts = getCoverage().genreCountsByArea.get(area) ?? new Map<string, number>();
  return taxonomy.genres
    .map((g) => ({ genre: g.slug, count: counts.get(g.slug) ?? 0 }))
    .filter((x) => x.count > 0);
}

/**
 * 「近くのスポット」を最大 limit 件選ぶ。順番は
 *   1. 同じジャンル・同じ市町村・同じ種類
 *   2. 同じジャンル・同じ市町村
 *   3. 同じ市町村の別ジャンル
 *   4. 同じジャンル・別の市町村（緯度経度が両方あれば近い順、無ければ同じ種類を先に）
 * 各段の中は、自分の次から順に回す輪（名前順の循環）。誰のページにも同じ先頭5件が
 * 並ぶのをやめ、リンクがどのページにも行き渡るようにする。自分自身は出さない。
 * 倉庫のデータだけで決まる（外への通信なし）。
 */
export function nearbyInArea(current: Listing, limit: number): Listing[] {
  const all = loadAllListings()
    .filter((l) => l.status !== "closed")
    .slice()
    .sort((a, b) => a.genre.localeCompare(b.genre) || a.slug.localeCompare(b.slug));
  const idx = all.findIndex((l) => l.genre === current.genre && l.slug === current.slug);
  const ring = idx < 0 ? all : [...all.slice(idx + 1), ...all.slice(0, idx)];
  const others = ring.filter((l) => !(l.genre === current.genre && l.slug === current.slug));
  const sameCat = (l: Listing) => l.category.some((c) => current.category.includes(c));
  const dist = (l: Listing) =>
    current.lat != null && current.lng != null && l.lat != null && l.lng != null
      ? (l.lat - current.lat) ** 2 + (l.lng - current.lng) ** 2
      : Infinity;

  const sameGenre = others.filter((l) => l.genre === current.genre);
  const tiers: Listing[][] = [
    sameGenre.filter((l) => l.area === current.area && sameCat(l)),
    sameGenre.filter((l) => l.area === current.area && !sameCat(l)),
    others.filter((l) => l.genre !== current.genre && l.area === current.area),
    sameGenre
      .filter((l) => l.area !== current.area)
      .map((l, i) => ({ l, i }))
      .sort(
        (a, b) =>
          dist(a.l) - dist(b.l) ||
          Number(sameCat(b.l)) - Number(sameCat(a.l)) ||
          a.i - b.i,
      )
      .map((x) => x.l),
  ];
  const out: Listing[] = [];
  for (const t of tiers) {
    for (const l of t) {
      if (out.length >= limit) return out;
      out.push(l);
    }
  }
  return out;
}


/** Listings in one genre x area pair. */
export function areaGenreCount(genre: string, area: string): number {
  return getCoverage().genreCountsByArea.get(area)?.get(genre) ?? 0;
}

/**
 * True when the genre x area page carries enough listings to be worth
 * indexing. Below the threshold the page still renders, but it is marked
 * "do not index" and kept out of the sitemap.
 */
export function isIndexableAreaPage(genre: string, area: string): boolean {
  return areaGenreCount(genre, area) >= AREA_GENRE_MIN_COUNT;
}

/** Areas whose genre x area page meets the indexing threshold, taxonomy order. */
export function indexableAreasForGenre(genre: string): string[] {
  return areasWithListings(genre).filter((a) => isIndexableAreaPage(genre, a));
}
