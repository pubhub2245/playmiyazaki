import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listingsByGenre, loadTaxonomy } from "@/lib/data";
import { LANGS, type Lang } from "@/lib/i18n";
import { absolute, urlFeature, urlGenre, urlHome } from "@/lib/url";
import {
  areasWithListings,
  categoriesWithListings,
  featuresWithListings,
  genresWithListings,
  hasFeature,
} from "@/lib/coverage";
import { AreaChips, CategoryChips, areaCountsForGenre, categoryCountsForGenre } from "@/app/_components/FilterBar";
import { FeatureChips, featureCountsForGenre } from "@/app/_components/FeatureChips";
import { Breadcrumbs } from "@/app/_components/Breadcrumbs";
import { FilterableList } from "@/app/_components/FilterableList";
import { listingToRow } from "@/lib/rows";
import { JsonLd } from "@/app/_components/JsonLd";
import { collectionJsonLd } from "@/lib/jsonld";

type Props = { params: { lang: string; genre: string; feature: string } };

export const dynamicParams = false;

export function generateStaticParams() {
  const params: { lang: string; genre: string; feature: string }[] = [];
  for (const lang of LANGS) {
    for (const g of genresWithListings()) {
      for (const f of featuresWithListings(g)) {
        params.push({ lang, genre: g, feature: f });
      }
    }
  }
  return params;
}

export function generateMetadata({ params }: Props): Metadata {
  const lang = (params.lang === "en" ? "en" : "ja") as Lang;
  const taxonomy = loadTaxonomy();
  const genre = taxonomy.genres.find((g) => g.slug === params.genre);
  const feature = (taxonomy.features[params.genre] ?? []).find((f) => f.slug === params.feature);
  if (!genre || !feature) return {};
  const title = lang === "ja" ? feature.heading_ja : feature.heading_en;
  const description =
    lang === "ja"
      ? `出典で「${feature.ja}」と確認できた${genre.ja}スポットの一覧です。`
      : `Miyazaki ${genre.en.toLowerCase()} spots where "${feature.en.toLowerCase()}" is confirmed on the source.`;
  return {
    title,
    description,
    alternates: {
      canonical: absolute(urlFeature(lang, params.genre, params.feature)),
      languages: {
        ja: absolute(urlFeature("ja", params.genre, params.feature)),
        en: absolute(urlFeature("en", params.genre, params.feature)),
      },
    },
  };
}

export default function FeaturePage({ params }: Props) {
  const lang = (params.lang === "en" ? "en" : "ja") as Lang;
  const taxonomy = loadTaxonomy();
  const genre = taxonomy.genres.find((g) => g.slug === params.genre);
  const feature = (taxonomy.features[params.genre] ?? []).find((f) => f.slug === params.feature);
  if (!genre || !feature || !hasFeature(params.genre, params.feature)) notFound();

  const filtered = listingsByGenre(params.genre)
    .filter((l) => l.features.includes(params.feature))
    .sort((a, b) => {
      const aArea = taxonomy.areas.find((x) => x.slug === a.area)?.ja ?? a.area;
      const bArea = taxonomy.areas.find((x) => x.slug === b.area)?.ja ?? b.area;
      const areaCmp = aArea.localeCompare(bArea, "ja");
      if (areaCmp !== 0) return areaCmp;
      return a.name.ja.localeCompare(b.name.ja, "ja");
    });

  const areaCounts = areaCountsForGenre(filtered);
  const catCounts = categoryCountsForGenre(filtered);
  const featCounts = featureCountsForGenre(listingsByGenre(params.genre));
  // Reference these so unused-import warnings don't fire when we intentionally
  // don't render specific chip rows here.
  void areasWithListings(params.genre);
  void categoriesWithListings(params.genre);

  const items = filtered.map((l) => listingToRow(l, taxonomy, lang));
  const heading = lang === "ja" ? feature.heading_ja : feature.heading_en;
  const definition =
    lang === "ja"
      ? `出典で「${feature.ja}」と確認できた${genre.ja}スポットの一覧です。`
      : `Miyazaki ${genre.en.toLowerCase()} spots where "${feature.en.toLowerCase()}" is confirmed on the source.`;

  return (
    <div className="space-y-6">
      <JsonLd
        data={collectionJsonLd({
          name: heading,
          description: definition,
          path: urlFeature(lang, params.genre, params.feature),
          items,
        })}
      />
      <Breadcrumbs
        lang={lang}
        crumbs={[
          { label: "Play Miyazaki", href: urlHome(lang) },
          { label: lang === "ja" ? genre.ja : genre.en, href: urlGenre(lang, params.genre) },
          { label: lang === "ja" ? feature.ja : feature.en },
        ]}
      />
      <div>
        <h1 className="font-display font-bold text-[28px] leading-tight text-text-primary">
          {heading}
        </h1>
        <p className="pm-mono text-[12px] text-text-secondary mt-1">
          {filtered.length} {lang === "ja" ? "スポット" : "places"}
        </p>
        <p className="pm-prose mt-3">
          <span>{definition}</span>
        </p>
      </div>

      <div className="space-y-3">
        <FeatureChips
          lang={lang}
          genre={params.genre}
          taxonomy={taxonomy}
          activeFeature={params.feature}
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

      <FilterableList items={items} lang={lang} />
    </div>
  );
}
