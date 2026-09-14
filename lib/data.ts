import fs from "node:fs";
import path from "node:path";
import { listingSchema, taxonomySchema, type Listing, type Taxonomy } from "./types";

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "data");
const LISTINGS_DIR = path.join(DATA_DIR, "listings");

export function loadTaxonomy(): Taxonomy {
  const raw = fs.readFileSync(path.join(DATA_DIR, "taxonomy.json"), "utf8");
  return taxonomySchema.parse(JSON.parse(raw));
}

export function loadAllListings(): Listing[] {
  const results: Listing[] = [];
  if (!fs.existsSync(LISTINGS_DIR)) return results;
  const genres = fs.readdirSync(LISTINGS_DIR).filter((f) => {
    return fs.statSync(path.join(LISTINGS_DIR, f)).isDirectory();
  });
  for (const g of genres) {
    const dir = path.join(LISTINGS_DIR, g);
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
    for (const f of files) {
      const raw = fs.readFileSync(path.join(dir, f), "utf8");
      const parsed = listingSchema.parse(JSON.parse(raw));
      results.push(parsed);
    }
  }
  return results;
}

export function listingsByGenre(genre: string): Listing[] {
  return loadAllListings().filter((l) => l.genre === genre);
}
