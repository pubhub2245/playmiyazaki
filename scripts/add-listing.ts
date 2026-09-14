import fs from "node:fs";
import path from "node:path";
import * as cheerio from "cheerio";
import { listingSchema, taxonomySchema } from "../lib/types";

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "data");
const LISTINGS_DIR = path.join(DATA_DIR, "listings");

type Extracted = {
  name: string | null;
  phone: string | null;
  address: string | null;
  website: string | null;
};

async function fetchAndExtract(url: string): Promise<Extracted> {
  const res = await fetch(url, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (compatible; playmiyazaki-scraper/0.1; +https://playmiyazaki.com)",
    },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  const html = await res.text();
  const $ = cheerio.load(html);

  const ogTitle = $('meta[property="og:title"]').attr("content")?.trim() ?? null;
  const title = $("title").first().text().trim() || null;
  const name = ogTitle || title;

  const phoneMatch = html.match(/0\d{1,4}[-(\s]?\d{1,4}[-)\s]?\d{3,4}/);
  const phone = phoneMatch ? phoneMatch[0].replace(/[()\s]/g, "-") : null;

  let address: string | null = null;
  const addrRegex = /宮崎県[^\s<>"']{4,60}/;
  const addrMatch = html.match(addrRegex);
  if (addrMatch) address = addrMatch[0].replace(/&amp;/g, "&");

  return { name, phone, address, website: url };
}

async function main(): Promise<void> {
  const [, , genre, slug, source] = process.argv;
  if (!genre || !slug || !source) {
    console.error("usage: npx tsx scripts/add-listing.ts <genre> <slug> <source-url>");
    process.exit(2);
  }

  const taxonomy = taxonomySchema.parse(
    JSON.parse(fs.readFileSync(path.join(DATA_DIR, "taxonomy.json"), "utf8")),
  );
  const genreSlugs = new Set(taxonomy.genres.map((g) => g.slug));
  if (!genreSlugs.has(genre)) {
    console.error(`unknown genre: ${genre}. Allowed: ${Array.from(genreSlugs).join(", ")}`);
    process.exit(2);
  }
  if (!/^[a-z0-9-]+$/.test(slug)) {
    console.error(`slug must be lowercase-hyphen: ${slug}`);
    process.exit(2);
  }

  const dir = path.join(LISTINGS_DIR, genre);
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, `${slug}.json`);
  if (fs.existsSync(filePath)) {
    console.error(`already exists: ${filePath}`);
    process.exit(2);
  }

  let extracted: Extracted = { name: null, phone: null, address: null, website: source };
  try {
    extracted = await fetchAndExtract(source);
  } catch (e) {
    console.warn(`[warn] could not fetch source: ${(e as Error).message}`);
  }

  const today = new Date().toISOString().slice(0, 10);

  const stub = {
    slug,
    genre,
    category: [] as string[],
    area: "",
    name: { ja: extracted.name ?? "", en: "" },
    address: { ja: extracted.address ?? "", en: "" },
    lat: null,
    lng: null,
    phone: extracted.phone,
    website: extracted.website,
    google_maps_url: null,
    hours: null,
    price: null,
    description: null,
    tags: null,
    sources: [source],
    verified_at: today,
    status: "open",
  };

  const check = listingSchema.safeParse(stub);
  fs.writeFileSync(filePath, JSON.stringify(stub, null, 2) + "\n", "utf8");
  console.log(`wrote ${filePath}`);
  if (!check.success) {
    console.log("stub is not yet valid — fill in the remaining required fields:");
    for (const issue of check.error.issues) {
      console.log(`  - ${issue.path.join(".") || "(root)"}: ${issue.message}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
