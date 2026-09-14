import type { MetadataRoute } from "next";
import { loadAllListings, loadTaxonomy } from "@/lib/data";
import { LANGS, SITE_URL } from "@/lib/i18n";
import { absolute, urlArea, urlCategory, urlGenre, urlHome, urlListing } from "@/lib/url";

export default function sitemap(): MetadataRoute.Sitemap {
  const taxonomy = loadTaxonomy();
  const listings = loadAllListings();
  const urls: MetadataRoute.Sitemap = [];
  const now = new Date();

  urls.push({ url: SITE_URL, lastModified: now });

  for (const lang of LANGS) {
    urls.push({ url: absolute(urlHome(lang)), lastModified: now });
    for (const g of taxonomy.genres) {
      urls.push({ url: absolute(urlGenre(lang, g.slug)), lastModified: now });
      for (const c of taxonomy.categories[g.slug] ?? []) {
        urls.push({ url: absolute(urlCategory(lang, g.slug, c.slug)), lastModified: now });
      }
      for (const a of taxonomy.areas) {
        urls.push({ url: absolute(urlArea(lang, g.slug, a.slug)), lastModified: now });
      }
    }
    for (const l of listings) {
      urls.push({
        url: absolute(urlListing(lang, l.genre, l.slug)),
        lastModified: new Date(l.verified_at),
      });
    }
  }

  return urls;
}
