import { loadAllListings, loadTaxonomy } from "./data";
import type { Listing } from "./types";

export type Coverage = {
  genres: Set<string>;
  categoriesByGenre: Map<string, Set<string>>;
  areasByGenre: Map<string, Set<string>>;
};

let cache: Coverage | null = null;

export function getCoverage(): Coverage {
  if (cache) return cache;
  const listings = loadAllListings();
  const genres = new Set<string>();
  const categoriesByGenre = new Map<string, Set<string>>();
  const areasByGenre = new Map<string, Set<string>>();
  for (const l of listings) {
    genres.add(l.genre);
    if (!categoriesByGenre.has(l.genre)) categoriesByGenre.set(l.genre, new Set());
    if (!areasByGenre.has(l.genre)) areasByGenre.set(l.genre, new Set());
    for (const c of l.category) categoriesByGenre.get(l.genre)!.add(c);
    areasByGenre.get(l.genre)!.add(l.area);
  }
  cache = { genres, categoriesByGenre, areasByGenre };
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

export function nearbyInArea(current: Listing, limit: number): Listing[] {
  const all = loadAllListings();
  return all
    .filter((l) => l.genre === current.genre && l.area === current.area && l.slug !== current.slug)
    .sort((a, b) => a.name.ja.localeCompare(b.name.ja, "ja"))
    .slice(0, limit);
}
