import fs from "node:fs";
import path from "node:path";
import { listingSchema, taxonomySchema, type Taxonomy } from "./types";

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "data");
const LISTINGS_DIR = path.join(DATA_DIR, "listings");

type Fail = { file: string; message: string };

function loadTaxonomy(): Taxonomy {
  const raw = fs.readFileSync(path.join(DATA_DIR, "taxonomy.json"), "utf8");
  return taxonomySchema.parse(JSON.parse(raw));
}

function main(): void {
  const failures: Fail[] = [];
  const taxonomy = loadTaxonomy();
  const genreSlugs = new Set(taxonomy.genres.map((g) => g.slug));
  const areaSlugs = new Set(taxonomy.areas.map((a) => a.slug));

  if (!fs.existsSync(LISTINGS_DIR)) {
    console.log("[validate] no data/listings directory yet - nothing to validate.");
    return;
  }

  const genreDirs = fs.readdirSync(LISTINGS_DIR).filter((f) => {
    return fs.statSync(path.join(LISTINGS_DIR, f)).isDirectory();
  });

  let checked = 0;
  const slugsSeen = new Set<string>();

  for (const genreDir of genreDirs) {
    if (!genreSlugs.has(genreDir)) {
      failures.push({ file: genreDir, message: `unknown genre folder: ${genreDir}` });
      continue;
    }
    const categorySlugs = new Set(
      (taxonomy.categories[genreDir] ?? []).map((c) => c.slug),
    );
    const dir = path.join(LISTINGS_DIR, genreDir);
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));

    for (const file of files) {
      const filePath = path.join("data/listings", genreDir, file);
      const raw = fs.readFileSync(path.join(dir, file), "utf8");
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch (e) {
        failures.push({ file: filePath, message: `invalid JSON: ${(e as Error).message}` });
        continue;
      }
      const result = listingSchema.safeParse(parsed);
      if (!result.success) {
        for (const issue of result.error.issues) {
          failures.push({
            file: filePath,
            message: `${issue.path.join(".")}: ${issue.message}`,
          });
        }
        continue;
      }
      const listing = result.data;
      checked += 1;

      if (listing.genre !== genreDir) {
        failures.push({
          file: filePath,
          message: `genre "${listing.genre}" does not match folder "${genreDir}"`,
        });
      }
      const expectedFile = `${listing.slug}.json`;
      if (file !== expectedFile) {
        failures.push({
          file: filePath,
          message: `filename "${file}" does not match slug "${listing.slug}" (expected ${expectedFile})`,
        });
      }
      const globalKey = `${listing.genre}/${listing.slug}`;
      if (slugsSeen.has(globalKey)) {
        failures.push({ file: filePath, message: `duplicate slug: ${globalKey}` });
      }
      slugsSeen.add(globalKey);

      for (const c of listing.category) {
        if (!categorySlugs.has(c)) {
          failures.push({
            file: filePath,
            message: `unknown category "${c}" for genre "${genreDir}"`,
          });
        }
      }
      if (!areaSlugs.has(listing.area)) {
        failures.push({ file: filePath, message: `unknown area: ${listing.area}` });
      }
    }
  }

  if (failures.length > 0) {
    console.error(`[validate] FAIL - ${failures.length} issue(s):`);
    for (const f of failures) {
      console.error(`  ${f.file}: ${f.message}`);
    }
    process.exit(1);
  }

  console.log(`[validate] OK - ${checked} listing(s) valid.`);
}

main();
