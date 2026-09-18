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

export function nearbyInArea(current: Listing, limit: number): Listing[] {
  const all = loadAllListings();
  return all
    .filter((l) => l.genre === current.genre && l.area === current.area && l.slug !== current.slug)
    .sort((a, b) => a.name.ja.localeCompare(b.name.ja, "ja"))
    .slice(0, limit);
}
