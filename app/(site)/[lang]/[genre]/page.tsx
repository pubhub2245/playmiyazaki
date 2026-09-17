import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listingsByGenre, loadTaxonomy } from "@/lib/data";
import { LANGS, type Lang } from "@/lib/i18n";
import { absolute, urlGenre, urlHome } from "@/lib/url";
import {
  areasWithListings,
  categoriesWithListings,
  genresWithListings,
  hasGenre,
} from "@/lib/coverage";
import {
  AreaChips,
  CategoryChips,
  areaCountsForGenre,
  categoryCountsForGenre,
} from "@/app/_components/FilterBar";
import { FeatureChips, featureCountsForGenre } from "@/app/_components/FeatureChips";
import { TideBand } from "@/app/_components/TideBand";
import { Breadcrumbs } from "@/app/_components/Breadcrumbs";
import { FilteredCategoryGroups, type Group } from "@/app/_components/FilteredCategoryGroups";
import { listingToRow } from "@/lib/rows";
import { JsonLd } from "@/app/_components/JsonLd";
import { collectionJsonLd } from "@/lib/jsonld";

type Props = { params: { lang: string; genre: string } };

export const dynamicParams = false;

export function generateStaticParams() {
  const params: { lang: string; genre: string }[] = [];
  for (const lang of LANGS) {
    for (const g of genresWithListings()) {
      params.push({ lang, genre: g });
    }
  }
  return params;
}

export function generateMetadata({ params }: Props): Metadata {
  const lang = (params.lang === "en" ? "en" : "ja") as Lang;
  const taxonomy = loadTaxonomy();
  const genre = taxonomy.genres.find((g) => g.slug === params.genre);
  if (!genre) return {};
  const title =
    lang === "ja" ? `宮崎の${genre.ja}一覧` : `${genre.en} in Miyazaki`;
  const description =
    lang === "ja"
      ? `宮崎県内の${genre.ja}を、出典URL付きで一覧にしています。`
      : `A source-linked directory of ${genre.en.toLowerCase()} spots across Miyazaki.`;
  return {
    title,
    description,
    alternates: {
      canonical: absolute(urlGenre(lang, params.genre)),
      languages: {
        ja: absolute(urlGenre("ja", params.genre)),
        en: absolute(urlGenre("en", params.genre)),
      },
    },
  };
}

export default function GenrePage({ params }: Props) {
  const lang = (params.lang === "en" ? "en" : "ja") as Lang;
  const taxonomy = loadTaxonomy();
  const genre = taxonomy.genres.find((g) => g.slug === params.genre);
  if (!genre || !hasGenre(params.genre)) notFound();

  const listings = listingsByGenre(params.genre);
  const catCounts = categoryCountsForGenre(listings);
  const areaCounts = areaCountsForGenre(listings);
  const featCounts = featureCountsForGenre(listings);
  const activeCats = new Set(categoriesWithListings(params.genre));
  // Ensure both coverage helpers are wired to this page (chip filter reads both).
  void areasWithListings(params.genre);

  const groups: Group[] = (taxonomy.categories[params.genre] ?? [])
    .filter((c) => activeCats.has(c.slug))
    .map((c) => {
      const items = listings
        .filter((l) => l.category.includes(c.slug))
        .sort((a, b) => {
          const aArea =
            taxonomy.areas.find((x) => x.slug === a.area)?.ja ?? a.area;
          const bArea =
            taxonomy.areas.find((x) => x.slug === b.area)?.ja ?? b.area;
          const areaCmp = aArea.localeCompare(bArea, "ja");
          if (areaCmp !== 0) return areaCmp;
          return a.name.ja.localeCompare(b.name.ja, "ja");
        })
        .map((l) => listingToRow(l, taxonomy, lang));
      return { key: c.slug, label: c[lang], items };
    });

  const pageTitle =
    lang === "ja" ? `宮崎の${genre.ja}一覧` : `${genre.en} in Miyazaki`;
  const pageDescription =
    lang === "ja"
      ? `宮崎県内の${genre.ja}を、出典URL付きで一覧にしています。`
      : `A source-linked directory of ${genre.en.toLowerCase()} spots across Miyazaki.`;
  const allRows = groups.flatMap((g) => g.items);

  return (
    <>
      <div className="-mx-4 -mt-6 mb-6">
        <TideBand
          title={lang === "ja" ? genre.ja : genre.en}
          count={listings.length}
          lang={lang}
        />
      </div>
      <div className="space-y-6">
        <JsonLd
          data={collectionJsonLd({
            name: pageTitle,
            description: pageDescription,
            path: urlGenre(lang, params.genre),
            items: allRows,
          })}
        />
        <Breadcrumbs
          lang={lang}
          crumbs={[
            { label: "Play Miyazaki", href: urlHome(lang) },
            { label: lang === "ja" ? genre.ja : genre.en },
          ]}
        />

        <div className="space-y-3">
          <FeatureChips
            lang={lang}
            genre={params.genre}
            taxonomy={taxonomy}
            featureCounts={featCounts}
          />
          <CategoryChips
            lang={lang}
            genre={params.genre}
            taxonomy={taxonomy}
            categoryCounts={catCounts}
          />
          <AreaChips
            lang={lang}
            genre={params.genre}
            taxonomy={taxonomy}
            areaCounts={areaCounts}
          />
        </div>

        <FilteredCategoryGroups groups={groups} lang={lang} />
      </div>
    </>
  );
}
