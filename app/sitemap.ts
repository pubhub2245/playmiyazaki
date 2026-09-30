import type { MetadataRoute } from "next";
import { loadAllListings } from "@/lib/data";
import { LANGS, SITE_URL } from "@/lib/i18n";
import { absolute, urlArea, urlAreaAll, urlAreaIndex, urlCategory, urlFeature, urlGenre, urlHome, urlListing } from "@/lib/url";
import type { Listing } from "@/lib/types";
import {
  areasWithCrossGenrePages,
  indexableAreasForGenre,
  categoriesWithListings,
  featuresWithListings,
  genresWithListings,
} from "@/lib/coverage";

/**
 * The newest verified_at among a set of listings, or undefined when the set is
 * empty. Used as the lastmod of every page that is built out of listing data:
 * the page really does change when one of the listings on it changes.
 *
 * Why not simply use the build time: Google only uses <lastmod> "if it's
 * consistently and verifiably accurate" and expects it to reflect the last
 * significant update to the page
 * (https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).
 * This site is rebuilt several times a day by the queue runner, so stamping
 * every URL with the build time told Google that all ~1,600 pages had just
 * changed on every crawl. That is exactly the inaccurate signal Google
 * discards, and it gives it no way to tell the handful of pages that really
 * did change from the rest. Pages that are not generated from listing data
 * (the informational pages, MIYAZAKI PRIVATE) carry no lastmod at all, which
 * Google treats as "unknown" rather than as a false claim.
 */
function newest(listings: Listing[]): Date | undefined {
  let max: number | undefined;
  for (const l of listings) {
    const t = new Date(l.verified_at).getTime();
    if (Number.isNaN(t)) continue;
    if (max === undefined || t > max) max = t;
  }
  return max === undefined ? undefined : new Date(max);
}

export default function sitemap(): MetadataRoute.Sitemap {
  const listings = loadAllListings();
  const urls: MetadataRoute.Sitemap = [];
  const newestAll = newest(listings);

  urls.push({ url: SITE_URL, lastModified: newestAll });

  // MIYAZAKI PRIVATE (English only, no hreflang). The thanks page is noindex
  // and stays out of the sitemap. See docs/private.md.
  // These pages are hand-written, so we do not know when they last changed:
  // no lastmod rather than a made-up one.
  for (const p of ["/private", "/private/after-dark", "/private/nishitachi-night", "/private/local-on-call", "/private/route", "/private/request"]) {
    urls.push({ url: `${SITE_URL}${p}` });
  }

  // Informational pages (about / privacy / disclosure / contact / submit).
  // Hand-written as well, so likewise no lastmod.
  const INFO_PATHS = ["/about", "/privacy", "/disclosure", "/contact", "/submit"];

  for (const lang of LANGS) {
    urls.push({ url: absolute(urlHome(lang)), lastModified: newestAll });
    for (const p of INFO_PATHS) {
      urls.push({ url: absolute(`/${lang}${p}`) });
    }
    urls.push({ url: absolute(urlAreaIndex(lang)), lastModified: newestAll });
    for (const a of areasWithCrossGenrePages()) {
      urls.push({
        url: absolute(urlAreaAll(lang, a)),
        lastModified: newest(listings.filter((l) => l.area === a)),
      });
    }
    for (const g of genresWithListings()) {
      const inGenre = listings.filter((l) => l.genre === g);
      urls.push({ url: absolute(urlGenre(lang, g)), lastModified: newest(inGenre) });
      for (const c of categoriesWithListings(g)) {
        urls.push({
          url: absolute(urlCategory(lang, g, c)),
          lastModified: newest(inGenre.filter((l) => l.category.includes(c))),
        });
      }
      // Genre x municipality pages with only one or two listings are left out:
      // they are near-duplicates of the listing's own page. They stay on the
      // site, just marked "do not index" (see AREA_GENRE_MIN_COUNT).
      for (const a of indexableAreasForGenre(g)) {
        urls.push({
          url: absolute(urlArea(lang, g, a)),
          lastModified: newest(inGenre.filter((l) => l.area === a)),
        });
      }
      for (const f of featuresWithListings(g)) {
        urls.push({
          url: absolute(urlFeature(lang, g, f)),
          lastModified: newest(inGenre.filter((l) => l.features.includes(f))),
        });
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
