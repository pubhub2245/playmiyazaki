import type { MetadataRoute } from "next";
import { loadAllListings } from "@/lib/data";
import { LANGS, SITE_URL } from "@/lib/i18n";
import { absolute, urlArea, urlCategory, urlFeature, urlGenre, urlHome, urlListing } from "@/lib/url";
import {
  areasWithListings,
  categoriesWithListings,
  featuresWithListings,
  genresWithListings,
} from "@/lib/coverage";

export default function sitemap(): MetadataRoute.Sitemap {
  const listings = loadAllListings();
  const urls: MetadataRoute.Sitemap = [];
  const now = new Date();

  urls.push({ url: SITE_URL, lastModified: now });

  // MIYAZAKI PRIVATE (English only, no hreflang). The thanks page is noindex
  // and stays out of the sitemap. See docs/private.md.
  for (const p of ["/private", "/private/after-dark", "/private/request"]) {
    urls.push({ url: `${SITE_URL}${p}`, lastModified: now });
  }

  // Informational pages (about / privacy / disclosure / contact / submit).
  const INFO_PATHS = ["/about", "/privacy", "/disclosure", "/contact", "/submit"];

  for (const lang of LANGS) {
    urls.push({ url: absolute(urlHome(lang)), lastModified: now });
    for (const p of INFO_PATHS) {
      urls.push({ url: absolute(`/${lang}${p}`), lastModified: now });
    }
    for (const g of genresWithListings()) {
      urls.push({ url: absolute(urlGenre(lang, g)), lastModified: now });
      for (const c of categoriesWithListings(g)) {
        urls.push({ url: absolute(urlCategory(lang, g, c)), lastModified: now });
      }
      for (const a of areasWithListings(g)) {
        urls.push({ url: absolute(urlArea(lang, g, a)), lastModified: now });
      }
      for (const f of featuresWithListings(g)) {
        urls.push({ url: absolute(urlFeature(lang, g, f)), lastModified: now });
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
