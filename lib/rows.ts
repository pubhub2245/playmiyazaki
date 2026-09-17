import type { Listing, Taxonomy } from "./types";
import type { Lang } from "./i18n";
import { urlFeature, urlListing } from "./url";
import { FEATURE_MIN_COUNT, getCoverage } from "./coverage";
import type { FilterableItem } from "@/app/_components/FilterableList";

export function listingToRow(
  listing: Listing,
  taxonomy: Taxonomy,
  lang: Lang,
): FilterableItem {
  const categoryLabels = taxonomy.categories[listing.genre] ?? [];
  const catNames = listing.category
    .map((c) => categoryLabels.find((x) => x.slug === c)?.[lang] ?? c)
    .join(" / ");
  const areaEntry = taxonomy.areas.find((a) => a.slug === listing.area);
  const areaLabel = areaEntry?.[lang] ?? listing.area;

  const featureLabels = taxonomy.features[listing.genre] ?? [];
  const cov = getCoverage();
  const featureCounts =
    cov.featureCountsByGenre.get(listing.genre) ?? new Map<string, number>();
  const features = listing.features
    .map((slug) => {
      const entry = featureLabels.find((f) => f.slug === slug);
      if (!entry) return null;
      const count = featureCounts.get(slug) ?? 0;
      // Only link out if the feature page will be generated for this genre.
      const href =
        count >= FEATURE_MIN_COUNT ? urlFeature(lang, listing.genre, slug) : "";
      return { slug, label: entry[lang], href };
    })
    .filter((f): f is { slug: string; label: string; href: string } => f !== null && f.href !== "");

  const searchTerms = [
    listing.name.ja,
    listing.name.en,
    listing.name.ko,
    areaEntry?.ja ?? listing.area,
    areaEntry?.en ?? listing.area,
    areaEntry?.ko ?? listing.area,
    ...listing.category.flatMap((c) => {
      const e = categoryLabels.find((x) => x.slug === c);
      return e ? [e.ja, e.en, e.ko] : [c];
    }),
    ...listing.features.flatMap((f) => {
      const e = featureLabels.find((x) => x.slug === f);
      return e ? [e.ja, e.en, e.ko] : [f];
    }),
  ].join(" ");

  return {
    slug: listing.slug,
    href: urlListing(lang, listing.genre, listing.slug),
    name: listing.name[lang],
    description: listing.description?.[lang] ?? null,
    categoryLabel: catNames,
    areaLabel,
    priceLabel: listing.price?.[lang] ?? null,
    verifiedAt: listing.verified_at,
    features,
    searchIndex: searchTerms,
  };
}
