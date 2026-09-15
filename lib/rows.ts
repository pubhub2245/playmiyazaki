import type { Listing, Taxonomy } from "./types";
import type { Lang } from "./i18n";
import { urlListing } from "./url";
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

  const searchTerms = [
    listing.name.ja,
    listing.name.en,
    areaEntry?.ja ?? listing.area,
    areaEntry?.en ?? listing.area,
    ...listing.category.flatMap((c) => {
      const e = categoryLabels.find((x) => x.slug === c);
      return e ? [e.ja, e.en] : [c];
    }),
  ].join(" ");

  return {
    slug: listing.slug,
    href: urlListing(lang, listing.genre, listing.slug),
    name: listing.name[lang],
    description: listing.description?.[lang] ?? null,
    categoryLabel: catNames,
    areaLabel,
    verifiedAt: listing.verified_at,
    searchIndex: searchTerms,
  };
}
